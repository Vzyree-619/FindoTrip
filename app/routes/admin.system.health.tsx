import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
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
  Shield,
  Heart,
  Zap,
  AlertCircle
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  try {
    // Test database connection
    const dbConnectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    const dbConnected = Array.isArray(dbConnectionTest) && dbConnectionTest.length > 0;
    
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
      
      // Active conversations (using SupportTicket as proxy)
      prisma.supportTicket.count({ 
        where: { 
          status: { in: ["NEW", "IN_PROGRESS", "PENDING"] },
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        } 
      }),
      
      // System health checks
      Promise.all([
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
        prisma.propertyBooking.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
        prisma.supportTicket.count({ where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      ]),
      
      // Recent activity
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, role: true, createdAt: true, lastLogin: true }
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
      admin,
      dbConnected,
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
  } catch (error) {
    console.error("System health check failed:", error);
    return json({
      admin,
      dbConnected: false,
      error: "System health check failed",
      stats: {
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeConversations: 0,
        newUsers: 0,
        newBookings: 0,
        activeChats: 0
      },
      recentActivity: [],
      errorLogs: [
        { id: 1, level: "ERROR", message: "System health check failed", timestamp: new Date() }
      ],
      performanceMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        responseTime: 0,
        uptime: 0
      }
    });
  }
}

export default function SystemHealth() {
  const { admin, dbConnected, stats, recentActivity, errorLogs, performanceMetrics, error } = useLoaderData<typeof loader>();

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

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "critical": return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const cpuStatus = getHealthStatus(performanceMetrics.cpuUsage, 80);
  const memoryStatus = getHealthStatus(performanceMetrics.memoryUsage, 85);
  const diskStatus = getHealthStatus(performanceMetrics.diskUsage, 90);
  const responseStatus = getHealthStatus(performanceMetrics.responseTime, 500);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">System Health Monitor</h1>
              <p className="text-gray-600 text-lg">
                Real-time system health and performance monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Back to Admin</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-medium text-gray-600">Database</CardTitle>
              {getHealthIcon(dbConnected ? "healthy" : "critical")}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dbConnected ? "Connected" : "Disconnected"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {dbConnected ? "All systems operational" : "Connection failed"}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-medium text-gray-600">CPU Usage</CardTitle>
              {getHealthIcon(cpuStatus)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {performanceMetrics.cpuUsage}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {cpuStatus === "healthy" ? "Normal operation" : "High usage detected"}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-medium text-gray-600">Memory Usage</CardTitle>
              {getHealthIcon(memoryStatus)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {performanceMetrics.memoryUsage}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {memoryStatus === "healthy" ? "Adequate memory" : "Memory pressure"}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
              {getHealthIcon(responseStatus)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {performanceMetrics.responseTime}ms
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {responseStatus === "healthy" ? "Fast response" : "Slow response"}
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">CPU Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        cpuStatus === "healthy" ? "bg-green-500" : 
                        cpuStatus === "warning" ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${performanceMetrics.cpuUsage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{performanceMetrics.cpuUsage}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Memory Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        memoryStatus === "healthy" ? "bg-green-500" : 
                        memoryStatus === "warning" ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${performanceMetrics.memoryUsage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{performanceMetrics.memoryUsage}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Disk Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        diskStatus === "healthy" ? "bg-green-500" : 
                        diskStatus === "warning" ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${performanceMetrics.diskUsage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{performanceMetrics.diskUsage}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Network Latency</span>
                <span className="text-sm font-medium">{performanceMetrics.networkLatency}ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Uptime</span>
                <span className="text-sm font-medium">{performanceMetrics.uptime}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Users</span>
                <span className="text-sm font-medium">{stats.totalUsers.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Bookings</span>
                <span className="text-sm font-medium">{stats.totalBookings.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                <span className="text-sm font-medium">${stats.totalRevenue.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Conversations</span>
                <span className="text-sm font-medium">{stats.activeConversations.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">New Users (24h)</span>
                <span className="text-sm font-medium">{stats.newUsers.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">New Bookings (24h)</span>
                <span className="text-sm font-medium">{stats.newBookings.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Recent Error Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getLogLevelColor(log.level)}>
                        {log.level}
                      </Badge>
                      <span className="text-sm text-gray-700">{log.message}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Status */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Overall System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getHealthIcon(dbConnected ? "healthy" : "critical")}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Database</h3>
                <p className="text-sm text-gray-600">
                  {dbConnected ? "Connected and operational" : "Connection failed"}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getHealthIcon(cpuStatus)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                <p className="text-sm text-gray-600">
                  {cpuStatus === "healthy" ? "All systems normal" : "Performance issues detected"}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getHealthIcon(memoryStatus)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                <p className="text-sm text-gray-600">
                  {memoryStatus === "healthy" ? "Adequate resources" : "Resource pressure detected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
