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
  MessageCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import SupportChat from "~/components/support/SupportChat";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  // Build filters
  const where: any = { providerId: userId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { ticketNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get support tickets for the provider
  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
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
  });

  // Get unread message count
  const unreadCount = await prisma.supportMessage.count({
    where: {
      ticket: {
        providerId: userId,
      },
      isRead: false,
      senderId: { not: userId },
    },
  });

  return json({
    tickets,
    unreadCount,
    filters: { status, search },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "createTicket") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;

    if (!title || !description) {
      return json({ error: "Title and description are required" }, { status: 400 });
    }

    const ticketNumber = `ST${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        title,
        description,
        category: category as any,
        priority: priority as any,
        status: "NEW",
        providerId: userId,
      },
      include: {
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Create initial system message
    await prisma.supportMessage.create({
      data: {
        content: `Support ticket created: ${title}`,
        type: "SYSTEM",
        ticketId: ticket.id,
        senderId: userId,
        systemData: {
          action: "ticket_created",
          category,
          priority,
        },
      },
    });

    return json({ success: true, ticket });
  }

  if (intent === "sendMessage") {
    const ticketId = formData.get("ticketId") as string;
    const content = formData.get("content") as string;
    const templateId = formData.get("templateId") as string;

    if (!ticketId || !content) {
      return json({ error: "Ticket ID and content are required" }, { status: 400 });
    }

    // Check if user has access to this ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { providerId: true },
    });

    if (!ticket || ticket.providerId !== userId) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    const message = await prisma.supportMessage.create({
      data: {
        content,
        type: "TEXT",
        ticketId,
        senderId: userId,
        templateId: templateId || null,
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // Update ticket last message time
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return json({ success: true, message });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ProviderSupport() {
  const { tickets, unreadCount, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

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

  const handleOpenChat = (ticket?: any) => {
    setSelectedTicket(ticket);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedTicket(null);
  };

  const handleTicketCreated = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
              <p className="text-gray-600 mt-2">Get help with your account and services</p>
            </div>
            <Button onClick={() => handleOpenChat()}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter(t => !["RESOLVED", "CLOSED"].includes(t.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Support Tickets</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-10 w-64"
                  />
                </div>
                <select className="p-2 border border-gray-300 rounded-md">
                  <option value="">All Status</option>
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING">Waiting</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets</h3>
                <p className="text-gray-600 mb-4">
                  You haven't created any support tickets yet
                </p>
                <Button onClick={() => handleOpenChat()}>
                  Create Your First Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                    onClick={() => handleOpenChat(ticket)}
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
                          <span>{ticket.category.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{ticket._count.messages} messages</span>
                          {ticket.assignedTo && (
                            <>
                              <span>•</span>
                              <span>Assigned to: {ticket.assignedTo.name}</span>
                            </>
                          )}
                        </div>

                        {ticket.messages[0] && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {ticket.messages[0].content}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(ticket.lastMessageAt).toLocaleDateString()}</div>
                        <div>{new Date(ticket.lastMessageAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">How do I get my property approved?</h4>
                <p className="text-sm text-gray-600">
                  Submit all required documents including property photos, ownership proof, and insurance documents. Our team will review within 24-48 hours.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">When will I receive my payouts?</h4>
                <p className="text-sm text-gray-600">
                  Payouts are processed weekly on Fridays. You'll receive your earnings within 3-5 business days after the payout date.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">How do I update my profile information?</h4>
                <p className="text-sm text-gray-600">
                  Go to your dashboard settings and update your profile. Changes to business information may require re-verification.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">What if I have a technical issue?</h4>
                <p className="text-sm text-gray-600">
                  Contact our technical support team through the support chat. Include screenshots and detailed description of the issue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Chat Modal */}
      <SupportChat
        ticket={selectedTicket}
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}
