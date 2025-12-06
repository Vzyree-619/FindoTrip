import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useFetcher } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { 
  Plus, 
  Send, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const broadcasts = await prisma.supportBroadcast.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get provider counts by role
  const providerCounts = await prisma.user.groupBy({
    by: ["role"],
    where: {
      role: { in: ["PROPERTY_OWNER", "VEHICLE_OWNER", "TOUR_GUIDE"] },
    },
    _count: {
      role: true,
    },
  });

  return json({ broadcasts, providerCounts });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "createBroadcast") {
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const category = formData.get("category") as string;
    const targetRoles = formData.getAll("targetRoles") as string[];
    const targetProviders = formData.getAll("targetProviders") as string[];
    const scheduledAt = formData.get("scheduledAt") as string;
    const expiresAt = formData.get("expiresAt") as string;

    if (!title || !message) {
      return json({ error: "Title and message are required" }, { status: 400 });
    }

    const broadcast = await prisma.supportBroadcast.create({
      data: {
        title,
        message,
        category: category || null,
        targetRoles: targetRoles as any[],
        targetProviders,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: userId,
      },
    });

    // If not scheduled, send immediately
    if (!scheduledAt) {
      await sendBroadcastToProviders(broadcast.id);
    }

    return json({ success: true, broadcast });
  }

  if (intent === "sendBroadcast") {
    const broadcastId = formData.get("broadcastId") as string;

    if (!broadcastId) {
      return json({ error: "Broadcast ID is required" }, { status: 400 });
    }

    await sendBroadcastToProviders(broadcastId);
    return json({ success: true });
  }

  if (intent === "deleteBroadcast") {
    const broadcastId = formData.get("broadcastId") as string;

    if (!broadcastId) {
      return json({ error: "Broadcast ID is required" }, { status: 400 });
    }

    await prisma.supportBroadcast.delete({
      where: { id: broadcastId },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

async function sendBroadcastToProviders(broadcastId: string) {
  const broadcast = await prisma.supportBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!broadcast) return;

  // Get target providers
  const where: any = {};
  if (broadcast.targetRoles.length > 0) {
    where.role = { in: broadcast.targetRoles };
  }
  if (broadcast.targetProviders.length > 0) {
    where.id = { in: broadcast.targetProviders };
  }

  const providers = await prisma.user.findMany({
    where,
    select: { id: true, name: true, role: true },
  });

  // Create system messages in all provider support tickets
  for (const provider of providers) {
    // Get or create a support ticket for the provider
    let ticket = await prisma.supportTicket.findFirst({
      where: {
        providerId: provider.id,
        status: { in: ["NEW", "IN_PROGRESS", "WAITING"] },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    if (!ticket) {
      // Create a new ticket for the broadcast
      const ticketNumber = `ST${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          title: `System Announcement: ${broadcast.title}`,
          description: broadcast.message,
          category: "SYSTEM_ANNOUNCEMENT" as any,
          priority: "NORMAL" as any,
          status: "NEW" as any,
          providerId: provider.id,
        },
      });
    }

    // Create system message
    await prisma.supportMessage.create({
      data: {
        content: `📢 **${broadcast.title}**\n\n${broadcast.message}`,
        type: "SYSTEM" as any,
        ticketId: ticket.id,
        senderId: broadcast.createdById,
        systemData: {
          action: "broadcast",
          broadcastId: broadcast.id,
          broadcastTitle: broadcast.title,
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: "SYSTEM_ANNOUNCEMENT" as any,
        title: "System Announcement",
        message: broadcast.title,
        userId: provider.id,
        userRole: provider.role as any,
        actionUrl: `/dashboard/support/${ticket.id}`,
        data: {
          broadcastId: broadcast.id,
          broadcastTitle: broadcast.title,
        },
      },
    });
  }

  // Update broadcast delivery status
  await prisma.supportBroadcast.update({
    where: { id: broadcastId },
    data: {
      deliveredTo: providers.map(p => p.id),
    },
  });
}

export default function AdminBroadcast() {
  const { broadcasts, providerCounts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "",
    targetRoles: [] as string[],
    targetProviders: [] as string[],
    scheduledAt: "",
    expiresAt: "",
  });

  const handleCreateBroadcast = () => {
    setFormData({
      title: "",
      message: "",
      category: "",
      targetRoles: [],
      targetProviders: [],
      scheduledAt: "",
      expiresAt: "",
    });
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is handled by Remix
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        targetRoles: [...prev.targetRoles, role],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        targetRoles: prev.targetRoles.filter(r => r !== role),
      }));
    }
  };

  const getStatusColor = (broadcast: any) => {
    if (broadcast.expiresAt && new Date(broadcast.expiresAt) < new Date()) {
      return "bg-gray-100 text-gray-800";
    }
    if (broadcast.scheduledAt && new Date(broadcast.scheduledAt) > new Date()) {
      return "bg-blue-100 text-blue-800";
    }
    if (broadcast.deliveredTo.length > 0) {
      return "bg-green-100 text-green-800";
    }
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (broadcast: any) => {
    if (broadcast.expiresAt && new Date(broadcast.expiresAt) < new Date()) {
      return "Expired";
    }
    if (broadcast.scheduledAt && new Date(broadcast.scheduledAt) > new Date()) {
      return "Scheduled";
    }
    if (broadcast.deliveredTo.length > 0) {
      return "Delivered";
    }
    return "Pending";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Broadcast Messages</h1>
              <p className="text-gray-600 mt-2">Send announcements to providers</p>
            </div>
            <Button onClick={handleCreateBroadcast}>
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Button>
          </div>
        </div>

        {/* Provider Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {providerCounts.map((count) => (
            <Card key={count.role}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {count.role.replace("_", " ")}s
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count._count.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Broadcasts List */}
        <div className="space-y-4">
          {broadcasts.map((broadcast) => (
            <Card key={broadcast.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{broadcast.title}</h3>
                      <Badge className={getStatusColor(broadcast)}>
                        {getStatusText(broadcast)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{broadcast.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created by {broadcast.createdBy.name}</span>
                      <span>•</span>
                      <span>{new Date(broadcast.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Delivered to {broadcast.deliveredTo.length} providers</span>
                      {broadcast.scheduledAt && (
                        <>
                          <span>•</span>
                          <span>Scheduled for {new Date(broadcast.scheduledAt).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {broadcast.scheduledAt && new Date(broadcast.scheduledAt) > new Date() && (
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="sendBroadcast" />
                        <input type="hidden" name="broadcastId" value={broadcast.id} />
                        <Button variant="outline" size="sm" type="submit">
                          <Send className="h-3 w-3 mr-1" />
                          Send Now
                        </Button>
                      </Form>
                    )}
                    
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="deleteBroadcast" />
                      <input type="hidden" name="broadcastId" value={broadcast.id} />
                      <Button variant="outline" size="sm" type="submit" className="text-red-600 hover:text-red-700">
                        Delete
                      </Button>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Broadcast Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Create New Broadcast</CardTitle>
              </CardHeader>

              <CardContent>
                <Form method="post" onSubmit={handleSubmit}>
                  <input type="hidden" name="intent" value="createBroadcast" />

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., New Policy Update"
                        required
                      />
                    </div>

                    <div>
                      <Label className="mb-2">Message</Label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full"
                        rows={6}
                        placeholder="Enter your announcement message..."
                        required
                      />
                    </div>

                    <div>
                      <Label className="mb-2">Category (Optional)</Label>
                      <Input
                        name="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Policy Update, Maintenance, Feature Release"
                      />
                    </div>

                    <div>
                      <Label className="mb-2">Target Audience</Label>
                      <div className="space-y-2">
                        {providerCounts.map((count) => (
                          <label key={count.role} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="targetRoles"
                              value={count.role}
                              checked={formData.targetRoles.includes(count.role)}
                              onChange={(e) => handleRoleChange(count.role, e.target.checked)}
                            />
                            <span className="text-sm">
                              {count.role.replace("_", " ")}s ({count._count.role})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2">Schedule (Optional)</Label>
                        <Input
                          type="datetime-local"
                          name="scheduledAt"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2">Expires (Optional)</Label>
                        <Input
                          type="datetime-local"
                          name="expiresAt"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreating(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Send className="h-4 w-4 mr-2" />
                        Create Broadcast
                      </Button>
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Broadcast created successfully!
          </div>
        )}

        {actionData?.error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}
      </div>
    </div>
  );
}
