import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  ServerCog, 
  Activity, 
  Database, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  
  // Get system statistics
  const [
    totalUsers,
    totalBookings,
    totalRevenue,
    activeConversations,
    systemHealth,
    recentActivity,
    errorLogs,
    performanceMetrics
  ] = await Promise.all([
    // User statistics
    prisma.user.count(),
    
    // Booking statistics
    Promise.all([
      prisma.propertyBooking.count(),
      prisma.vehicleBooking.count(),
      prisma.tourBooking.count()
    ]),
    
    // Revenue calculation
    prisma.propertyBooking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { totalPrice: true }
    }),
    
    // Active conversations
    prisma.conversation.count({ 
      where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } 
    }),
    
    // System health checks
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.propertyBooking.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.conversation.count({ where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    ]),
    
    // Recent activity
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, role: true, createdAt: true, lastLoginAt: true }
    }),
    
    // Mock error logs (in a real system, this would come from a logging service)
    [
      { id: 1, level: "ERROR", message: "Database connection timeout", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: 2, level: "WARNING", message: "High memory usage detected", timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { id: 3, level: "INFO", message: "Scheduled backup completed", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ],
    
    // Mock performance metrics
    {
      cpuUsage: 45,
      memoryUsage: 67,
      diskUsage: 23,
      networkLatency: 12,
      responseTime: 150,
      uptime: 99.9
    }
  ]);

  const totalBookingsCount = totalBookings[0] + totalBookings[1] + totalBookings[2];
  const totalRevenueAmount = totalRevenue._sum.totalPrice || 0;
  const [newUsers, newBookings, activeChats] = systemHealth;

  return json({ 
    user,
    stats: {
      totalUsers,
      totalBookings: totalBookingsCount,
      totalRevenue: totalRevenueAmount,
      activeConversations,
      newUsers,
      newBookings,
      activeChats
    },
    recentActivity,
    errorLogs,
    performanceMetrics
  });
}

export default function SystemMonitoring() {
  const { user, stats, recentActivity, errorLogs, performanceMetrics } = useLoaderData<typeof loader>();

  const getHealthStatus = (value: number, threshold: number) => {
    return value > threshold ? "critical" : value > threshold * 0.8 ? "warning" : "healthy";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "bg-red-100 text-red-800";
      case "WARNING": return "bg-yellow-100 text-yellow-800";
      case "INFO": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ServerCog className="w-8 h-8 text-[#01502E]" />
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          </div>
          <p className="text-gray-600">Monitor system health, performance, and activity</p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600">+{stats.newUsers} today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  <p className="text-xs text-green-600">+{stats.newBookings} today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Chats</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
                  <p className="text-xs text-blue-600">Last 24h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#01502E]" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performanceMetrics.cpuUsage}%</span>
                    <Badge className={getStatusColor(getHealthStatus(performanceMetrics.cpuUsage, 80))}>
                      {getHealthStatus(performanceMetrics.cpuUsage, 80)}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performanceMetrics.memoryUsage}%</span>
                    <Badge className={getStatusColor(getHealthStatus(performanceMetrics.memoryUsage, 85))}>
                      {getHealthStatus(performanceMetrics.memoryUsage, 85)}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Disk Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performanceMetrics.diskUsage}%</span>
                    <Badge className={getStatusColor(getHealthStatus(performanceMetrics.diskUsage, 90))}>
                      {getHealthStatus(performanceMetrics.diskUsage, 90)}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network Latency</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performanceMetrics.networkLatency}ms</span>
                    <Badge className={getStatusColor(getHealthStatus(performanceMetrics.networkLatency, 100))}>
                      {getHealthStatus(performanceMetrics.networkLatency, 100)}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performanceMetrics.responseTime}ms</span>
                    <Badge className={getStatusColor(getHealthStatus(performanceMetrics.responseTime, 500))}>
                      {getHealthStatus(performanceMetrics.responseTime, 500)}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performanceMetrics.uptime}%</span>
                    <Badge className="bg-green-100 text-green-800">
                      excellent
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#01502E]" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getLogLevelColor(log.level)}>
                        {log.level}
                      </Badge>
                      <span className="text-sm">{log.message}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#01502E]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#01502E] text-white rounded-full flex items-center justify-center">
                      {activity.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last login: {activity.lastLoginAt ? new Date(activity.lastLoginAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#01502E]" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Manage database operations</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/database">Database Tools</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#01502E]" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Monitor security and access</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/security">Security Center</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-[#01502E]" />
                Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Network and connectivity</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/network">Network Status</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
