import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Timer,
  BarChart3,
  Activity,
  Users,
  Calendar,
  Star,
  Shield,
  Zap,
  Award,
  Flag,
  Download,
  Eye,
  Settings,
  Bell,
  BellOff,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle2,
  Clock3,
  AlertCircle,
  Info,
  HelpCircle,
  Bug,
  Wrench,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply,
  Forward,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  User,
  MessageSquare,
  Tag,
  Priority,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const priority = url.searchParams.get('priority') || 'all';
  
  // Set default date range if not provided
  const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = dateTo ? new Date(dateTo) : new Date();
  
  // Build where clause for SLA tracking
  const whereClause: any = {
    createdAt: {
      gte: fromDate,
      lte: toDate
    }
  };
  
  if (priority !== 'all') {
    whereClause.priority = priority.toUpperCase();
  }
  
  // Get SLA statistics
  const slaStats = await Promise.all([
    // Response time SLA compliance
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        responseTime: { lte: 2 * 60 * 60 * 1000 }, // 2 hours in milliseconds
        priority: 'HIGH'
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        responseTime: { lte: 24 * 60 * 60 * 1000 }, // 24 hours in milliseconds
        priority: 'MEDIUM'
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        responseTime: { lte: 48 * 60 * 60 * 1000 }, // 48 hours in milliseconds
        priority: 'LOW'
      }
    }),
    
    // Resolution time SLA compliance
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        resolutionTime: { lte: 4 * 60 * 60 * 1000 }, // 4 hours in milliseconds
        priority: 'HIGH',
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        resolutionTime: { lte: 48 * 60 * 60 * 1000 }, // 48 hours in milliseconds
        priority: 'MEDIUM',
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        resolutionTime: { lte: 7 * 24 * 60 * 60 * 1000 }, // 7 days in milliseconds
        priority: 'LOW',
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    
    // Total tickets by priority
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'HIGH'
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'MEDIUM'
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'LOW'
      }
    }),
    
    // Total resolved tickets by priority
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'HIGH',
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'MEDIUM',
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'LOW',
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    })
  ]);
  
  // Get average response and resolution times
  const avgTimes = await Promise.all([
    prisma.supportTicket.aggregate({
      where: { ...whereClause, priority: 'HIGH' },
      _avg: { responseTime: true }
    }),
    prisma.supportTicket.aggregate({
      where: { ...whereClause, priority: 'MEDIUM' },
      _avg: { responseTime: true }
    }),
    prisma.supportTicket.aggregate({
      where: { ...whereClause, priority: 'LOW' },
      _avg: { responseTime: true }
    }),
    prisma.supportTicket.aggregate({
      where: { 
        ...whereClause, 
        priority: 'HIGH',
        status: { in: ['RESOLVED', 'CLOSED'] }
      },
      _avg: { resolutionTime: true }
    }),
    prisma.supportTicket.aggregate({
      where: { 
        ...whereClause, 
        priority: 'MEDIUM',
        status: { in: ['RESOLVED', 'CLOSED'] }
      },
      _avg: { resolutionTime: true }
    }),
    prisma.supportTicket.aggregate({
      where: { 
        ...whereClause, 
        priority: 'LOW',
        status: { in: ['RESOLVED', 'CLOSED'] }
      },
      _avg: { resolutionTime: true }
    })
  ]);
  
  // Get tickets approaching SLA deadline
  const approachingDeadline = await prisma.supportTicket.findMany({
    where: {
      ...whereClause,
      status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] },
      OR: [
        {
          priority: 'HIGH',
          createdAt: { lte: new Date(Date.now() - 1.5 * 60 * 60 * 1000) } // 1.5 hours ago
        },
        {
          priority: 'MEDIUM',
          createdAt: { lte: new Date(Date.now() - 20 * 60 * 60 * 1000) } // 20 hours ago
        },
        {
          priority: 'LOW',
          createdAt: { lte: new Date(Date.now() - 40 * 60 * 60 * 1000) } // 40 hours ago
        }
      ]
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      assignedTo: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 10
  });
  
  // Get SLA violations
  const slaViolations = await Promise.all([
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'HIGH',
        responseTime: { gt: 2 * 60 * 60 * 1000 }
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'MEDIUM',
        responseTime: { gt: 24 * 60 * 60 * 1000 }
      }
    }),
    prisma.supportTicket.count({
      where: {
        ...whereClause,
        priority: 'LOW',
        responseTime: { gt: 48 * 60 * 60 * 1000 }
      }
    })
  ]);
  
  return json({
    admin,
    slaStats: {
      responseCompliance: {
        high: slaStats[0],
        medium: slaStats[1],
        low: slaStats[2]
      },
      resolutionCompliance: {
        high: slaStats[3],
        medium: slaStats[4],
        low: slaStats[5]
      },
      totalTickets: {
        high: slaStats[6],
        medium: slaStats[7],
        low: slaStats[8]
      },
      resolvedTickets: {
        high: slaStats[9],
        medium: slaStats[10],
        low: slaStats[11]
      }
    },
    avgTimes: {
      responseTime: {
        high: avgTimes[0]._avg.responseTime || 0,
        medium: avgTimes[1]._avg.responseTime || 0,
        low: avgTimes[2]._avg.responseTime || 0
      },
      resolutionTime: {
        high: avgTimes[3]._avg.resolutionTime || 0,
        medium: avgTimes[4]._avg.resolutionTime || 0,
        low: avgTimes[5]._avg.resolutionTime || 0
      }
    },
    approachingDeadline,
    slaViolations: {
      high: slaViolations[0],
      medium: slaViolations[1],
      low: slaViolations[2]
    },
    filters: { dateFrom, dateTo, priority }
  });
}

export default function SLATracking() {
  const { admin, slaStats, avgTimes, approachingDeadline, slaViolations, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const formatTime = (milliseconds: number) => {
    if (milliseconds === 0) return '0m';
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const calculateComplianceRate = (compliant: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((compliant / total) * 100);
  };
  
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getComplianceBgColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100';
    if (rate >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SLA Tracking</h1>
          <p className="text-gray-600">Monitor service level agreement compliance and performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* SLA Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Response SLA</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateComplianceRate(
                  slaStats.responseCompliance.high + slaStats.responseCompliance.medium + slaStats.responseCompliance.low,
                  slaStats.totalTickets.high + slaStats.totalTickets.medium + slaStats.totalTickets.low
                )}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution SLA</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateComplianceRate(
                  slaStats.resolutionCompliance.high + slaStats.resolutionCompliance.medium + slaStats.resolutionCompliance.low,
                  slaStats.resolvedTickets.high + slaStats.resolvedTickets.medium + slaStats.resolvedTickets.low
                )}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">SLA Violations</p>
              <p className="text-2xl font-bold text-gray-900">
                {slaViolations.high + slaViolations.medium + slaViolations.low}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Response Time SLA Compliance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time SLA Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">HIGH</div>
            <div className="text-sm text-gray-600 mb-2">Target: 2 hours</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getComplianceBgColor(calculateComplianceRate(slaStats.responseCompliance.high, slaStats.totalTickets.high))} ${getComplianceColor(calculateComplianceRate(slaStats.responseCompliance.high, slaStats.totalTickets.high))}`}>
              {calculateComplianceRate(slaStats.responseCompliance.high, slaStats.totalTickets.high)}% Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {slaStats.responseCompliance.high} / {slaStats.totalTickets.high} tickets
            </div>
            <div className="text-xs text-gray-500">
              Avg: {formatTime(avgTimes.responseTime.high)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">MEDIUM</div>
            <div className="text-sm text-gray-600 mb-2">Target: 24 hours</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getComplianceBgColor(calculateComplianceRate(slaStats.responseCompliance.medium, slaStats.totalTickets.medium))} ${getComplianceColor(calculateComplianceRate(slaStats.responseCompliance.medium, slaStats.totalTickets.medium))}`}>
              {calculateComplianceRate(slaStats.responseCompliance.medium, slaStats.totalTickets.medium)}% Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {slaStats.responseCompliance.medium} / {slaStats.totalTickets.medium} tickets
            </div>
            <div className="text-xs text-gray-500">
              Avg: {formatTime(avgTimes.responseTime.medium)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">LOW</div>
            <div className="text-sm text-gray-600 mb-2">Target: 48 hours</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getComplianceBgColor(calculateComplianceRate(slaStats.responseCompliance.low, slaStats.totalTickets.low))} ${getComplianceColor(calculateComplianceRate(slaStats.responseCompliance.low, slaStats.totalTickets.low))}`}>
              {calculateComplianceRate(slaStats.responseCompliance.low, slaStats.totalTickets.low)}% Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {slaStats.responseCompliance.low} / {slaStats.totalTickets.low} tickets
            </div>
            <div className="text-xs text-gray-500">
              Avg: {formatTime(avgTimes.responseTime.low)}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Resolution Time SLA Compliance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Time SLA Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">HIGH</div>
            <div className="text-sm text-gray-600 mb-2">Target: 4 hours</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getComplianceBgColor(calculateComplianceRate(slaStats.resolutionCompliance.high, slaStats.resolvedTickets.high))} ${getComplianceColor(calculateComplianceRate(slaStats.resolutionCompliance.high, slaStats.resolvedTickets.high))}`}>
              {calculateComplianceRate(slaStats.resolutionCompliance.high, slaStats.resolvedTickets.high)}% Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {slaStats.resolutionCompliance.high} / {slaStats.resolvedTickets.high} resolved
            </div>
            <div className="text-xs text-gray-500">
              Avg: {formatTime(avgTimes.resolutionTime.high)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">MEDIUM</div>
            <div className="text-sm text-gray-600 mb-2">Target: 48 hours</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getComplianceBgColor(calculateComplianceRate(slaStats.resolutionCompliance.medium, slaStats.resolvedTickets.medium))} ${getComplianceColor(calculateComplianceRate(slaStats.resolutionCompliance.medium, slaStats.resolvedTickets.medium))}`}>
              {calculateComplianceRate(slaStats.resolutionCompliance.medium, slaStats.resolvedTickets.medium)}% Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {slaStats.resolutionCompliance.medium} / {slaStats.resolvedTickets.medium} resolved
            </div>
            <div className="text-xs text-gray-500">
              Avg: {formatTime(avgTimes.resolutionTime.medium)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">LOW</div>
            <div className="text-sm text-gray-600 mb-2">Target: 7 days</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getComplianceBgColor(calculateComplianceRate(slaStats.resolutionCompliance.low, slaStats.resolvedTickets.low))} ${getComplianceColor(calculateComplianceRate(slaStats.resolutionCompliance.low, slaStats.resolvedTickets.low))}`}>
              {calculateComplianceRate(slaStats.resolutionCompliance.low, slaStats.resolvedTickets.low)}% Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {slaStats.resolutionCompliance.low} / {slaStats.resolvedTickets.low} resolved
            </div>
            <div className="text-xs text-gray-500">
              Avg: {formatTime(avgTimes.resolutionTime.low)}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tickets Approaching SLA Deadline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets Approaching SLA Deadline</h3>
        {approachingDeadline.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Good!</h3>
            <p className="text-gray-600">No tickets are approaching their SLA deadline.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approachingDeadline.map((ticket) => {
              const timeSinceCreated = Date.now() - new Date(ticket.createdAt).getTime();
              const hoursSinceCreated = Math.floor(timeSinceCreated / (1000 * 60 * 60));
              const minutesSinceCreated = Math.floor((timeSinceCreated % (1000 * 60 * 60)) / (1000 * 60));
              
              return (
                <div key={ticket.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Customer: {ticket.user.name}</div>
                        <div>Assigned to: {ticket.assignedTo?.name || 'Unassigned'}</div>
                        <div>Priority: {ticket.priority}</div>
                        <div>Created: {hoursSinceCreated}h {minutesSinceCreated}m ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-800">
                        {ticket.priority === 'HIGH' && '⚠️ 30m remaining'}
                        {ticket.priority === 'MEDIUM' && '⚠️ 4h remaining'}
                        {ticket.priority === 'LOW' && '⚠️ 8h remaining'}
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Eye className="w-4 h-4 mr-1" />
                        View Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      
      {/* SLA Violations Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Violations Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">{slaViolations.high}</div>
            <div className="text-sm text-gray-600">High Priority Violations</div>
            <div className="text-xs text-gray-500 mt-1">Response time > 2 hours</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-2">{slaViolations.medium}</div>
            <div className="text-sm text-gray-600">Medium Priority Violations</div>
            <div className="text-xs text-gray-500 mt-1">Response time > 24 hours</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-2">{slaViolations.low}</div>
            <div className="text-sm text-gray-600">Low Priority Violations</div>
            <div className="text-xs text-gray-500 mt-1">Response time > 48 hours</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
