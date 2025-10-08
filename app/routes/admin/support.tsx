import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useFetcher, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  MessageCircle, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  ArrowUp,
  ArrowDown
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

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const assignedTo = url.searchParams.get("assignedTo");
  const providerRole = url.searchParams.get("providerRole");
  const search = url.searchParams.get("search");

  // Build filters
  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedToId = assignedTo;
  if (providerRole) {
    where.provider = { role: providerRole };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { ticketNumber: { contains: search, mode: "insensitive" } },
      { provider: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Get support tickets
  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      provider: {
        select: {
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    take: 100,
  });

  // Get analytics
  const analytics = await prisma.supportAnalytics.findFirst({
    orderBy: {
      date: "desc",
    },
  });

  // Get admin users for assignment
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, name: true, email: true },
  });

  // Get response templates
  const templates = await prisma.responseTemplate.findMany({
    where: { isActive: true },
    orderBy: { usageCount: "desc" },
    take: 10,
  });

  return json({
    tickets,
    analytics,
    admins,
    templates,
    filters: {
      status,
      category,
      priority,
      assignedTo,
      providerRole,
      search,
    },
  });
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

  if (intent === "updateTicketStatus") {
    const ticketId = formData.get("ticketId") as string;
    const status = formData.get("status") as string;
    const resolution = formData.get("resolution") as string;

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: status as any,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
        resolvedBy: status === "RESOLVED" ? userId : null,
        resolution: status === "RESOLVED" ? resolution : null,
      },
    });

    return json({ success: true });
  }

  if (intent === "assignTicket") {
    const ticketId = formData.get("ticketId") as string;
    const assignedToId = formData.get("assignedToId") as string;

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: "IN_PROGRESS",
      },
    });

    return json({ success: true });
  }

  if (intent === "escalateTicket") {
    const ticketId = formData.get("ticketId") as string;
    const reason = formData.get("reason") as string;

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        escalated: true,
        escalatedAt: new Date(),
        escalatedBy: userId,
        priority: "URGENT",
      },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminSupport() {
  const { tickets, analytics, admins, templates, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: string, value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "WAITING": return "bg-orange-100 text-orange-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "CLOSED": return "bg-gray-100 text-gray-800";
      case "ESCALATED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-gray-100 text-gray-800";
      case "NORMAL": return "bg-blue-100 text-blue-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "URGENT": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Manage provider support tickets and conversations</p>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalTickets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.resolvedTickets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.avgResponseTime}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.avgSatisfaction.toFixed(1)}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Support Tickets</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search tickets..."
                        value={filters.search || ""}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.status || ""}
                        onChange={(e) => updateFilter("status", e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="NEW">New</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING">Waiting</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                        <option value="ESCALATED">Escalated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.category || ""}
                        onChange={(e) => updateFilter("category", e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option value="ACCOUNT_ISSUES">Account Issues</option>
                        <option value="APPROVAL_QUESTIONS">Approval Questions</option>
                        <option value="TECHNICAL_SUPPORT">Technical Support</option>
                        <option value="PAYMENT_ISSUES">Payment Issues</option>
                        <option value="POLICY_QUESTIONS">Policy Questions</option>
                        <option value="FEATURE_REQUEST">Feature Request</option>
                        <option value="BUG_REPORT">Bug Report</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.priority || ""}
                        onChange={(e) => updateFilter("priority", e.target.value)}
                      >
                        <option value="">All Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Provider Type</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.providerRole || ""}
                        onChange={(e) => updateFilter("providerRole", e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="PROPERTY_OWNER">Property Owner</option>
                        <option value="VEHICLE_OWNER">Vehicle Owner</option>
                        <option value="TOUR_GUIDE">Tour Guide</option>
                      </select>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTicket === ticket.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedTicket(ticket.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{ticket.title}</h3>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace("_", " ")}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>#{ticket.ticketNumber}</span>
                            <span>•</span>
                            <span>{ticket.provider.name}</span>
                            <span>•</span>
                            <span>{ticket.category.replace("_", " ")}</span>
                            <span>•</span>
                            <span>{ticket._count.messages} messages</span>
                          </div>

                          {ticket.messages[0] && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {ticket.messages[0].content}
                            </p>
                          )}
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          <div>{new Date(ticket.lastMessageAt).toLocaleDateString()}</div>
                          {ticket.assignedTo && (
                            <div className="text-blue-600">{ticket.assignedTo.name}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <TicketDetails 
                ticketId={selectedTicket} 
                admins={admins}
                templates={templates}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Ticket</h3>
                  <p className="text-gray-600">
                    Choose a support ticket from the list to view details and respond
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ticket Details Component
function TicketDetails({ ticketId, admins, templates }: { ticketId: string; admins: any[]; templates: any[] }) {
  const fetcher = useFetcher();
  const [newMessage, setNewMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  useEffect(() => {
    fetcher.load(`/api/support/ticket/${ticketId}`);
  }, [ticketId]);

  const ticket = fetcher.data?.ticket;

  if (!ticket) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const formData = new FormData();
    formData.append("intent", "sendMessage");
    formData.append("ticketId", ticketId);
    formData.append("content", newMessage);
    if (selectedTemplate) {
      formData.append("templateId", selectedTemplate);
    }

    fetcher.submit(formData, { method: "post" });
    setNewMessage("");
    setSelectedTemplate("");
  };

  const handleUpdateStatus = (status: string) => {
    const formData = new FormData();
    formData.append("intent", "updateTicketStatus");
    formData.append("ticketId", ticketId);
    formData.append("status", status);

    fetcher.submit(formData, { method: "post" });
  };

  const handleAssignTicket = (adminId: string) => {
    const formData = new FormData();
    formData.append("intent", "assignTicket");
    formData.append("ticketId", ticketId);
    formData.append("assignedToId", adminId);

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ticket Details</span>
          <Badge className="bg-blue-100 text-blue-800">
            #{ticket.ticketNumber}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Provider Info */}
        <div>
          <h4 className="font-medium mb-2">Provider Information</h4>
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium">{ticket.provider.name}</p>
            <p className="text-sm text-gray-600">{ticket.provider.email}</p>
            <p className="text-sm text-gray-600">{ticket.provider.role.replace("_", " ")}</p>
            <p className="text-sm text-gray-600">
              Joined: {new Date(ticket.provider.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleUpdateStatus(e.target.value)}
              value=""
            >
              <option value="">Update Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING">Waiting</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleAssignTicket(e.target.value)}
              value=""
            >
              <option value="">Assign to Admin</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Response Templates */}
        <div>
          <h4 className="font-medium mb-2">Quick Responses</h4>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="">Select Template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message Input */}
        <div>
          <h4 className="font-medium mb-2">Send Message</h4>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md"
            rows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your response..."
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || fetcher.state === "submitting"}
            className="w-full mt-2"
          >
            {fetcher.state === "submitting" ? "Sending..." : "Send Message"}
          </Button>
        </div>

        {/* Messages */}
        <div>
          <h4 className="font-medium mb-2">Conversation</h4>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {ticket.messages.map((message: any) => (
              <div
                key={message.id}
                className={`p-3 rounded ${
                  message.sender.role === "SUPER_ADMIN"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">{message.sender.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
