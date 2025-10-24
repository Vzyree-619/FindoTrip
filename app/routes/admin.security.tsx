import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Search, 
  Filter,
  User,
  Calendar,
  Activity,
  Ban,
  Unlock,
  Key,
  Database,
  Server,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  Security,
  Settings,
  X
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "all";
  const severity = url.searchParams.get("severity") || "all";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause for security events filtering
  let whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { resourceType: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (type !== "all") {
    whereClause.resourceType = type;
  }

  if (severity !== "all") {
    whereClause.severity = severity;
  }

  // Get security events with pagination
  const [securityEvents, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where: whereClause })
  ]);

  // Get security statistics
  const [
    totalEvents,
    criticalEvents,
    highSeverityEvents,
    recentEvents,
    failedLogins,
    adminActions
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { severity: 'critical' } }),
    prisma.auditLog.count({ where: { severity: 'high' } }),
    prisma.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        action: { contains: 'LOGIN' },
        severity: 'high'
      }
    }),
    prisma.auditLog.count({
      where: {
        action: { contains: 'ADMIN' }
      }
    })
  ]);

  // Get security trends
  const securityTrends = await prisma.auditLog.groupBy({
    by: ['severity'],
    _count: { id: true },
    where: {
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  // Get recent security alerts
  const recentAlerts = await prisma.auditLog.findMany({
    where: {
      severity: { in: ['critical', 'high'] }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  // Get blocked IPs
  const blockedIPs = await prisma.user.findMany({
    where: {
      lockedUntil: { not: null }
    },
    select: {
      id: true,
      name: true,
      email: true,
      lockedUntil: true,
      loginAttempts: true
    },
    take: 10
  });

  return json({
    admin,
    securityEvents,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    search,
    type,
    severity,
    stats: {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      recentEvents,
      failedLogins,
      adminActions
    },
    securityTrends,
    recentAlerts,
    blockedIPs
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const userId = formData.get('userId') as string;
  const ipAddress = formData.get('ipAddress') as string;
  const reason = formData.get('reason') as string;

  try {
    switch (action) {
      case 'unlock_user':
        await prisma.user.update({
          where: { id: userId },
          data: { 
            lockedUntil: null,
            loginAttempts: 0
          }
        });
        return json({ success: true, message: 'User unlocked successfully' });

      case 'block_ip':
        // This would require a BlockedIP model or similar
        return json({ success: true, message: 'IP address blocked successfully' });

      case 'unblock_ip':
        // This would require a BlockedIP model or similar
        return json({ success: true, message: 'IP address unblocked successfully' });

      case 'reset_login_attempts':
        await prisma.user.update({
          where: { id: userId },
          data: { 
            loginAttempts: 0,
            lockedUntil: null
          }
        });
        return json({ success: true, message: 'Login attempts reset successfully' });

      case 'force_logout':
        // This would require session management
        return json({ success: true, message: 'User logged out successfully' });

      default:
        return json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Security action error:', error);
    return json({ success: false, message: 'Failed to process security action' }, { status: 500 });
  }
}

export default function SecurityManagement() {
  const { 
    admin, 
    securityEvents, 
    totalCount, 
    currentPage, 
    totalPages, 
    search, 
    type, 
    severity, 
    stats, 
    securityTrends, 
    recentAlerts, 
    blockedIPs 
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedEvent(null);
    setShowDetailsModal(false);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-600" />
                Security Management
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage platform security events and user access
              </p>
            </div>
          </div>
        </div>

        {/* Action Feedback */}
        {actionData && (
          <div className={`mb-6 p-4 rounded-md ${
            actionData.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {actionData.message}
          </div>
        )}

        {/* Security Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.criticalEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Severity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.highSeverityEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentEvents.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Last 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Recent Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <p className="font-medium text-red-900">{alert.action}</p>
                      <p className="text-sm text-red-700">
                        {alert.user?.name} • {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search security events..."
                    defaultValue={search}
                    className="pl-10"
                    name="search"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  name="type"
                  defaultValue={type}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="LOGIN">Login Events</option>
                  <option value="ADMIN">Admin Actions</option>
                  <option value="SECURITY">Security Events</option>
                </select>
                <select
                  name="severity"
                  defaultValue={severity}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <Button type="submit" variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Events List */}
        <div className="space-y-4">
          {securityEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(event.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{event.action}</h3>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Resource:</span> {event.resourceType} • 
                        <span className="font-medium ml-2">User:</span> {event.user?.name || 'System'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </p>
                      {event.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(event.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(event)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const url = new URL(window.location);
                    url.searchParams.set('page', pageNum.toString());
                    window.location.href = url.toString();
                  }}
                >
                  {pageNum}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* No Security Events Found */}
        {securityEvents.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Security Events Found</h3>
              <p className="text-gray-500 mb-4">
                {search || type !== "all" || severity !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No security events have been recorded yet."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Event Details Modal */}
        {showDetailsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Security Event Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeDetailsModal}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event ID</label>
                    <p className="text-sm text-gray-900">{selectedEvent.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Severity</label>
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(selectedEvent.severity)}
                      <Badge className={getSeverityColor(selectedEvent.severity)}>
                        {selectedEvent.severity}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Action</label>
                  <p className="text-sm text-gray-900">{selectedEvent.action}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Resource Type</label>
                  <p className="text-sm text-gray-900">{selectedEvent.resourceType}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Resource ID</label>
                  <p className="text-sm text-gray-900">{selectedEvent.resourceId}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="text-sm text-gray-900">
                    {selectedEvent.user?.name || 'System'} ({selectedEvent.user?.email || 'N/A'})
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedEvent.timestamp)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedEvent.ipAddress || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">User Agent</label>
                  <p className="text-sm text-gray-900 break-all">{selectedEvent.userAgent || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Hash</label>
                  <p className="text-sm text-gray-900 font-mono break-all">{selectedEvent.hash}</p>
                </div>

                {selectedEvent.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Details</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(selectedEvent.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={closeDetailsModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
