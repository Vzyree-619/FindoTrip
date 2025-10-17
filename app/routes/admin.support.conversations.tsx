import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MessageSquare, 
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
  AlertTriangle,
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
  AlertTriangle,
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
  ZoomOut
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const conversationType = url.searchParams.get('conversationType') || 'all';
  const status = url.searchParams.get('status') || 'all';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for conversations
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (conversationType !== 'all') {
    whereClause.conversationType = conversationType.toUpperCase();
  }
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get all conversations (support tickets, chat messages, etc.)
  const [conversations, totalCount] = await Promise.all([
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where: whereClause })
  ]);
  
  // Get conversation statistics
  const conversationStats = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'NEW' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { status: 'CLOSED' } })
  ]);
  
  // Get message statistics
  const messageStats = await Promise.all([
    prisma.supportMessage.count(),
    prisma.supportMessage.count({ 
      where: { 
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.supportMessage.count({ 
      where: { 
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ]);
  
  // Get user type statistics
  const userTypeStats = await Promise.all([
    prisma.supportTicket.count({ where: { user: { role: 'CUSTOMER' } } }),
    prisma.supportTicket.count({ where: { user: { role: 'PROPERTY_OWNER' } } }),
    prisma.supportTicket.count({ where: { user: { role: 'VEHICLE_OWNER' } } }),
    prisma.supportTicket.count({ where: { user: { role: 'TOUR_GUIDE' } } })
  ]);
  
  // Get category statistics
  const categoryStats = await Promise.all([
    prisma.supportTicket.count({ where: { category: 'ACCOUNT_ISSUES' } }),
    prisma.supportTicket.count({ where: { category: 'PAYMENT_PROBLEMS' } }),
    prisma.supportTicket.count({ where: { category: 'BOOKING_ISSUES' } }),
    prisma.supportTicket.count({ where: { category: 'TECHNICAL_ISSUES' } }),
    prisma.supportTicket.count({ where: { category: 'SERVICE_LISTING' } }),
    prisma.supportTicket.count({ where: { category: 'REVIEW_DISPUTES' } }),
    prisma.supportTicket.count({ where: { category: 'POLICY_QUESTIONS' } }),
    prisma.supportTicket.count({ where: { category: 'FEATURE_REQUESTS' } }),
    prisma.supportTicket.count({ where: { category: 'OTHER' } })
  ]);
  
  return json({
    admin,
    conversations,
    totalCount,
    conversationStats: {
      total: conversationStats[0],
      new: conversationStats[1],
      inProgress: conversationStats[2],
      resolved: conversationStats[3],
      closed: conversationStats[4]
    },
    messageStats: {
      total: messageStats[0],
      last24Hours: messageStats[1],
      last7Days: messageStats[2]
    },
    userTypeStats: {
      customers: userTypeStats[0],
      propertyOwners: userTypeStats[1],
      vehicleOwners: userTypeStats[2],
      tourGuides: userTypeStats[3]
    },
    categoryStats: {
      accountIssues: categoryStats[0],
      paymentProblems: categoryStats[1],
      bookingIssues: categoryStats[2],
      technicalIssues: categoryStats[3],
      serviceListing: categoryStats[4],
      reviewDisputes: categoryStats[5],
      policyQuestions: categoryStats[6],
      featureRequests: categoryStats[7],
      other: categoryStats[8]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, conversationType, status, dateFrom, dateTo }
  });
}

export default function AllConversations() {
  const { 
    admin, 
    conversations, 
    totalCount, 
    conversationStats, 
    messageStats, 
    userTypeStats, 
    categoryStats, 
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Conversations</h1>
          <p className="text-gray-600">Monitor all platform conversations and interactions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{conversationStats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{conversationStats.inProgress}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-gray-900">{conversationStats.new}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{conversationStats.resolved}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{conversationStats.closed}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Message Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Volume</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Messages</span>
              <span className="text-sm font-medium text-gray-900">{messageStats.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last 24 Hours</span>
              <span className="text-sm font-medium text-gray-900">{messageStats.last24Hours}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last 7 Days</span>
              <span className="text-sm font-medium text-gray-900">{messageStats.last7Days}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Types</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customers</span>
              <span className="text-sm font-medium text-gray-900">{userTypeStats.customers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Property Owners</span>
              <span className="text-sm font-medium text-gray-900">{userTypeStats.propertyOwners}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vehicle Owners</span>
              <span className="text-sm font-medium text-gray-900">{userTypeStats.vehicleOwners}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tour Guides</span>
              <span className="text-sm font-medium text-gray-900">{userTypeStats.tourGuides}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Issues</span>
              <span className="text-sm font-medium text-gray-900">{categoryStats.accountIssues}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Problems</span>
              <span className="text-sm font-medium text-gray-900">{categoryStats.paymentProblems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Booking Issues</span>
              <span className="text-sm font-medium text-gray-900">{categoryStats.bookingIssues}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Technical Issues</span>
              <span className="text-sm font-medium text-gray-900">{categoryStats.technicalIssues}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('status', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New ({conversationStats.new})</option>
              <option value="in_progress">In Progress ({conversationStats.inProgress})</option>
              <option value="resolved">Resolved ({conversationStats.resolved})</option>
              <option value="closed">Closed ({conversationStats.closed})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filters.conversationType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('conversationType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="support">Support Tickets</option>
              <option value="chat">Chat Messages</option>
              <option value="email">Email Conversations</option>
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
              placeholder="Search conversations..."
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
      
      {/* Conversations List */}
      <div className="space-y-4">
        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversations Found</h3>
            <p className="text-gray-600">No conversations match your current filters.</p>
          </Card>
        ) : (
          conversations.map((conversation) => {
            const CategoryIcon = getCategoryIcon(conversation.category);
            const lastMessage = conversation.messages[0];
            
            return (
              <Card key={conversation.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CategoryIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{conversation.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                        {conversation.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(conversation.user.role)}`}>
                        {conversation.user.role}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{conversation.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(conversation.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{conversation._count.messages} messages</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {conversation.assignedTo ? `Assigned to ${conversation.assignedTo.name}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{conversation.description}</p>
                    
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
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Join
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} conversations
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
