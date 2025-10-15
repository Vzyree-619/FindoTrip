import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MessageSquare, 
  User, 
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
  DollarSign,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard,
  Receipt,
  ExternalLink,
  Send,
  Archive,
  Flag,
  Shield
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const priority = url.searchParams.get('priority') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for support tickets
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { provider: { name: { contains: search, mode: 'insensitive' } } },
      { provider: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }
  
  if (priority !== 'all') {
    whereClause.priority = priority.toUpperCase();
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get support tickets
  const [tickets, totalCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where: whereClause })
  ]);
  
  // Get statistics
  const stats = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'NEW' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { priority: 'HIGH' } }),
    prisma.supportTicket.count({ where: { escalated: true } }),
    prisma.supportTicket.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.supportTicket.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
  ]);
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      action: { contains: 'SUPPORT' }
    },
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  
  return json({
    admin,
    tickets,
    totalCount,
    stats: {
      total: stats[0],
      new: stats[1],
      inProgress: stats[2],
      resolved: stats[3],
      highPriority: stats[4],
      escalated: stats[5],
      today: stats[6],
      thisWeek: stats[7]
    },
    recentActivity,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, priority, sort, dateFrom, dateTo }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const ticketId = formData.get('ticketId') as string;
  const message = formData.get('message') as string;
  const priority = formData.get('priority') as string;
  
  try {
    if (action === 'update_status') {
      const status = formData.get('status') as string;
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: status.toUpperCase(),
          updatedAt: new Date()
        }
      });
      await logAdminAction(admin.id, 'SUPPORT_TICKET_STATUS_UPDATED', `Updated ticket ${ticketId} status to ${status}`, request);
      
    } else if (action === 'escalate_ticket') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          escalated: true,
          priority: 'HIGH',
          updatedAt: new Date()
        }
      });
      await logAdminAction(admin.id, 'SUPPORT_TICKET_ESCALATED', `Escalated ticket ${ticketId}`, request);
      
    } else if (action === 'update_priority') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          priority: priority.toUpperCase(),
          updatedAt: new Date()
        }
      });
      await logAdminAction(admin.id, 'SUPPORT_TICKET_PRIORITY_UPDATED', `Updated ticket ${ticketId} priority to ${priority}`, request);
      
    } else if (action === 'add_message') {
      await prisma.supportMessage.create({
        data: {
          ticketId,
          content: message,
          sender: 'ADMIN',
          adminId: admin.id
        }
      });
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        }
      });
      await logAdminAction(admin.id, 'SUPPORT_MESSAGE_ADDED', `Added message to ticket ${ticketId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Support ticket action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function SupportTickets() {
  const { admin, tickets, totalCount, stats, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; ticketId: string; ticketSubject: string }>({
    open: false,
    action: '',
    ticketId: '',
    ticketSubject: ''
  });
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('');
  
  const fetcher = useFetcher();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleTicketAction = (action: string, ticketId: string, ticketSubject: string) => {
    setActionModal({ open: true, action, ticketId, ticketSubject });
    setMessage('');
    setPriority('');
  };
  
  const submitAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    formData.append('ticketId', actionModal.ticketId);
    if (message) formData.append('message', message);
    if (priority) formData.append('priority', priority);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', ticketId: '', ticketSubject: '' });
    setMessage('');
    setPriority('');
  };
  
  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(ticket => ticket.id));
    }
  };
  
  const handleSelectTicket = (ticketId: string) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    } else {
      setSelectedTickets([...selectedTickets, ticketId]);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage customer support tickets and inquiries</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
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
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
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
      </div>
      
      {/* Priority Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flag className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Escalated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.escalated}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
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
              <option value="new">New ({stats.new})</option>
              <option value="in_progress">In Progress ({stats.inProgress})</option>
              <option value="resolved">Resolved ({stats.resolved})</option>
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
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">From:</label>
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
            <label className="text-sm text-gray-600">To:</label>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets Found</h3>
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
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedTickets.includes(ticket.id)}
                    onChange={() => handleSelectTicket(ticket.id)}
                    className="rounded"
                  />
                  
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-gray-600" />
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
                      {ticket.escalated && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          ESCALATED
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{ticket.provider.name} ({ticket.provider.email})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{ticket._count.messages} messages</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3">
                      <p className="line-clamp-2">{ticket.description}</p>
                    </div>
                    
                    {ticket.messages.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Latest message:</p>
                        <p className="line-clamp-1">{ticket.messages[0].content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.messages[0].createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {ticket.status === 'NEW' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTicketAction('update_status', ticket.id, ticket.subject)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {ticket.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTicketAction('update_status', ticket.id, ticket.subject)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                    
                    {!ticket.escalated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTicketAction('escalate_ticket', ticket.id, ticket.subject)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Escalate
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTicketAction('add_message', ticket.id, ticket.subject)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-purple-600 border-purple-600 hover:bg-purple-50"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/support/tickets/${ticket.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
      
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
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal.action === 'update_status' && 'Update Ticket Status'}
              {actionModal.action === 'escalate_ticket' && 'Escalate Ticket'}
              {actionModal.action === 'update_priority' && 'Update Priority'}
              {actionModal.action === 'add_message' && 'Add Message'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {actionModal.action === 'update_status' && 'Select new status for this ticket:'}
                  {actionModal.action === 'escalate_ticket' && 'Are you sure you want to escalate this ticket?'}
                  {actionModal.action === 'update_priority' && 'Select new priority for this ticket:'}
                  {actionModal.action === 'add_message' && 'Add a message to this ticket:'}
                </p>
                <p className="font-medium text-gray-900">{actionModal.ticketSubject}</p>
              </div>
              
              {actionModal.action === 'update_status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              )}
              
              {actionModal.action === 'update_priority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              )}
              
              {actionModal.action === 'add_message' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message:
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your message..."
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', ticketId: '', ticketSubject: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitAction}
                  disabled={fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
