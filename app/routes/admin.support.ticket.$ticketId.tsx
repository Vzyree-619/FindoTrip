import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
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
  DollarSign,
  MapPin as LocationIcon,
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
  ArrowLeft,
  Shield,
  FileText,
  Send,
  Ban,
  RefreshCw,
  Zap,
  Target,
  Timer,
  Globe,
  Award,
  Flag,
  MoreHorizontal,
  User,
  Users,
  Calendar,
  Tag,
  AlertTriangle,
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
  Lightbulb,
  MessageCircle,
  Reply,
  Forward,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const { ticketId } = params;
  
  if (!ticketId) {
    throw new Response("Ticket ID is required", { status: 400 });
  }
  
  // Get ticket with detailed information
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          verified: true,
          isActive: true,
          createdAt: true
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
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: {
          messages: true
        }
      }
    }
  });
  
  if (!ticket) {
    throw new Response("Ticket not found", { status: 404 });
  }
  
  // Get related tickets from the same user
  const relatedTickets = await prisma.supportTicket.findMany({
    where: {
      userId: ticket.userId,
      id: { not: ticketId }
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  // Get user's booking history
  const userBookings = await Promise.all([
    prisma.propertyBooking.findMany({
      where: { userId: ticket.userId },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.vehicleBooking.findMany({
      where: { userId: ticket.userId },
      include: { vehicle: { select: { brand: true, model: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.tourBooking.findMany({
      where: { userId: ticket.userId },
      include: { tour: { select: { title: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
  ]);
  
  const allUserBookings = [
    ...userBookings[0].map(b => ({ ...b, type: 'PROPERTY' })),
    ...userBookings[1].map(b => ({ ...b, type: 'VEHICLE' })),
    ...userBookings[2].map(b => ({ ...b, type: 'TOUR' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return json({
    admin,
    ticket,
    relatedTickets,
    userBookings: allUserBookings
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const { ticketId } = params;
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const message = formData.get('message') as string;
  const priority = formData.get('priority') as string;
  const status = formData.get('status') as string;
  const assignedTo = formData.get('assignedTo') as string;
  const isInternal = formData.get('isInternal') === 'true';
  
  try {
    if (action === 'add_message') {
      await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: message,
          isInternal: isInternal
        }
      });
      
      // Update ticket status if it was waiting
      if (status) {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: status }
        });
      }
      
      await logAdminAction(admin.id, 'ADD_TICKET_MESSAGE', `Added message to ticket ${ticketId}`, request);
      
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
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Ticket action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function TicketDetails() {
  const { admin, ticket, relatedTickets, userBookings } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('conversation');
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; title: string }>({
    open: false,
    action: '',
    title: ''
  });
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  
  const fetcher = useFetcher();
  
  const handleSendMessage = () => {
    const formData = new FormData();
    formData.append('action', 'add_message');
    formData.append('message', newMessage);
    formData.append('isInternal', isInternal.toString());
    if (status) formData.append('status', status);
    fetcher.submit(formData, { method: 'post' });
    
    setNewMessage('');
    setIsInternal(false);
    setStatus('');
  };
  
  const handleTicketAction = (action: string, title: string) => {
    setActionModal({ open: true, action, title });
  };
  
  const executeAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    if (priority) formData.append('priority', priority);
    if (status) formData.append('status', status);
    if (assignedTo) formData.append('assignedTo', assignedTo);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', title: '' });
    setPriority('');
    setStatus('');
    setAssignedTo('');
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
      case 'PAYMENT_PROBLEMS': return CreditCard;
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
  
  const CategoryIcon = getCategoryIcon(ticket.category);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/admin/support/tickets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id.slice(-8)}</h1>
            <p className="text-gray-600">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Ticket
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Ticket Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CategoryIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Category</p>
              <p className="text-lg font-bold text-gray-900">{ticket.category.replace('_', ' ')}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold text-gray-900">{ticket.status}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Priority</p>
              <p className="text-lg font-bold text-gray-900">{ticket.priority}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-lg font-bold text-gray-900">{ticket._count.messages}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Comprehensive Tabbed Interface */}
      <Card className="p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('conversation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'conversation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Conversation
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer Info
            </button>
            <button
              onClick={() => setActiveTab('related')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'related'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Related Tickets
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer Bookings
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actions
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'conversation' && (
          <div className="space-y-6">
            {/* Ticket Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Ticket Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <div className="text-sm text-gray-900">{ticket.subject}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="text-sm text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <div className="text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <div className="text-sm text-gray-900">
                    {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <div className="text-sm text-gray-900">
                    {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="text-sm text-gray-900 bg-white p-3 rounded border">
                  {ticket.description}
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Conversation</h4>
              {ticket.messages.length === 0 ? (
                <p className="text-gray-600">No messages yet</p>
              ) : (
                <div className="space-y-4">
                  {ticket.messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg ${
                      message.senderType === 'ADMIN' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{message.sender.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            message.senderType === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {message.senderType}
                          </span>
                          {message.isInternal && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Internal
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900">{message.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* New Message */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">Add Message</h4>
              <div className="space-y-4">
                <div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Type your message here..."
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Internal note (not visible to customer)</span>
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Update Status:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Keep Current</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING">Waiting for Customer</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || fetcher.state === 'submitting'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {fetcher.state === 'submitting' ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'customer' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Personal Details</h5>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="text-sm text-gray-900">{ticket.user.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="text-sm text-gray-900">{ticket.user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <div className="text-sm text-gray-900">{ticket.user.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="text-sm text-gray-900">{ticket.user.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ticket.user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {ticket.user.verified && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Account Information</h5>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <div className="text-sm text-gray-900">
                      {new Date(ticket.user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <div className="text-sm text-gray-900 font-mono">{ticket.user.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Age</label>
                    <div className="text-sm text-gray-900">
                      {Math.floor((Date.now() - new Date(ticket.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'related' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Related Tickets</h4>
            {relatedTickets.length === 0 ? (
              <p className="text-gray-600">No related tickets found</p>
            ) : (
              <div className="space-y-4">
                {relatedTickets.map((relatedTicket) => (
                  <div key={relatedTicket.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{relatedTicket.subject}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(relatedTicket.status)}`}>
                        {relatedTicket.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Created {new Date(relatedTicket.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-700 line-clamp-2">{relatedTicket.description}</div>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/support/tickets/${relatedTicket.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Ticket
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Bookings</h4>
            {userBookings.length === 0 ? (
              <p className="text-gray-600">No bookings found</p>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">
                        {booking.type === 'PROPERTY' && booking.property?.name}
                        {booking.type === 'VEHICLE' && `${booking.vehicle?.brand} ${booking.vehicle?.model}`}
                        {booking.type === 'TOUR' && booking.tour?.title}
                      </h5>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {booking.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Booked {new Date(booking.createdAt).toLocaleDateString()} • PKR {booking.totalPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-700">
                      Status: {booking.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Status Management</h5>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleTicketAction('update_status', 'Update Status')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                  
                  <Button
                    onClick={() => handleTicketAction('update_priority', 'Update Priority')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Update Priority
                  </Button>
                  
                  <Button
                    onClick={() => handleTicketAction('assign_ticket', 'Assign Ticket')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Ticket
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Communication</h5>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Customer
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{actionModal.title}</h3>
              <Button
                variant="outline"
                onClick={() => setActionModal({ open: false, action: '', title: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {actionModal.action === 'update_status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING">Waiting</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              )}
              
              {actionModal.action === 'update_priority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Priority</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              )}
              
              {actionModal.action === 'assign_ticket' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Admin</option>
                    <option value="admin1">Admin 1</option>
                    <option value="admin2">Admin 2</option>
                  </select>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', title: '' })}
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
