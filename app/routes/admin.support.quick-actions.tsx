import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Zap, 
  Users,
  MessageSquare,
  Star,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Minus,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Target,
  Timer,
  User,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  Settings,
  Globe,
  CreditCard,
  Shield,
  Bell,
  Building,
  Car,
  MapPin,
  Heart,
  Share2,
  Gift,
  Info,
  HelpCircle,
  Wrench,
  Database,
  Server,
  Cloud,
  Lock,
  Unlock,
  Bot,
  Cpu,
  HardDrive,
  Network,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Power,
  Plug,
  Unplug,
  Cable,
  Router,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Forward,
  Send,
  Mail,
  Phone,
  MessageCircle,
  AlertCircle,
  Bug,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Key
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get support tickets for quick actions
  const tickets = await prisma.supportTicket.findMany({
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
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
        select: {
          id: true,
          content: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  // Get available admins for assignment
  const admins = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN'
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  
  // Get user logs for a specific user (if provided)
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  let userLogs = [];
  if (userId) {
    userLogs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }
  
  return json({
    admin,
    tickets,
    admins,
    userLogs
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  
  try {
    if (action === 'change_priority') {
      const ticketId = formData.get('ticketId') as string;
      const priority = formData.get('priority') as string;
      
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { priority: priority as any }
      });
      
      await logAdminAction(admin.id, 'CHANGE_PRIORITY', `Changed priority to ${priority}`, request);
      
    } else if (action === 'change_status') {
      const ticketId = formData.get('ticketId') as string;
      const status = formData.get('status') as string;
      const reason = formData.get('reason') as string;
      
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: status as any }
      });
      
      // Add system message about status change
      await prisma.supportMessage.create({
        data: {
          content: `Status changed to ${status}. Reason: ${reason}`,
          ticketId,
          senderId: admin.id,
          type: 'SYSTEM'
        }
      });
      
      await logAdminAction(admin.id, 'CHANGE_STATUS', `Changed status to ${status}`, request);
      
    } else if (action === 'assign_ticket') {
      const ticketId = formData.get('ticketId') as string;
      const assigneeId = formData.get('assigneeId') as string;
      
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          assignedToId: assigneeId,
          status: 'ASSIGNED'
        }
      });
      
      // Add system message about assignment
      await prisma.supportMessage.create({
        data: {
          content: `Ticket assigned to admin`,
          ticketId,
          senderId: admin.id,
          type: 'SYSTEM'
        }
      });
      
      await logAdminAction(admin.id, 'ASSIGN_TICKET', `Assigned ticket to admin`, request);
      
    } else if (action === 'escalate_ticket') {
      const ticketId = formData.get('ticketId') as string;
      const reason = formData.get('reason') as string;
      
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          escalated: true,
          escalatedAt: new Date(),
          escalatedBy: admin.id,
          priority: 'URGENT'
        }
      });
      
      // Add system message about escalation
      await prisma.supportMessage.create({
        data: {
          content: `Ticket escalated. Reason: ${reason}`,
          ticketId,
          senderId: admin.id,
          type: 'SYSTEM'
        }
      });
      
      await logAdminAction(admin.id, 'ESCALATE_TICKET', `Escalated ticket`, request);
      
    } else if (action === 'reset_password') {
      const userId = formData.get('userId') as string;
      
      // Generate password reset token (simplified)
      const resetToken = Math.random().toString(36).substring(2, 15);
      
      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send email with reset link
      
      await logAdminAction(admin.id, 'RESET_PASSWORD', `Reset password for user ${userId}`, request);
      
    } else if (action === 'access_account') {
      const userId = formData.get('userId') as string;
      
      // In a real implementation, you would:
      // 1. Create a temporary admin session
      // 2. Log the admin impersonation
      // 3. Set time limits
      
      await logAdminAction(admin.id, 'ACCESS_ACCOUNT', `Accessed account for user ${userId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Quick actions error:', error);
    return json({ success: false, error: 'Failed to perform action' }, { status: 500 });
  }
}

export default function QuickActions() {
  const { admin, tickets, admins, userLogs } = useLoaderData<typeof loader>();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserLogs, setShowUserLogs] = useState(false);
  
  const fetcher = useFetcher();
  
  const handlePriorityChange = (ticketId: string, priority: string) => {
    const formData = new FormData();
    formData.append('action', 'change_priority');
    formData.append('ticketId', ticketId);
    formData.append('priority', priority);
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleStatusChange = (ticketId: string, status: string, reason: string) => {
    const formData = new FormData();
    formData.append('action', 'change_status');
    formData.append('ticketId', ticketId);
    formData.append('status', status);
    formData.append('reason', reason);
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleAssignTicket = (ticketId: string, assigneeId: string) => {
    const formData = new FormData();
    formData.append('action', 'assign_ticket');
    formData.append('ticketId', ticketId);
    formData.append('assigneeId', assigneeId);
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleEscalateTicket = (ticketId: string, reason: string) => {
    const formData = new FormData();
    formData.append('action', 'escalate_ticket');
    formData.append('ticketId', ticketId);
    formData.append('reason', reason);
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleResetPassword = (userId: string) => {
    if (confirm('Are you sure you want to reset this user\'s password?')) {
      const formData = new FormData();
      formData.append('action', 'reset_password');
      formData.append('userId', userId);
      
      fetcher.submit(formData, { method: 'post' });
    }
  };
  
  const handleAccessAccount = (userId: string) => {
    if (confirm('Are you sure you want to access this user\'s account? This action will be logged.')) {
      const formData = new FormData();
      formData.append('action', 'access_account');
      formData.append('userId', userId);
      
      fetcher.submit(formData, { method: 'post' });
    }
  };
  
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Actions</h1>
          <p className="text-gray-600">One-click actions for efficient ticket management</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Actions
          </Button>
        </div>
      </div>
      
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Changes */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Priority Changes</h2>
          </div>
          
          <div className="space-y-4">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-xs text-gray-600">
                    {ticket.provider.name} • {ticket.status} • {formatTimeAgo(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(ticket.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Status Changes */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Status Changes</h2>
          </div>
          
          <div className="space-y-4">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-xs text-gray-600">
                    {ticket.provider.name} • {ticket.priority} • {formatTimeAgo(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value, 'Status changed via quick actions')}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING">Waiting</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ESCALATED">Escalated</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Ticket Assignment */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ticket Assignment</h2>
          </div>
          
          <div className="space-y-4">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-xs text-gray-600">
                    {ticket.provider.name} • {ticket.priority} • {formatTimeAgo(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={ticket.assignedToId || ''}
                    onChange={(e) => handleAssignTicket(ticket.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Escalation Actions */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Escalation Actions</h2>
          </div>
          
          <div className="space-y-4">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-xs text-gray-600">
                    {ticket.provider.name} • {ticket.priority} • {formatTimeAgo(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleEscalateTicket(ticket.id, 'Escalated via quick actions')}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Escalate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* User Management Actions */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">User Management Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Password Reset</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="User ID or Email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={() => handleResetPassword('user-id')}
                  variant="outline"
                  size="sm"
                >
                  <Key className="w-4 h-4 mr-1" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Access</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="User ID or Email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={() => handleAccessAccount('user-id')}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Access Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* User Logs */}
      {showUserLogs && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">User Activity Logs</h2>
          </div>
          
          <div className="space-y-3">
            {userLogs.map((log) => (
              <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{log.description}</p>
                  <p className="text-xs text-gray-600">
                    {log.type} • {formatTimeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}