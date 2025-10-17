import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MessageSquare, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  BarChart3,
  Shield,
  BookOpen,
  Globe,
  Award,
  Flag,
  Archive,
  Trash2,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
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
  Zap,
  Target,
  Timer,
  User,
  Users,
  Calendar,
  Tag,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const priority = url.searchParams.get('priority') || 'all';
  const category = url.searchParams.get('category') || 'all';
  const assignedTo = url.searchParams.get('assignedTo') || 'all';
  const userType = url.searchParams.get('userType') || 'all';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const sort = url.searchParams.get('sort') || 'newest';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for support tickets
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }
  
  if (priority !== 'all') {
    whereClause.priority = priority.toUpperCase();
  }
  
  if (category !== 'all') {
    whereClause.category = category.toUpperCase();
  }
  
  if (assignedTo !== 'all') {
    if (assignedTo === 'unassigned') {
      whereClause.assignedTo = null;
    } else {
      whereClause.assignedTo = assignedTo;
    }
  }
  
  if (userType !== 'all') {
    whereClause.user = {
      role: userType.toUpperCase()
    };
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get support tickets with detailed information
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
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : 
               sort === 'oldest' ? { createdAt: 'asc' } :
               sort === 'priority' ? { priority: 'desc' } :
               sort === 'status' ? { status: 'asc' } :
               { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where: whereClause })
  ]);
  
  // Get ticket statistics
  const stats = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'NEW' } }),
    prisma.supportTicket.count({ where: { status: 'ASSIGNED' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'WAITING' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    prisma.supportTicket.count()
  ]);
  
  // Get priority statistics
  const priorityStats = await Promise.all([
    prisma.supportTicket.count({ where: { priority: 'HIGH' } }),
    prisma.supportTicket.count({ where: { priority: 'MEDIUM' } }),
    prisma.supportTicket.count({ where: { priority: 'LOW' } })
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
  
  // Get average response time
  const avgResponseTime = await prisma.supportTicket.aggregate({
    where: { status: { in: ['RESOLVED', 'CLOSED'] } },
    _avg: { responseTime: true }
  });
  
  return json({
    admin,
    tickets,
    totalCount,
    stats: {
      new: stats[0],
      assigned: stats[1],
      inProgress: stats[2],
      waiting: stats[3],
      resolved: stats[4],
      closed: stats[5],
      total: stats[6]
    },
    priorityStats: {
      high: priorityStats[0],
      medium: priorityStats[1],
      low: priorityStats[2]
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
    avgResponseTime: avgResponseTime._avg.responseTime || 0,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, priority, category, assignedTo, userType, dateFrom, dateTo, sort }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const ticketId = formData.get('ticketId') as string;
  const message = formData.get('message') as string;
  const priority = formData.get('priority') as string;
  const status = formData.get('status') as string;
  const assignedTo = formData.get('assignedTo') as string;
  const resolutionSummary = formData.get('resolutionSummary') as string;
  const closingNotes = formData.get('closingNotes') as string;
  const escalationReason = formData.get('escalationReason') as string;
  const moreInfoRequest = formData.get('moreInfoRequest') as string;
  
  try {
    if (action === 'mark_resolved') {
      // Mark ticket as resolved
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionSummary
        }
      });
      
      // Add resolution message
      if (message) {
        await prisma.supportMessage.create({
          data: {
            ticketId: ticketId,
            senderId: admin.id,
            senderType: 'ADMIN',
            content: message,
            isInternal: false
          }
        });
      }
      
      await logAdminAction(admin.id, 'MARK_TICKET_RESOLVED', `Marked ticket ${ticketId} as resolved`, request);
      
    } else if (action === 'close_ticket') {
      // Close ticket
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'CLOSED',
          closedAt: new Date(),
          closingNotes
        }
      });
      
      // Add closing message
      if (message) {
        await prisma.supportMessage.create({
          data: {
            ticketId: ticketId,
            senderId: admin.id,
            senderType: 'ADMIN',
            content: message,
            isInternal: false
          }
        });
      }
      
      await logAdminAction(admin.id, 'CLOSE_TICKET', `Closed ticket ${ticketId}`, request);
      
    } else if (action === 'request_more_info') {
      // Request more information
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'WAITING',
          waitingForUserAt: new Date()
        }
      });
      
      // Add message requesting more info
      if (message) {
        await prisma.supportMessage.create({
          data: {
            ticketId: ticketId,
            senderId: admin.id,
            senderType: 'ADMIN',
            content: message,
            isInternal: false
          }
        });
      }
      
      await logAdminAction(admin.id, 'REQUEST_MORE_INFO', `Requested more info for ticket ${ticketId}`, request);
      
    } else if (action === 'escalate') {
      // Escalate ticket
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          priority: 'HIGH',
          escalatedAt: new Date(),
          escalationReason,
          escalatedBy: admin.id
        }
      });
      
      // Add escalation message
      if (message) {
        await prisma.supportMessage.create({
          data: {
            ticketId: ticketId,
            senderId: admin.id,
            senderType: 'ADMIN',
            content: message,
            isInternal: true
          }
        });
      }
      
      await logAdminAction(admin.id, 'ESCALATE_TICKET', `Escalated ticket ${ticketId}`, request);
      
    } else if (action === 'assign_ticket') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          assignedTo: assignedTo,
          status: 'ASSIGNED',
          assignedAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'ASSIGN_TICKET', `Assigned ticket ${ticketId} to ${assignedTo}`, request);
      
    } else if (action === 'update_status') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: status }
      });
      
      await logAdminAction(admin.id, 'UPDATE_TICKET_STATUS', `Updated ticket ${ticketId} status to ${status}`, request);
      
    } else if (action === 'update_priority') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { priority: priority }
      });
      
      await logAdminAction(admin.id, 'UPDATE_TICKET_PRIORITY', `Updated ticket ${ticketId} priority to ${priority}`, request);
      
    } else if (action === 'add_message') {
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: message,
          isInternal: false
        }
      });
      
      await logAdminAction(admin.id, 'ADD_TICKET_MESSAGE', `Added message to ticket ${ticketId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Support ticket action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function StatusActions() {
  const { admin, tickets, totalCount, stats, priorityStats, categoryStats, avgResponseTime, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; ticketId: string; title: string }>({
    open: false,
    action: '',
    ticketId: '',
    title: ''
  });
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [moreInfoRequest, setMoreInfoRequest] = useState('');
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(t => t.id));
    }
  };
  
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };
  
  const handleTicketAction = (action: string, ticketId: string, title: string) => {
    setActionModal({ open: true, action, ticketId, title });
  };
  
  const executeAction = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', actionModal.action);
    formDataToSubmit.append('ticketId', actionModal.ticketId);
    if (message) formDataToSubmit.append('message', message);
    if (priority) formDataToSubmit.append('priority', priority);
    if (status) formDataToSubmit.append('status', status);
    if (assignedTo) formDataToSubmit.append('assignedTo', assignedTo);
    if (resolutionSummary) formDataToSubmit.append('resolutionSummary', resolutionSummary);
    if (closingNotes) formDataToSubmit.append('closingNotes', closingNotes);
    if (escalationReason) formDataToSubmit.append('escalationReason', escalationReason);
    if (moreInfoRequest) formDataToSubmit.append('moreInfoRequest', moreInfoRequest);
    fetcher.submit(formDataToSubmit, { method: 'post' });
    
    setActionModal({ open: false, action: '', ticketId: '', title: '' });
    setMessage('');
    setPriority('');
    setStatus('');
    setAssignedTo('');
    setResolutionSummary('');
    setClosingNotes('');
    setEscalationReason('');
    setMoreInfoRequest('');
  };
  
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Status Actions</h1>
          <p className="text-gray-600">Manage ticket status changes and actions</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedTickets.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedTickets.length})
            </Button>
          )}
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Timer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Waiting</p>
              <p className="text-2xl font-bold text-gray-900">{stats.waiting}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={() => handleTicketAction('mark_resolved', '', 'Mark as Resolved')}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Resolved
          </Button>
          
          <Button
            onClick={() => handleTicketAction('close_ticket', '', 'Close Ticket')}
            className="bg-gray-600 hover:bg-gray-700"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Close Ticket
          </Button>
          
          <Button
            onClick={() => handleTicketAction('request_more_info', '', 'Request More Info')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Request More Info
          </Button>
          
          <Button
            onClick={() => handleTicketAction('escalate', '', 'Escalate')}
            className="bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Escalate
          </Button>
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
              <option value="new">New ({stats.new})</option>
              <option value="assigned">Assigned ({stats.assigned})</option>
              <option value="in_progress">In Progress ({stats.inProgress})</option>
              <option value="waiting">Waiting ({stats.waiting})</option>
              <option value="resolved">Resolved ({stats.resolved})</option>
              <option value="closed">Closed ({stats.closed})</option>
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
              <option value="high">High ({priorityStats.high})</option>
              <option value="medium">Medium ({priorityStats.medium})</option>
              <option value="low">Low ({priorityStats.low})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('category', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="account_issues">Account Issues</option>
              <option value="payment_problems">Payment Problems</option>
              <option value="booking_issues">Booking Issues</option>
              <option value="technical_issues">Technical Issues</option>
              <option value="service_listing">Service Listing</option>
              <option value="review_disputes">Review Disputes</option>
              <option value="policy_questions">Policy Questions</option>
              <option value="feature_requests">Feature Requests</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">User Type:</label>
            <select
              value={filters.userType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('userType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Users</option>
              <option value="customer">Customers</option>
              <option value="property_owner">Property Owners</option>
              <option value="vehicle_owner">Vehicle Owners</option>
              <option value="tour_guide">Tour Guides</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              value={filters.sort}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sort', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tickets..."
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
      
      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-600">No tickets match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedTickets.length === tickets.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({tickets.length} tickets)
              </span>
            </div>
            
            {tickets.map((ticket) => {
              const CategoryIcon = getCategoryIcon(ticket.category);
              
              return (
                <Card key={ticket.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket.id)}
                      onChange={() => handleSelectTicket(ticket.id)}
                      className="rounded"
                    />
                    
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CategoryIcon className="w-6 h-6 text-gray-600" />
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{ticket.user.name} ({ticket.user.role})</span>
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
                      
                      <p className="text-sm text-gray-700 line-clamp-2">{ticket.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleTicketAction('mark_resolved', ticket.id, 'Mark as Resolved')}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      
                      <Button
                        onClick={() => handleTicketAction('close_ticket', ticket.id, 'Close Ticket')}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-600 hover:bg-gray-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                      
                      <Button
                        onClick={() => handleTicketAction('request_more_info', ticket.id, 'Request More Info')}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        More Info
                      </Button>
                      
                      <Button
                        onClick={() => handleTicketAction('escalate', ticket.id, 'Escalate')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{actionModal.title}</h3>
              <Button
                variant="outline"
                onClick={() => setActionModal({ open: false, action: '', ticketId: '', title: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {actionModal.action === 'mark_resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Summary
                  </label>
                  <textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe how the issue was resolved..."
                  />
                </div>
              )}
              
              {actionModal.action === 'close_ticket' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Notes
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any closing notes..."
                  />
                </div>
              )}
              
              {actionModal.action === 'request_more_info' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Information Request
                  </label>
                  <textarea
                    value={moreInfoRequest}
                    onChange={(e) => setMoreInfoRequest(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="What additional information do you need?"
                  />
                </div>
              )}
              
              {actionModal.action === 'escalate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Reason
                  </label>
                  <textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Why is this ticket being escalated?"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Customer
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter message to send to customer..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', ticketId: '', title: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeAction}
                  disabled={fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Processing...' : 'Execute'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} tickets
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
