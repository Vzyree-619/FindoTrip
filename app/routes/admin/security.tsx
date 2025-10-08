import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Flag,
  Clock,
  Users,
  MessageSquare,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
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

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get security metrics
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    totalMessages,
    messagesLast24h,
    abuseReports,
    abuseReportsLast24h,
    flaggedUsers,
    userViolations,
    securityEvents,
    rateLimitViolations,
    failedLogins,
    blockedFileUploads,
    suspiciousActivity
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastActiveAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.user.count({
      where: {
        suspendedUntil: {
          gte: now,
        },
      },
    }),
    prisma.user.count({
      where: {
        banned: true,
      },
    }),
    prisma.supportMessage.count(),
    prisma.supportMessage.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.abuseReport.count(),
    prisma.abuseReport.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.userFlag.count(),
    prisma.userViolation.count(),
    prisma.chatAuditLog.count({
      where: {
        severity: { in: ['high', 'critical'] },
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.chatAuditLog.count({
      where: {
        action: 'rate_limit_exceeded',
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.chatAuditLog.count({
      where: {
        action: 'failed_login',
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.chatAuditLog.count({
      where: {
        action: 'file_upload_blocked',
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.chatAuditLog.count({
      where: {
        action: 'suspicious_activity',
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
  ]);

  // Get recent security events
  const recentSecurityEvents = await prisma.chatAuditLog.findMany({
    where: {
      severity: { in: ['high', 'critical'] },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 20,
  });

  // Get abuse reports by reason
  const abuseReportsByReason = await prisma.abuseReport.groupBy({
    by: ['reason'],
    _count: {
      reason: true,
    },
  });

  // Get user violations by type
  const violationsByType = await prisma.userViolation.groupBy({
    by: ['violationType'],
    _count: {
      violationType: true,
    },
  });

  // Get flagged users by severity
  const flaggedUsersBySeverity = await prisma.userFlag.groupBy({
    by: ['severity'],
    _count: {
      severity: true,
    },
  });

  // Get security trends (last 7 days)
  const securityTrends = await prisma.chatAuditLog.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: last7Days,
      },
      severity: { in: ['high', 'critical'] },
    },
    _count: {
      id: true,
    },
  });

  return json({
    metrics: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      totalMessages,
      messagesLast24h,
      abuseReports,
      abuseReportsLast24h,
      flaggedUsers,
      userViolations,
      securityEvents,
      rateLimitViolations,
      failedLogins,
      blockedFileUploads,
      suspiciousActivity,
    },
    recentSecurityEvents,
    abuseReportsByReason,
    violationsByType,
    flaggedUsersBySeverity,
    securityTrends,
  });
}

export default function AdminSecurity() {
  const {
    metrics,
    recentSecurityEvents,
    abuseReportsByReason,
    violationsByType,
    flaggedUsersBySeverity,
    securityTrends,
  } = useLoaderData<typeof loader>();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEventIcon = (action: string) => {
    switch (action) {
      case "rate_limit_exceeded": return <Clock className="h-4 w-4 text-orange-500" />;
      case "abuse_reported": return <Flag className="h-4 w-4 text-red-500" />;
      case "user_flagged": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "user_suspended": return <Ban className="h-4 w-4 text-red-500" />;
      case "user_banned": return <XCircle className="h-4 w-4 text-red-500" />;
      case "failed_login": return <Shield className="h-4 w-4 text-red-500" />;
      case "suspicious_activity": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor security events and system health</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.suspendedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Banned</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.bannedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Abuse Reports (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.abuseReportsLast24h}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Flagged Users</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.flaggedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Security Events (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.securityEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rate Limit Violations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.rateLimitViolations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSecurityEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{event.action.replace('_', ' ')}</span>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        User: {event.user?.name || 'System'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Abuse Reports by Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flag className="h-5 w-5 mr-2" />
                Abuse Reports by Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {abuseReportsByReason.map((report) => (
                  <div key={report.reason} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {report.reason.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(report._count.reason / metrics.abuseReports) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {report._count.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Messages (24h)</span>
                  <span className="text-lg font-bold text-green-600">
                    {metrics.messagesLast24h}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Failed Logins (24h)</span>
                  <span className={`text-lg font-bold ${metrics.failedLogins > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.failedLogins}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Blocked File Uploads</span>
                  <span className={`text-lg font-bold ${metrics.blockedFileUploads > 5 ? 'text-orange-600' : 'text-green-600'}`}>
                    {metrics.blockedFileUploads}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Suspicious Activity</span>
                  <span className={`text-lg font-bold ${metrics.suspiciousActivity > 3 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.suspiciousActivity}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                User Violations by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {violationsByType.map((violation) => (
                  <div key={violation.violationType} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {violation.violationType.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${(violation._count.violationType / metrics.userViolations) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {violation._count.violationType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts */}
        {(metrics.securityEvents > 0 || metrics.rateLimitViolations > 10 || metrics.suspiciousActivity > 3) && (
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Security Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.securityEvents > 0 && (
                  <p className="text-sm text-red-700">
                    ⚠️ {metrics.securityEvents} high/critical security events in the last 24 hours
                  </p>
                )}
                {metrics.rateLimitViolations > 10 && (
                  <p className="text-sm text-red-700">
                    ⚠️ {metrics.rateLimitViolations} rate limit violations detected
                  </p>
                )}
                {metrics.suspiciousActivity > 3 && (
                  <p className="text-sm text-red-700">
                    ⚠️ {metrics.suspiciousActivity} suspicious activities detected
                  </p>
                )}
                {metrics.failedLogins > 20 && (
                  <p className="text-sm text-red-700">
                    ⚠️ {metrics.failedLogins} failed login attempts in the last 24 hours
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
