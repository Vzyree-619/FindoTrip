import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MessageSquare, 
  User, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Reply,
  Archive,
  Tag,
  Calendar,
  Star,
  Building,
  Car,
  MapPin,
  Users,
  MessageCircle,
  Send,
  FileText
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const priority = url.searchParams.get('priority') || 'all';
  const category = url.searchParams.get('category') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (status !== 'all') {
    where.status = status;
  }
  
  if (priority !== 'all') {
    where.priority = priority;
  }
  
  if (category !== 'all') {
    where.category = category;
  }
  
  // Get support tickets with pagination
  const [tickets, totalCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            businessName: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where })
  ]);
  
  // Get status counts
  const statusCounts = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { status: 'CLOSED' } })
  ]);
  
  // Get priority counts
  const priorityCounts = await Promise.all([
    prisma.supportTicket.count({ where: { priority: 'LOW' } }),
    prisma.supportTicket.count({ where: { priority: 'MEDIUM' } }),
    prisma.supportTicket.count({ where: { priority: 'HIGH' } }),
    prisma.supportTicket.count({ where: { priority: 'URGENT' } })
  ]);
  
  return json({
    admin,
    tickets,
    totalCount,
    statusCounts: {
      open: statusCounts[0],
      inProgress: statusCounts[1],
      resolved: statusCounts[2],
      closed: statusCounts[3]
    },
    priorityCounts: {
      low: priorityCounts[0],
      medium: priorityCounts[1],
      high: priorityCounts[2],
      urgent: priorityCounts[3]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, priority, category }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const ticketId = formData.get('ticketId') as string;
  const message = formData.get('message') as string;
  const status = formData.get('status') as string;
  const priority = formData.get('priority') as string;
  
  try {
    if (action === 'reply') {
      // Add message to ticket
      await prisma.supportMessage.create({
        data: {
          ticketId,
          userId: admin.id,
          message,
          isAdmin: true
        }
      });
      
      // Update ticket status to IN_PROGRESS if it was OPEN
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
      });
      
      await logAdminAction(admin.id, 'SUPPORT_REPLY', `Replied to support ticket: ${ticketId}`, request);
    } else if (action === 'update_status') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: status as any }
      });
      await logAdminAction(admin.id, 'SUPPORT_STATUS_UPDATE', `Updated ticket ${ticketId} status to ${status}`, request);
    } else if (action === 'update_priority') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { priority: priority as any }
      });
      await logAdminAction(admin.id, 'SUPPORT_PRIORITY_UPDATE', `Updated ticket ${ticketId} priority to ${priority}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Support action error:', error);
    return json({ success: false, error: 'Failed to process support action' }, { status: 500 });
  }
}

export default function AdminSupport() {
  const { admin, tickets, totalCount, statusCounts, priorityCounts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  
  const fetcher = useFetcher();
  
  const handleSearch = (search: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (search) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleReply = (ticket: any) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setShowReplyModal(true);
  };
  
  const submitReply = () => {
    if (!replyMessage.trim()) return;
    
    const formData = new FormData();
    formData.append('action', 'reply');
    formData.append('ticketId', selectedTicket.id);
    formData.append('message', replyMessage);
    fetcher.submit(formData, { method: 'post' });
    
    setShowReplyModal(false);
    setSelectedTicket(null);
    setReplyMessage('');
  };
  
  const handleStatusUpdate = (ticketId: string, status: string) => {
    const formData = new FormData();
    formData.append('action', 'update_status');
    formData.append('ticketId', ticketId);
    formData.append('status', status);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handlePriorityUpdate = (ticketId: string, priority: string) => {
    const formData = new FormData();
    formData.append('action', 'update_priority');
    formData.append('ticketId', ticketId);
    formData.append('priority', priority);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return Building;
      case 'BOOKING': return Calendar;
      case 'PAYMENT': return Star;
      case 'ACCOUNT': return User;
      default: return MessageSquare;
    }
  };
  
  const statuses = [
    { value: 'all', label: 'All Status', count: totalCount },
    { value: 'OPEN', label: 'Open', count: statusCounts.open },
    { value: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.inProgress },
    { value: 'RESOLVED', label: 'Resolved', count: statusCounts.resolved },
    { value: 'CLOSED', label: 'Closed', count: statusCounts.closed }
  ];
  
  const priorities = [
    { value: 'all', label: 'All Priority', count: totalCount },
    { value: 'LOW', label: 'Low', count: priorityCounts.low },
    { value: 'MEDIUM', label: 'Medium', count: priorityCounts.medium },
    { value: 'HIGH', label: 'High', count: priorityCounts.high },
    { value: 'URGENT', label: 'Urgent', count: priorityCounts.urgent }
  ];
  
  const categories = [
    { value: 'all', label: 'All Categories', count: totalCount },
    { value: 'TECHNICAL', label: 'Technical', count: tickets.filter(t => t.category === 'TECHNICAL').length },
    { value: 'BOOKING', label: 'Booking', count: tickets.filter(t => t.category === 'BOOKING').length },
    { value: 'PAYMENT', label: 'Payment', count: tickets.filter(t => t.category === 'PAYMENT').length },
    { value: 'ACCOUNT', label: 'Account', count: tickets.filter(t => t.category === 'ACCOUNT').length }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage customer support requests and inquiries</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Tickets: {totalCount.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} ({status.count})
              </option>
            ))}
          </select>
          
          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilter('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label} ({priority.count})
              </option>
            ))}
          </select>
          
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilter('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
          
          {/* Results per page */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('limit', e.target.value);
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </Card>
      
      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </Card>
        ) : (
          tickets.map((ticket) => {
            const CategoryIcon = getCategoryIcon(ticket.category);
            const lastMessage = ticket.messages[ticket.messages.length - 1];
            
            return (
              <Card key={ticket.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <CategoryIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ticket.category}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{ticket.user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{ticket.user.email}</span>
                        </div>
                        {ticket.user.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{ticket.user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>{ticket.messages.length} messages</span>
                        </div>
                        {ticket.user.businessName && (
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4" />
                            <span>{ticket.user.businessName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-4">
                        <p className="line-clamp-2">{ticket.description}</p>
                      </div>
                      
                      {lastMessage && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">
                              {lastMessage.user.role === 'SUPER_ADMIN' ? 'Admin' : lastMessage.user.name}
                            </span>
                            <span className="text-gray-500">
                              {new Date(lastMessage.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="line-clamp-2">{lastMessage.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReply(ticket)}
                      disabled={fetcher.state === 'submitting'}
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                    
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    
                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityUpdate(ticket.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
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
          <div className="text-sm text-gray-500">
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
            <span className="text-sm text-gray-500">
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
      
      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to Ticket</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">{selectedTicket.subject}</h4>
                <p className="text-sm text-gray-600">{selectedTicket.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Type your reply here..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedTicket(null);
                    setReplyMessage('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReply}
                  disabled={!replyMessage.trim() || fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}