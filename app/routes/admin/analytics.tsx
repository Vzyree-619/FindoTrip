import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3
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

  // Get analytics data
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total tickets
  const totalTickets = await prisma.supportTicket.count();

  // Resolved tickets
  const resolvedTickets = await prisma.supportTicket.count({
    where: { status: "RESOLVED" },
  });

  // Average response time (simplified calculation)
  const ticketsWithMessages = await prisma.supportTicket.findMany({
    where: {
      messages: {
        some: {
          sender: {
            role: "SUPER_ADMIN",
          },
        },
      },
    },
    include: {
      messages: {
        where: {
          sender: {
            role: "SUPER_ADMIN",
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  const avgResponseTime = ticketsWithMessages.length > 0
    ? ticketsWithMessages.reduce((sum, ticket) => {
        const firstAdminMessage = ticket.messages[0];
        if (firstAdminMessage) {
          const responseTime = firstAdminMessage.createdAt.getTime() - ticket.createdAt.getTime();
          return sum + responseTime;
        }
        return sum;
      }, 0) / ticketsWithMessages.length / (1000 * 60) // Convert to minutes
    : 0;

  // Average resolution time
  const resolvedTicketsWithTime = await prisma.supportTicket.findMany({
    where: {
      status: "RESOLVED",
      resolvedAt: { not: null },
    },
  });

  const avgResolutionTime = resolvedTicketsWithTime.length > 0
    ? resolvedTicketsWithTime.reduce((sum, ticket) => {
        const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
        return sum + resolutionTime;
      }, 0) / resolvedTicketsWithTime.length / (1000 * 60 * 60) // Convert to hours
    : 0;

  // Tickets by category
  const ticketsByCategory = await prisma.supportTicket.groupBy({
    by: ["category"],
    _count: {
      category: true,
    },
  });

  // Tickets by priority
  const ticketsByPriority = await prisma.supportTicket.groupBy({
    by: ["priority"],
    _count: {
      priority: true,
    },
  });

  // Average satisfaction
  const ratedTickets = await prisma.supportTicket.findMany({
    where: {
      satisfactionRating: { not: null },
    },
    select: {
      satisfactionRating: true,
    },
  });

  const avgSatisfaction = ratedTickets.length > 0
    ? ratedTickets.reduce((sum, ticket) => sum + (ticket.satisfactionRating || 0), 0) / ratedTickets.length
    : 0;

  // Recent activity (last 7 days)
  const recentTickets = await prisma.supportTicket.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const recentMessages = await prisma.supportMessage.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // Provider activity
  const activeProviders = await prisma.user.count({
    where: {
      role: { in: ["PROPERTY_OWNER", "VEHICLE_OWNER", "TOUR_GUIDE"] },
      supportTicketsCreated: {
        some: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
    },
  });

  // Escalated tickets
  const escalatedTickets = await prisma.supportTicket.count({
    where: { escalated: true },
  });

  // Open tickets
  const openTickets = await prisma.supportTicket.count({
    where: {
      status: { in: ["NEW", "IN_PROGRESS", "WAITING"] },
    },
  });

  return json({
    totalTickets,
    resolvedTickets,
    avgResponseTime: Math.round(avgResponseTime),
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    ticketsByCategory,
    ticketsByPriority,
    avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    totalRatings: ratedTickets.length,
    recentTickets,
    recentMessages,
    activeProviders,
    escalatedTickets,
    openTickets,
  });
}

export default function AdminAnalytics() {
  const {
    totalTickets,
    resolvedTickets,
    avgResponseTime,
    avgResolutionTime,
    ticketsByCategory,
    ticketsByPriority,
    avgSatisfaction,
    totalRatings,
    recentTickets,
    recentMessages,
    activeProviders,
    escalatedTickets,
    openTickets,
  } = useLoaderData<typeof loader>();

  const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into support performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{resolvedTickets}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{avgResponseTime}m</p>
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
                  <p className="text-2xl font-bold text-gray-900">{avgSatisfaction}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Resolution Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {resolutionRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Resolution Time</span>
                  <span className="text-lg font-bold text-blue-600">
                    {avgResolutionTime}h
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Open Tickets</span>
                  <span className="text-lg font-bold text-orange-600">
                    {openTickets}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Escalated Tickets</span>
                  <span className="text-lg font-bold text-red-600">
                    {escalatedTickets}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Provider Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Providers (30d)</span>
                  <span className="text-lg font-bold text-blue-600">
                    {activeProviders}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recent Tickets (7d)</span>
                  <span className="text-lg font-bold text-green-600">
                    {recentTickets}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recent Messages (7d)</span>
                  <span className="text-lg font-bold text-purple-600">
                    {recentMessages}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Ratings</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {totalRatings}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category and Priority Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Tickets by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticketsByCategory.map((category) => (
                  <div key={category.category} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {category.category.replace("_", " ")}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(category._count.category / totalTickets) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {category._count.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Tickets by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticketsByPriority.map((priority) => (
                  <div key={priority.priority} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {priority.priority}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            priority.priority === "URGENT" ? "bg-red-600" :
                            priority.priority === "HIGH" ? "bg-orange-600" :
                            priority.priority === "NORMAL" ? "bg-blue-600" :
                            "bg-gray-600"
                          }`}
                          style={{
                            width: `${(priority._count.priority / totalTickets) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {priority._count.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Satisfaction Insights */}
        {totalRatings > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Customer Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">
                    {avgSatisfaction}/5
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {totalRatings} ratings
                  </div>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(avgSatisfaction)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
