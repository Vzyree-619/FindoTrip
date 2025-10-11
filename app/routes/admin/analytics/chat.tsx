import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { getPlatformChatMetrics } from "~/lib/utils/chat-analytics.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Award
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
  const period = url.searchParams.get("period") || "30";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const metrics = await getPlatformChatMetrics(startDate, new Date());

  return json({ metrics, period });
}

export default function AdminChatAnalytics() {
  const { metrics, period } = useLoaderData<typeof loader>();

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPerformanceColor = (value: number, threshold: number, higherIsBetter: boolean = true) => {
    const isGood = higherIsBetter ? value >= threshold : value <= threshold;
    return isGood ? "text-green-600" : "text-red-600";
  };

  const getPerformanceIcon = (value: number, threshold: number, higherIsBetter: boolean = true) => {
    const isGood = higherIsBetter ? value >= threshold : value <= threshold;
    return isGood ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chat Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into platform chat performance</p>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalMessages.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatResponseTime(metrics.averageResponseTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.conversionRate)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Response Time by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.responseTimeByRole).map(([role, time]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{role.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(time, 60, false)}
                      <span className={`text-sm font-medium ${getPerformanceColor(time, 60, false)}`}>
                        {formatResponseTime(time)}
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
                <TrendingUp className="h-5 w-5 mr-2" />
                Peak Usage Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.peakUsageTimes.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {hour}:00 - {hour + 1}:00
                      </span>
                    </div>
                    <Badge variant="outline">
                      Peak {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Ticket Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Support Ticket Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.supportTicketMetrics.totalTickets}
                </div>
                <div className="text-sm text-gray-600">Total Tickets</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.supportTicketMetrics.averageResolutionTime}h
                </div>
                <div className="text-sm text-gray-600">Avg Resolution Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.supportTicketMetrics.firstResponseTime}h
                </div>
                <div className="text-sm text-gray-600">First Response Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.supportTicketMetrics.customerSatisfaction}/5
                </div>
                <div className="text-sm text-gray-600">Customer Satisfaction</div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Tickets by Category</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(metrics.supportTicketMetrics.ticketsByCategory).map(([category, count]) => (
                  <div key={category} className="text-center p-3 border border-gray-200 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{category.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Chat Usage</span>
                  <div className="flex items-center space-x-2">
                    {getPerformanceIcon(metrics.userEngagement.customerChatUsage, 70)}
                    <span className={`text-sm font-medium ${getPerformanceColor(metrics.userEngagement.customerChatUsage, 70)}`}>
                      {metrics.userEngagement.customerChatUsage}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Provider Response &lt; 1h</span>
                  <div className="flex items-center space-x-2">
                    {getPerformanceIcon(metrics.userEngagement.providerResponseRate1Hour, 60)}
                    <span className={`text-sm font-medium ${getPerformanceColor(metrics.userEngagement.providerResponseRate1Hour, 60)}`}>
                      {metrics.userEngagement.providerResponseRate1Hour}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Provider Response &lt; 24h</span>
                  <div className="flex items-center space-x-2">
                    {getPerformanceIcon(metrics.userEngagement.providerResponseRate24Hours, 85)}
                    <span className={`text-sm font-medium ${getPerformanceColor(metrics.userEngagement.providerResponseRate24Hours, 85)}`}>
                      {metrics.userEngagement.providerResponseRate24Hours}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Messages/Conversation</span>
                  <span className="text-sm font-medium">{metrics.userEngagement.averageMessagesPerConversation}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Conversation Duration</span>
                  <span className="text-sm font-medium">{metrics.userEngagement.averageConversationDuration}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Conversion Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chat Inquiries to Bookings</span>
                  <span className="text-sm font-medium">{metrics.conversionMetrics.chatInquiriesToBookings}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue from Chat</span>
                  <span className="text-sm font-medium">${metrics.conversionMetrics.revenueFromChat.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Booking Value (Chat)</span>
                  <span className="text-sm font-medium">${metrics.conversionMetrics.averageBookingValueChat}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Booking Value (No Chat)</span>
                  <span className="text-sm font-medium">${metrics.conversionMetrics.averageBookingValueNoChat}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Top Performing Providers</h4>
                <div className="space-y-2">
                  {metrics.conversionMetrics.topPerformingProviders.map((provider, index) => (
                    <div key={provider.providerId} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{provider.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{provider.chatEngagement}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quality Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {metrics.qualityMetrics.flaggedMessages}
                </div>
                <div className="text-sm text-gray-600">Flagged Messages</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {metrics.qualityMetrics.abuseReports}
                </div>
                <div className="text-sm text-gray-600">Abuse Reports</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {metrics.qualityMetrics.userBlocks}
                </div>
                <div className="text-sm text-gray-600">User Blocks</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {metrics.qualityMetrics.deletedConversations}
                </div>
                <div className="text-sm text-gray-600">Deleted Conversations</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {metrics.qualityMetrics.averageMessageLength}
                </div>
                <div className="text-sm text-gray-600">Avg Message Length</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {metrics.qualityMetrics.professionalTonePercentage}%
                </div>
                <div className="text-sm text-gray-600">Professional Tone</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">System Status</div>
                <div className="text-sm text-gray-600">All systems operational</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">Message Queue</div>
                <div className="text-sm text-gray-600">Processing normally</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">WebSocket Connections</div>
                <div className="text-sm text-gray-600">Stable</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
