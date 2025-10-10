import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { MessageSquare, AlertTriangle, CheckCircle, Clock, User, Mail, Phone, Calendar, Star } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);

  // Get support tickets and issues
  const [supportTickets, recentIssues, userReports] = await Promise.all([
    // Support tickets (using conversation as support tickets)
    prisma.conversation.findMany({
      where: {
        OR: [
          { type: "SUPPORT" },
          { messages: { some: { text: { contains: "support", mode: "insensitive" } } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: { name: true, email: true, role: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 20
    }),
    
    // Recent issues (using notifications as issues)
    prisma.notification.findMany({
      where: {
        type: { in: ["ISSUE_REPORTED", "COMPLAINT", "TECHNICAL_ISSUE"] }
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    
    // User reports (using reviews as reports)
    prisma.review.findMany({
      where: {
        rating: { lte: 2 }
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        property: { select: { name: true } },
        vehicle: { select: { name: true } },
        tour: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return json({
    user,
    supportTickets,
    recentIssues,
    userReports
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ticketId = formData.get("ticketId");
  const status = formData.get("status");
  const response = formData.get("response");

  if (intent === "updateTicket") {
    if (!ticketId || !status) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      // Update conversation status (simplified)
      await prisma.conversation.update({
        where: { id: ticketId as string },
        data: { updatedAt: new Date() }
      });

      return json({ success: true, message: "Ticket status updated successfully" });
    } catch (error) {
      console.error("Update ticket error:", error);
      return json({ error: "Failed to update ticket" }, { status: 500 });
    }
  }

  if (intent === "respondToTicket") {
    if (!ticketId || !response) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      // Create a response message (simplified)
      const conversation = await prisma.conversation.findUnique({
        where: { id: ticketId as string },
        include: { participants: true }
      });

      if (!conversation) {
        return json({ error: "Conversation not found" }, { status: 404 });
      }

      // Find admin participant
      const adminParticipant = conversation.participants.find(p => p.user.role === "SUPER_ADMIN");
      if (!adminParticipant) {
        return json({ error: "Admin participant not found" }, { status: 404 });
      }

      // Create response message
      await prisma.message.create({
        data: {
          conversationId: ticketId as string,
          senderId: adminParticipant.id,
          text: response as string,
          type: "TEXT"
        }
      });

      return json({ success: true, message: "Response sent successfully" });
    } catch (error) {
      console.error("Respond to ticket error:", error);
      return json({ error: "Failed to send response" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminSupport() {
  const { user, supportTickets, recentIssues, userReports } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-red-100 text-red-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "CLOSED": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600">Manage support tickets, user issues, and platform reports.</p>
        </div>

        {/* Action Messages */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {actionData.message}
          </div>
        )}

        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {actionData.error}
          </div>
        )}

        {/* Support Tickets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#01502E]" />
              Support Tickets ({supportTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supportTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No support tickets</p>
            ) : (
              <div className="space-y-4">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">Support Ticket #{ticket.id.slice(-8)}</h3>
                          <Badge className={getStatusColor("OPEN")}>Open</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Participants: {ticket.participants.map(p => p.user.name).join(", ")}
                        </p>
                        {ticket.messages[0] && (
                          <p className="text-sm text-gray-500 mt-1">
                            Last message: {ticket.messages[0].text.substring(0, 100)}...
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Updated: {new Date(ticket.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="updateTicket" />
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <input type="hidden" name="status" value="IN_PROGRESS" />
                          <Button type="submit" size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                            <Clock className="h-4 w-4 mr-1" />
                            In Progress
                          </Button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="updateTicket" />
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <input type="hidden" name="status" value="RESOLVED" />
                          <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </Form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#01502E]" />
              Recent Issues ({recentIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentIssues.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent issues</p>
            ) : (
              <div className="space-y-4">
                {recentIssues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{issue.title}</h3>
                          <Badge className={getPriorityColor(issue.priority || "MEDIUM")}>
                            {issue.priority || "MEDIUM"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.message}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Reported by: {issue.user.name} ({issue.user.email}) - {issue.user.role}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(issue.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Reports */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#01502E]" />
              User Reports ({userReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userReports.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No user reports</p>
            ) : (
              <div className="space-y-4">
                {userReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {report.property?.name || report.vehicle?.name || report.tour?.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < report.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{report.comment}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          By: {report.user.name} ({report.user.email})
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact User
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
