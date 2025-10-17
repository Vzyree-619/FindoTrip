import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Zap, 
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
  Target,
  Timer,
  User,
  Users,
  Calendar,
  Tag,
  Priority,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive as ArchiveFile,
  MessageSquare,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  Grip,
  MoreHorizontal,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Stop,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const priority = url.searchParams.get('priority') || 'all';
  const assignedTo = url.searchParams.get('assignedTo') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for tickets
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
  
  if (assignedTo !== 'all') {
    if (assignedTo === 'unassigned') {
      whereClause.assignedTo = null;
    } else {
      whereClause.assignedTo = assignedTo;
    }
  }
  
  // Get tickets for quick actions
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
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where: whereClause })
  ]);
  
  // Get available admins for assignment
  const availableAdmins = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN'] },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: 'asc' }
  });
  
  // Get ticket statistics for quick actions
  const ticketStats = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'NEW' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { priority: 'HIGH' } }),
    prisma.supportTicket.count({ where: { assignedTo: null } }),
    prisma.supportTicket.count({ where: { escalatedAt: { not: null } } })
  ]);
  
  return json({
    admin,
    tickets,
    totalCount,
    availableAdmins,
    ticketStats: {
      new: ticketStats[0],
      inProgress: ticketStats[1],
      highPriority: ticketStats[2],
      unassigned: ticketStats[3],
      escalated: ticketStats[4]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, priority, assignedTo }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const ticketId = formData.get('ticketId') as string;
  const newStatus = formData.get('newStatus') as string;
  const newPriority = formData.get('newPriority') as string;
  const assignedTo = formData.get('assignedTo') as string;
  const reason = formData.get('reason') as string;
  const message = formData.get('message') as string;
  
  try {
    if (action === 'change_priority') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          priority: newPriority,
          updatedAt: new Date()
        }
      });
      
      // Add internal note about priority change
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Priority changed to ${newPriority} by ${admin.name}`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'CHANGE_PRIORITY', `Changed ticket ${ticketId} priority to ${newPriority}`, request);
      
    } else if (action === 'change_status') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      });
      
      // Add internal note about status change
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Status changed to ${newStatus} by ${admin.name}`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'CHANGE_STATUS', `Changed ticket ${ticketId} status to ${newStatus}`, request);
      
    } else if (action === 'assign_ticket') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          assignedTo: assignedTo,
          status: 'ASSIGNED',
          assignedAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Add internal note about assignment
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Ticket assigned to ${assignedTo} by ${admin.name}`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'ASSIGN_TICKET', `Assigned ticket ${ticketId} to ${assignedTo}`, request);
      
    } else if (action === 'escalate') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          priority: 'HIGH',
          escalatedAt: new Date(),
          escalationReason: reason,
          escalatedBy: admin.id,
          updatedAt: new Date()
        }
      });
      
      // Add internal note about escalation
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Ticket escalated by ${admin.name}. Reason: ${reason}`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'ESCALATE_TICKET', `Escalated ticket ${ticketId}`, request);
      
    } else if (action === 'reset_password') {
      // Generate password reset link (simplified)
      const resetToken = Math.random().toString(36).substring(2, 15);
      
      // Add internal note about password reset
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Password reset link generated by ${admin.name}. Token: ${resetToken}`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'RESET_PASSWORD', `Generated password reset for ticket ${ticketId}`, request);
      
    } else if (action === 'access_account') {
      // Log admin access to user account
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Admin ${admin.name} accessed user account for troubleshooting`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'ACCESS_ACCOUNT', `Accessed user account for ticket ${ticketId}`, request);
      
    } else if (action === 'view_logs') {
      // Log admin viewing user logs
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: `Admin ${admin.name} viewed user activity logs`,
          isInternal: true
        }
      });
      
      await logAdminAction(admin.id, 'VIEW_LOGS', `Viewed user logs for ticket ${ticketId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Quick action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function QuickActions() {
  const { admin, tickets, totalCount, availableAdmins, ticketStats, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; ticketId: string; title: string }>({
    open: false,
    action: '',
    ticketId: '',
    title: ''
  });
  const [formData, setFormData] = useState({
    newStatus: '',
    newPriority: '',
    assignedTo: '',
    reason: '',
    message: ''
  });
  
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
  
  const handleQuickAction = (action: string, ticketId: string, title: string) => {
    setActionModal({ open: true, action, ticketId, title });
  };
  
  const executeAction = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', actionModal.action);
    formDataToSubmit.append('ticketId', actionModal.ticketId);
    if (formData.newStatus) formDataToSubmit.append('newStatus', formData.newStatus);
    if (formData.newPriority) formDataToSubmit.append('newPriority', formData.newPriority);
    if (formData.assignedTo) formDataToSubmit.append('assignedTo', formData.assignedTo);
    if (formData.reason) formDataToSubmit.append('reason', formData.reason);
    if (formData.message) formDataToSubmit.append('message', formData.message);
    fetcher.submit(formDataToSubmit, { method: 'post' });
    
    setActionModal({ open: false, action: '', ticketId: '', title: '' });
    setFormData({
      newStatus: '',
      newPriority: '',
      assignedTo: '',
      reason: '',
      message: ''
    });
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
  
  return (
    <div className="flex space-x-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Actions</h1>
            <p className="text-gray-600">Fast ticket management with one-click actions</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => window.print()} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-bold text-gray-900">{ticketStats.new}</p>
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
                <p className="text-2xl font-bold text-gray-900">{ticketStats.inProgress}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{ticketStats.highPriority}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserX className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-gray-900">{ticketStats.unassigned}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Escalated</p>
                <p className="text-2xl font-bold text-gray-900">{ticketStats.escalated}</p>
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
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
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
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
              
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket.id)}
                      onChange={() => handleSelectTicket(ticket.id)}
                      className="rounded mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
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
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Quick Actions Sidebar */}
      <div className="w-80 space-y-4">
        {/* Priority Actions */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Priority</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleQuickAction('change_priority', '', 'Change Priority')}
              className="w-full justify-start bg-red-600 hover:bg-red-700"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Set to HIGH
            </Button>
            <Button
              onClick={() => handleQuickAction('change_priority', '', 'Change Priority')}
              className="w-full justify-start bg-yellow-600 hover:bg-yellow-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Set to MEDIUM
            </Button>
            <Button
              onClick={() => handleQuickAction('change_priority', '', 'Change Priority')}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Set to LOW
            </Button>
          </div>
        </Card>
        
        {/* Status Actions */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Status</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleQuickAction('change_status', '', 'Change Status')}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Mark as NEW
            </Button>
            <Button
              onClick={() => handleQuickAction('change_status', '', 'Change Status')}
              className="w-full justify-start bg-orange-600 hover:bg-orange-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              Mark as IN_PROGRESS
            </Button>
            <Button
              onClick={() => handleQuickAction('change_status', '', 'Change Status')}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as RESOLVED
            </Button>
            <Button
              onClick={() => handleQuickAction('change_status', '', 'Change Status')}
              className="w-full justify-start bg-gray-600 hover:bg-gray-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Mark as CLOSED
            </Button>
          </div>
        </Card>
        
        {/* Assignment Actions */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign to Other</h3>
          <div className="space-y-2">
            {availableAdmins.map((admin) => (
              <Button
                key={admin.id}
                onClick={() => handleQuickAction('assign_ticket', '', 'Assign Ticket')}
                variant="outline"
                className="w-full justify-start"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {admin.name}
              </Button>
            ))}
          </div>
        </Card>
        
        {/* Escalation Actions */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalate to Senior</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleQuickAction('escalate', '', 'Escalate Ticket')}
              className="w-full justify-start bg-red-600 hover:bg-red-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Escalate Now
            </Button>
            <Button
              onClick={() => handleQuickAction('escalate', '', 'Escalate Ticket')}
              className="w-full justify-start bg-orange-600 hover:bg-orange-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Escalate with Reason
            </Button>
          </div>
        </Card>
        
        {/* User Actions */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Actions</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleQuickAction('reset_password', '', 'Reset Password')}
              variant="outline"
              className="w-full justify-start"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
            <Button
              onClick={() => handleQuickAction('access_account', '', 'Access Account')}
              variant="outline"
              className="w-full justify-start"
            >
              <User className="w-4 h-4 mr-2" />
              Access Account
            </Button>
            <Button
              onClick={() => handleQuickAction('view_logs', '', 'View User Logs')}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              View User Logs
            </Button>
          </div>
        </Card>
        
        {/* Bulk Actions */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleQuickAction('bulk_assign', '', 'Bulk Assign')}
              variant="outline"
              className="w-full justify-start"
              disabled={selectedTickets.length === 0}
            >
              <Users className="w-4 h-4 mr-2" />
              Assign Selected ({selectedTickets.length})
            </Button>
            <Button
              onClick={() => handleQuickAction('bulk_priority', '', 'Bulk Priority')}
              variant="outline"
              className="w-full justify-start"
              disabled={selectedTickets.length === 0}
            >
              <Priority className="w-4 h-4 mr-2" />
              Change Priority ({selectedTickets.length})
            </Button>
            <Button
              onClick={() => handleQuickAction('bulk_status', '', 'Bulk Status')}
              variant="outline"
              className="w-full justify-start"
              disabled={selectedTickets.length === 0}
            >
              <Settings className="w-4 h-4 mr-2" />
              Change Status ({selectedTickets.length})
            </Button>
          </div>
        </Card>
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
              {actionModal.action === 'change_priority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Priority
                  </label>
                  <select
                    value={formData.newPriority}
                    onChange={(e) => setFormData({ ...formData, newPriority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Priority</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              )}
              
              {actionModal.action === 'change_status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={formData.newStatus}
                    onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="NEW">New</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING">Waiting</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              )}
              
              {actionModal.action === 'assign_ticket' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Admin</option>
                    {availableAdmins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {actionModal.action === 'escalate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter escalation reason..."
                  />
                </div>
              )}
              
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
    </div>
  );
}
