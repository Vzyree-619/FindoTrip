import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  AlertTriangle, 
  Search,
  Filter,
  Download,
  Eye,
  User,
  Users,
  Calendar,
  Clock,
  Mail,
  Phone,
  Star,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  BarChart3,
  Shield,
  BookOpen,
  Globe,
  Award,
  Flag,
  Archive,
  Settings,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  Target,
  Timer,
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
  Tag,
  Priority,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive as ArchiveFile,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  MessageSquare
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const escalationType = url.searchParams.get('escalationType') || 'all';
  const priority = url.searchParams.get('priority') || 'all';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for escalated tickets
  const whereClause: any = {
    OR: [
      { priority: 'HIGH' },
      { escalatedAt: { not: null } },
      { escalationReason: { not: null } }
    ]
  };
  
  if (search) {
    whereClause.AND = [
      {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      }
    ];
  }
  
  if (escalationType !== 'all') {
    if (escalationType === 'auto') {
      whereClause.AND = [
        ...(whereClause.AND || []),
        { escalatedAt: { not: null } }
      ];
    } else if (escalationType === 'manual') {
      whereClause.AND = [
        ...(whereClause.AND || []),
        { escalatedBy: { not: null } }
      ];
    }
  }
  
  if (priority !== 'all') {
    whereClause.AND = [
      ...(whereClause.AND || []),
      { priority: priority.toUpperCase() }
    ];
  }
  
  if (dateFrom || dateTo) {
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        createdAt: {}
      }
    ];
    if (dateFrom) whereClause.AND[whereClause.AND.length - 1].createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.AND[whereClause.AND.length - 1].createdAt.lte = new Date(dateTo);
  }
  
  // Get escalated tickets
  const [tickets, totalCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            verified: true,
            isActive: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        escalatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { escalatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where: whereClause })
  ]);
  
  // Get escalation statistics
  const escalationStats = await Promise.all([
    prisma.supportTicket.count({ where: { priority: 'HIGH' } }),
    prisma.supportTicket.count({ where: { escalatedAt: { not: null } } }),
    prisma.supportTicket.count({ where: { escalatedBy: { not: null } } }),
    prisma.supportTicket.count({ 
      where: { 
        priority: 'HIGH',
        status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] }
      }
    })
  ]);
  
  // Get escalation reasons
  const escalationReasons = await prisma.supportTicket.groupBy({
    by: ['escalationReason'],
    where: { escalationReason: { not: null } },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 5
  });
  
  // Get average escalation time
  const avgEscalationTime = await prisma.supportTicket.aggregate({
    where: { escalatedAt: { not: null } },
    _avg: {
      escalatedAt: true
    }
  });
  
  // Get tickets requiring immediate attention
  const urgentTickets = await prisma.supportTicket.findMany({
    where: {
      priority: 'HIGH',
      status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] },
      createdAt: {
        lte: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
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
    take: 5
  });
  
  return json({
    admin,
    tickets,
    totalCount,
    escalationStats: {
      highPriority: escalationStats[0],
      autoEscalated: escalationStats[1],
      manuallyEscalated: escalationStats[2],
      urgent: escalationStats[3]
    },
    escalationReasons,
    avgEscalationTime: avgEscalationTime._avg.escalatedAt || 0,
    urgentTickets,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, escalationType, priority, dateFrom, dateTo }
  });
}

export default function EscalatedIssues() {
  const { 
    admin, 
    tickets, 
    totalCount, 
    escalationStats, 
    escalationReasons, 
    avgEscalationTime, 
    urgentTickets, 
    pagination, 
    filters 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'WAITING': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ACCOUNT_ISSUES': return User;
      case 'PAYMENT_PROBLEMS': return Star;
      case 'BOOKING_ISSUES': return Calendar;
      case 'TECHNICAL_ISSUES': return Wrench;
      case 'SERVICE_LISTING': return FileText;
      case 'REVIEW_DISPUTES': return Star;
      case 'POLICY_QUESTIONS': return HelpCircle;
      case 'FEATURE_REQUESTS': return Lightbulb;
      case 'OTHER': return MessageSquare;
      default: return MessageSquare;
    }
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800';
      case 'PROPERTY_OWNER': return 'bg-green-100 text-green-800';
      case 'VEHICLE_OWNER': return 'bg-purple-100 text-purple-800';
      case 'TOUR_GUIDE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escalated Issues</h1>
          <p className="text-gray-600">Manage high-priority escalated tickets requiring immediate attention</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{escalationStats.highPriority}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Auto Escalated</p>
              <p className="text-2xl font-bold text-gray-900">{escalationStats.autoEscalated}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Manually Escalated</p>
              <p className="text-2xl font-bold text-gray-900">{escalationStats.manuallyEscalated}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{escalationStats.urgent}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Urgent Tickets Alert */}
      {urgentTickets.length > 0 && (
        <Card className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Urgent Tickets Requiring Immediate Attention</h3>
          </div>
          <div className="space-y-3">
            {urgentTickets.map((ticket) => (
              <div key={ticket.id} className="p-3 bg-white rounded border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Customer: {ticket.user.name}</div>
                      <div>Assigned to: {ticket.assignedTo?.name || 'Unassigned'}</div>
                      <div>Created: {formatTimeSince(ticket.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-800">
                      ⚠️ Overdue
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Eye className="w-4 h-4 mr-1" />
                      View Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Escalation Reasons */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Escalation Reasons</h3>
        <div className="space-y-3">
          {escalationReasons.map((reason, index) => (
            <div key={reason.escalationReason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{reason.escalationReason}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {reason._count.id} tickets
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Escalation Type:</label>
            <select
              value={filters.escalationType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('escalationType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="auto">Auto Escalated</option>
              <option value="manual">Manually Escalated</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('priority', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Date From:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('dateFrom', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Date To:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('dateTo', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search escalated tickets..."
              value={filters.search}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('search', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Escalated Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Escalated Issues Found</h3>
            <p className="text-gray-600">No escalated tickets match your current filters.</p>
          </Card>
        ) : (
          tickets.map((ticket) => {
            const CategoryIcon = getCategoryIcon(ticket.category);
            const lastMessage = ticket.messages[0];
            
            return (
              <Card key={ticket.id} className="p-4 border-l-4 border-red-500">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <CategoryIcon className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(ticket.user.role)}`}>
                        {ticket.user.role}
                      </span>
                      {ticket.escalatedAt && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Escalated
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{ticket.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{ticket._count.messages} messages</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {ticket.assignedTo ? `Assigned to ${ticket.assignedTo.name}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    
                    {ticket.escalationReason && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-medium text-red-800 mb-1">Escalation Reason:</div>
                        <div className="text-sm text-red-700">{ticket.escalationReason}</div>
                        {ticket.escalatedBy && (
                          <div className="text-xs text-red-600 mt-1">
                            Escalated by {ticket.escalatedBy.name} on {new Date(ticket.escalatedAt!).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{ticket.description}</p>
                    
                    {lastMessage && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">
                            {lastMessage.sender.role === 'SUPER_ADMIN' ? 'Admin' : lastMessage.sender.name}
                          </span>
                          <span className="text-gray-500">
                            {new Date(lastMessage.createdAt).toLocaleString()}
                          </span>
                          {lastMessage.isInternal && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Internal
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2">{lastMessage.content}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Respond
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} escalated tickets
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page - 1).toString());
                setSearchParams(newParams);
              }}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page + 1).toString());
                setSearchParams(newParams);
              }}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
