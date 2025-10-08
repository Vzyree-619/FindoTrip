import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { getProviderChatMetrics } from "~/lib/utils/chat-analytics.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Users, 
  Star,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Award,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is property owner
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "PROPERTY_OWNER") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "30";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const metrics = await getProviderChatMetrics(userId, startDate, new Date());

  // Get platform averages for comparison
  const platformAverages = {
    averageResponseTime: 45, // minutes
    responseRate: 75, // percentage
    conversionRate: 20, // percentage
    customerSatisfaction: 4.0,
  };

  return json({ metrics, platformAverages, period });
}

export default function PropertyOwnerChatAnalytics() {
  const { metrics, platformAverages, period } = useLoaderData<typeof loader>();

  const getPerformanceColor = (value: number, platformValue: number, higherIsBetter: boolean = true) => {
    const diff = higherIsBetter ? value - platformValue : platformValue - value;
    if (diff > 0) return "text-green-600";
    if (diff < -10) return "text-red-600";
    return "text-yellow-600";
  };

  const getPerformanceIcon = (value: number, platformValue: number, higherIsBetter: boolean = true) => {
    const diff = higherIsBetter ? value - platformValue : platformValue - value;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < -10) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-yellow-600" />;
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getImprovementTips = () => {
    const tips = [];
    
    if (metrics.averageResponseTime > platformAverages.averageResponseTime) {
      tips.push("Try to respond to messages within 30 minutes to improve customer satisfaction");
    }
    
    if (metrics.responseRate < platformAverages.responseRate) {
      tips.push("Consider setting up auto-responses for when you're unavailable");
    }
    
    if (metrics.conversionRate < platformAverages.conversionRate) {
      tips.push("Focus on providing detailed information and quick responses to convert more inquiries");
    }
    
    if (metrics.customerSatisfaction < platformAverages.customerSatisfaction) {
      tips.push("Ask customers for feedback to understand how to improve your communication");
    }
    
    return tips;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chat Performance Analytics</h1>
          <p className="text-gray-600 mt-2">Track your communication performance and improve customer engagement</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.averageResponseTime, platformAverages.averageResponseTime, false)}`}>
                    {formatResponseTime(metrics.averageResponseTime)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getPerformanceIcon(metrics.averageResponseTime, platformAverages.averageResponseTime, false)}
                    <span className="text-xs text-gray-500 ml-1">
                      Platform avg: {formatResponseTime(platformAverages.averageResponseTime)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.responseRate, platformAverages.responseRate)}`}>
                    {Math.round(metrics.responseRate)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {getPerformanceIcon(metrics.responseRate, platformAverages.responseRate)}
                    <span className="text-xs text-gray-500 ml-1">
                      Platform avg: {platformAverages.responseRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.conversionRate, platformAverages.conversionRate)}`}>
                    {Math.round(metrics.conversionRate)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {getPerformanceIcon(metrics.conversionRate, platformAverages.conversionRate)}
                    <span className="text-xs text-gray-500 ml-1">
                      Platform avg: {platformAverages.conversionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.customerSatisfaction, platformAverages.customerSatisfaction)}`}>
                    {metrics.customerSatisfaction.toFixed(1)}/5
                  </p>
                  <div className="flex items-center mt-1">
                    {getPerformanceIcon(metrics.customerSatisfaction, platformAverages.customerSatisfaction)}
                    <span className="text-xs text-gray-500 ml-1">
                      Platform avg: {platformAverages.customerSatisfaction}/5
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Volume Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Message Volume Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Message volume chart would be rendered here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Total messages: {metrics.totalMessages}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Response Time Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Response time trend chart would be rendered here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Current average: {formatResponseTime(metrics.averageResponseTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Peak Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Peak Activity Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Your busiest messaging hours:</p>
                <div className="space-y-2">
                  {metrics.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {hour}:00 - {hour + 1}:00
                      </span>
                      <Badge variant="outline">
                        Peak {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Busiest Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Your most active days:</p>
                <div className="space-y-2">
                  {metrics.busiestDays.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day}</span>
                      <Badge variant="outline">
                        Active {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Improvement Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Performance Improvement Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getImprovementTips().length > 0 ? (
                <div className="space-y-3">
                  {getImprovementTips().map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Excellent Performance!</h3>
                  <p className="text-gray-600">
                    Your chat performance is above platform averages. Keep up the great work!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Your Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium">{formatResponseTime(metrics.averageResponseTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="text-sm font-medium">{Math.round(metrics.responseRate)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="text-sm font-medium">{Math.round(metrics.conversionRate)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Satisfaction</span>
                    <span className="text-sm font-medium">{metrics.customerSatisfaction.toFixed(1)}/5</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Platform Average</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium">{formatResponseTime(platformAverages.averageResponseTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="text-sm font-medium">{platformAverages.responseRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="text-sm font-medium">{platformAverages.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Satisfaction</span>
                    <span className="text-sm font-medium">{platformAverages.customerSatisfaction}/5</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
