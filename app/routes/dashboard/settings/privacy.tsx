import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useFetcher } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  MessageCircle, 
  Users, 
  Ban,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      privacySettings: true,
      blockedUsers: {
        include: {
          blockedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Get users who have blocked this user
  const blockedBy = await prisma.userBlock.findMany({
    where: { blockedUserId: userId },
    include: {
      blocker: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return json({ user, blockedBy });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updatePrivacySettings") {
    const settings = {
      allowProviderMessages: formData.get("allowProviderMessages") === "on",
      showOnlineStatus: formData.get("showOnlineStatus") === "on",
      showReadReceipts: formData.get("showReadReceipts") === "on",
      allowMessageForwarding: formData.get("allowMessageForwarding") === "on",
      autoRespondWhenOffline: formData.get("autoRespondWhenOffline") === "on",
      autoRespondMessage: formData.get("autoRespondMessage") as string,
      allowCustomerMessages: formData.get("allowCustomerMessages") === "on",
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        privacySettings: settings,
      },
    });

    return json({ success: true, message: "Privacy settings updated successfully" });
  }

  if (intent === "blockUser") {
    const blockedUserId = formData.get("blockedUserId") as string;
    const reason = formData.get("reason") as string;

    if (!blockedUserId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if already blocked
    const existingBlock = await prisma.userBlock.findFirst({
      where: {
        blockerId: userId,
        blockedUserId,
      },
    });

    if (existingBlock) {
      return json({ error: "User is already blocked" }, { status: 400 });
    }

    await prisma.userBlock.create({
      data: {
        blockerId: userId,
        blockedUserId,
        reason: reason || "No reason provided",
        blockedAt: new Date(),
      },
    });

    return json({ success: true, message: "User blocked successfully" });
  }

  if (intent === "unblockUser") {
    const blockedUserId = formData.get("blockedUserId") as string;

    if (!blockedUserId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: userId,
        blockedUserId,
      },
    });

    return json({ success: true, message: "User unblocked successfully" });
  }

  if (intent === "exportData") {
    // Export user's chat data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        supportTicketsCreated: {
          include: {
            messages: {
              include: {
                sender: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Create export data
    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      supportTickets: user.supportTicketsCreated.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        createdAt: ticket.createdAt,
        messages: ticket.messages.map(message => ({
          id: message.id,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          sender: message.sender,
        })),
      })),
      exportedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="chat-data-export-${userId}.json"`,
      },
    });
  }

  if (intent === "deleteData") {
    const password = formData.get("password") as string;
    const confirmDelete = formData.get("confirmDelete") as string;

    if (confirmDelete !== "DELETE") {
      return json({ error: "Please type DELETE to confirm" }, { status: 400 });
    }

    // TODO: Verify password
    // const isValidPassword = await verifyPassword(userId, password);
    // if (!isValidPassword) {
    //   return json({ error: "Invalid password" }, { status: 400 });
    // }

    // Delete all user's support tickets and messages
    await prisma.supportMessage.deleteMany({
      where: {
        ticket: {
          providerId: userId,
        },
      },
    });

    await prisma.supportTicket.deleteMany({
      where: {
        providerId: userId,
      },
    });

    return json({ success: true, message: "All chat data deleted successfully" });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function PrivacySettings() {
  const { user, blockedBy } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [blockUserId, setBlockUserId] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const privacySettings = user.privacySettings || {};

  const isProvider = ["PROPERTY_OWNER", "VEHICLE_OWNER", "TOUR_GUIDE"].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy & Security Settings</h1>
          <p className="text-gray-600 mt-2">Control your chat privacy and security preferences</p>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        <div className="space-y-6">
          {/* Chat Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Chat Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form method="post">
                <input type="hidden" name="intent" value="updatePrivacySettings" />
                
                <div className="space-y-6">
                  {/* General Settings */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="showOnlineStatus"
                          defaultChecked={privacySettings.showOnlineStatus}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <span className="font-medium">Show online status</span>
                          <p className="text-sm text-gray-600">Let others see when you're online</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="showReadReceipts"
                          defaultChecked={privacySettings.showReadReceipts}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <span className="font-medium">Show read receipts</span>
                          <p className="text-sm text-gray-600">Let others know when you've read their messages</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="allowMessageForwarding"
                          defaultChecked={privacySettings.allowMessageForwarding}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <span className="font-medium">Allow message forwarding</span>
                          <p className="text-sm text-gray-600">Let others forward your messages</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Provider Settings */}
                  {isProvider && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Provider Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="allowCustomerMessages"
                            defaultChecked={privacySettings.allowCustomerMessages}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <span className="font-medium">Allow customers to message me</span>
                            <p className="text-sm text-gray-600">Enable customer support messages</p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="autoRespondWhenOffline"
                            defaultChecked={privacySettings.autoRespondWhenOffline}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <span className="font-medium">Auto-respond when offline</span>
                            <p className="text-sm text-gray-600">Send automatic response when you're not available</p>
                          </div>
                        </label>

                        {privacySettings.autoRespondWhenOffline && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Auto-response message</label>
                            <textarea
                              name="autoRespondMessage"
                              defaultValue={privacySettings.autoRespondMessage || "I'm currently offline. I'll respond as soon as possible."}
                              className="w-full p-3 border border-gray-300 rounded-md"
                              rows={3}
                              placeholder="Enter your auto-response message..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Settings */}
                  {!isProvider && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Customer Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="allowProviderMessages"
                            defaultChecked={privacySettings.allowProviderMessages}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <span className="font-medium">Allow providers to message me</span>
                            <p className="text-sm text-gray-600">Enable provider support messages</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <Button type="submit">
                    Save Privacy Settings
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>

          {/* Blocked Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ban className="h-5 w-5 mr-2" />
                Blocked Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Block New User */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Block a User</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowBlockForm(!showBlockForm)}
                  >
                    {showBlockForm ? "Cancel" : "Block User"}
                  </Button>
                </div>

                {showBlockForm && (
                  <Form method="post" className="space-y-4">
                    <input type="hidden" name="intent" value="blockUser" />
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">User ID or Email</label>
                      <Input
                        name="blockedUserId"
                        value={blockUserId}
                        onChange={(e) => setBlockUserId(e.target.value)}
                        placeholder="Enter user ID or email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
                      <textarea
                        name="reason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Why are you blocking this user?"
                      />
                    </div>

                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      Block User
                    </Button>
                  </Form>
                )}

                {/* Blocked Users List */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Currently Blocked Users</h3>
                  {user.blockedUsers.length === 0 ? (
                    <p className="text-gray-600">No blocked users</p>
                  ) : (
                    <div className="space-y-3">
                      {user.blockedUsers.map((block) => (
                        <div key={block.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium">{block.blockedUser.name}</p>
                            <p className="text-sm text-gray-600">{block.blockedUser.email}</p>
                            <p className="text-sm text-gray-500">Blocked: {new Date(block.blockedAt).toLocaleDateString()}</p>
                            {block.reason && (
                              <p className="text-sm text-gray-500">Reason: {block.reason}</p>
                            )}
                          </div>
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="unblockUser" />
                            <input type="hidden" name="blockedUserId" value={block.blockedUserId} />
                            <Button variant="outline" size="sm" type="submit">
                              Unblock
                            </Button>
                          </Form>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blocked By List */}
                {blockedBy.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Users Who Have Blocked You</h3>
                    <div className="space-y-3">
                      {blockedBy.map((block) => (
                        <div key={block.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium">{block.blocker.name}</p>
                            <p className="text-sm text-gray-600">{block.blocker.email}</p>
                            <p className="text-sm text-gray-500">Blocked you: {new Date(block.blockedAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="secondary">Blocked</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Export Data */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Export Your Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a copy of all your chat data in JSON format
                  </p>
                  <Form method="post">
                    <input type="hidden" name="intent" value="exportData" />
                    <Button variant="outline" type="submit">
                      Export Chat Data
                    </Button>
                  </Form>
                </div>

                {/* Delete Data */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2 text-red-600">Delete All Chat Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete all your chat messages and support tickets. This action cannot be undone.
                  </p>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteForm(!showDeleteForm)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {showDeleteForm ? "Cancel" : "Delete All Data"}
                  </Button>

                  {showDeleteForm && (
                    <Form method="post" className="mt-4 space-y-4">
                      <input type="hidden" name="intent" value="deleteData" />
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Type DELETE to confirm</label>
                        <Input
                          name="confirmDelete"
                          placeholder="DELETE"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <Input
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Permanently Delete All Data
                      </Button>
                    </Form>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
