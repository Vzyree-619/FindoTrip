import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  FileText, 
  Shield,
  User,
  Users,
  Calendar,
  MessageSquare,
  Star,
  Heart,
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
  User as UserIcon,
  FileText as FileTextIcon,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  RefreshCw as RefreshCwIcon,
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
  Settings,
  Globe,
  CreditCard,
  Bell,
  Building,
  Car,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
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
  Server as ServerIcon,
  Cloud as CloudIcon,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudMoon,
  CloudSun,
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
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Forward,
  Bookmark as BookmarkIcon,
  BookmarkCheck as BookmarkCheckIcon,
  Lightbulb as LightbulbIcon,
  Target as TargetIcon,
  Timer as TimerIcon,
  User as UserIcon2,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Tag,
  FileText as FileTextIcon2,
  Paperclip as PaperclipIcon,
  Image as ImageIcon,
  File as FileIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Archive as ArchiveIcon,
  MessageSquare as MessageSquareIcon,
  RefreshCw as RefreshCwIcon2,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Move as MoveIcon,
  Grip as GripIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Hexagon as HexagonIcon,
  Octagon as OctagonIcon,
  Diamond as DiamondIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  MapPin as MapPinIcon,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Desktop,
  Mail,
  Phone,
  MessageCircle,
  AlertCircle,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  Bug,
  Wrench as WrenchIcon,
  Heart as HeartIcon2,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Send,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon2,
  BookmarkCheck as BookmarkCheckIcon2,
  Lightbulb as LightbulbIcon2,
  Target as TargetIcon2,
  Timer as TimerIcon2,
  User as UserIcon3,
  Users as UsersIcon2,
  Calendar as CalendarIcon2,
  Tag as TagIcon,
  FileText as FileTextIcon3,
  Paperclip as PaperclipIcon2,
  Image as ImageIcon2,
  File as FileIcon2,
  Video as VideoIcon2,
  Music as MusicIcon2,
  Archive as ArchiveIcon2,
  MessageSquare as MessageSquareIcon2,
  RefreshCw as RefreshCwIcon3,
  ArrowUp as ArrowUpIcon2,
  ArrowDown as ArrowDownIcon2,
  ArrowRight as ArrowRightIcon2,
  ArrowLeft as ArrowLeftIcon2,
  RotateCcw as RotateCcwIcon2,
  RotateCw as RotateCwIcon2,
  Maximize as MaximizeIcon2,
  Minimize as MinimizeIcon2,
  Move as MoveIcon2,
  Grip as GripIcon2,
  MoreHorizontal as MoreHorizontalIcon2,
  MoreVertical as MoreVerticalIcon2,
  ChevronUp as ChevronUpIcon2,
  ChevronDown as ChevronDownIcon2,
  ChevronLeft as ChevronLeftIcon2,
  ChevronRight as ChevronRightIcon2,
  Play as PlayIcon2,
  Pause as PauseIcon2,
  Stop as StopIcon2,
  Square as SquareIcon2,
  Circle as CircleIcon2,
  Triangle as TriangleIcon2,
  Hexagon as HexagonIcon2,
  Octagon as OctagonIcon2,
  Diamond as DiamondIcon2,
  Activity,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Fingerprint,
  AlertCircle as AlertCircleIcon,
  CheckCircle2,
  XCircle2,
  Clock3,
  Info as InfoIcon2,
  HelpCircle as HelpCircleIcon2,
  Bug as BugIcon,
  Wrench as WrenchIcon2,
  Heart as HeartIcon3,
  ThumbsUp as ThumbsUpIcon2,
  ThumbsDown as ThumbsDownIcon2,
  Send as SendIcon,
  Reply as ReplyIcon2,
  Forward as ForwardIcon2,
  Copy as CopyIcon2,
  Share as ShareIcon2,
  Bookmark as BookmarkIcon3,
  BookmarkCheck as BookmarkCheckIcon3,
  Lightbulb as LightbulbIcon3,
  Target as TargetIcon3,
  Timer as TimerIcon3,
  User as UserIcon4,
  Users as UsersIcon3,
  Calendar as CalendarIcon3,
  Tag as TagIcon2,
  FileText as FileTextIcon4,
  Paperclip as PaperclipIcon3,
  Image as ImageIcon3,
  File as FileIcon3,
  Video as VideoIcon3,
  Music as MusicIcon3,
  Archive as ArchiveIcon3,
  MessageSquare as MessageSquareIcon3,
  RefreshCw as RefreshCwIcon4,
  ArrowUp as ArrowUpIcon3,
  ArrowDown as ArrowDownIcon3,
  ArrowRight as ArrowRightIcon3,
  ArrowLeft as ArrowLeftIcon3,
  RotateCcw as RotateCcwIcon3,
  RotateCw as RotateCwIcon3,
  Maximize as MaximizeIcon3,
  Minimize as MinimizeIcon3,
  Move as MoveIcon3,
  Grip as GripIcon3,
  MoreHorizontal as MoreHorizontalIcon3,
  MoreVertical as MoreVerticalIcon3,
  ChevronUp as ChevronUpIcon3,
  ChevronDown as ChevronDownIcon3,
  ChevronLeft as ChevronLeftIcon3,
  ChevronRight as ChevronRightIcon3,
  Play as PlayIcon3,
  Pause as PauseIcon3,
  Stop as StopIcon3,
  Square as SquareIcon3,
  Circle as CircleIcon3,
  Triangle as TriangleIcon3,
  Hexagon as HexagonIcon3,
  Octagon as OctagonIcon3,
  Diamond as DiamondIcon3
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const actionType = url.searchParams.get('actionType') || 'all';
  const user = url.searchParams.get('user') || 'all';
  const date = url.searchParams.get('date') || '7';
  const severity = url.searchParams.get('severity') || 'all';
  const search = url.searchParams.get('search') || '';
  
  // Build where clause for audit logs
  const whereClause: any = {};
  
  if (actionType !== 'all') {
    whereClause.action = actionType.toUpperCase();
  }
  
  if (user !== 'all') {
    whereClause.adminId = user;
  }
  
  if (date !== 'all') {
    const days = parseInt(date);
    whereClause.createdAt = {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    };
  }
  
  if (severity !== 'all') {
    whereClause.severity = severity.toUpperCase();
  }
  
  if (search) {
    whereClause.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Get audit logs
  const [auditLogs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where: whereClause })
  ]);
  
  // Get audit statistics
  const auditStats = await Promise.all([
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        action: 'ADMIN_LOGIN',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        severity: 'HIGH',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        action: 'DATA_EXPORT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);
  
  // Get action type statistics
  const actionStats = await prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });
  
  // Get admin activity statistics
  const adminStats = await prisma.auditLog.groupBy({
    by: ['adminId'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });
  
  // Get available admins for filter
  const availableAdmins = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN'] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: 'asc' }
  });
  
  return json({
    admin,
    auditLogs,
    totalCount,
    auditStats: {
      totalToday: auditStats[0],
      loginsToday: auditStats[1],
      highSeverityToday: auditStats[2],
      exportsToday: auditStats[3]
    },
    actionStats: actionStats.map(stat => ({
      action: stat.action,
      count: stat._count.id
    })),
    adminStats: adminStats.map(stat => ({
      adminId: stat.adminId,
      count: stat._count.id
    })),
    availableAdmins,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { actionType, user, date, severity, search }
  });
}

export default function AuditLogs() {
  const { 
    admin, 
    auditLogs, 
    totalCount, 
    auditStats, 
    actionStats, 
    adminStats, 
    availableAdmins, 
    pagination, 
    filters 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'MEDIUM': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'LOW': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ADMIN_LOGIN': return <Key className="w-4 h-4" />;
      case 'ADMIN_LOGOUT': return <Lock className="w-4 h-4" />;
      case 'USER_APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'USER_SUSPENDED': return <XCircle className="w-4 h-4" />;
      case 'SETTINGS_CHANGED': return <Settings className="w-4 h-4" />;
      case 'BOOKING_CANCELLED': return <Calendar className="w-4 h-4" />;
      case 'REFUND_ISSUED': return <DollarSign className="w-4 h-4" />;
      case 'DATA_EXPORT': return <Download className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Security and compliance logs for administrative actions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>
      
      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Today</p>
              <p className="text-2xl font-bold text-gray-900">{auditStats.totalToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Logins Today</p>
              <p className="text-2xl font-bold text-gray-900">{auditStats.loginsToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">High Severity</p>
              <p className="text-2xl font-bold text-gray-900">{auditStats.highSeverityToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Data Exports</p>
              <p className="text-2xl font-bold text-gray-900">{auditStats.exportsToday}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Action Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Action Types (Last 7 Days)</h2>
          </div>
          
          <div className="space-y-3">
            {actionStats.map((stat) => (
              <div key={stat.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getActionIcon(stat.action)}
                  <span className="text-sm font-medium text-gray-900">
                    {stat.action.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{stat.count}</span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Activity (Last 7 Days)</h2>
          </div>
          
          <div className="space-y-3">
            {adminStats.map((stat) => {
              const admin = availableAdmins.find(a => a.id === stat.adminId);
              return (
                <div key={stat.adminId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {admin?.name || 'Unknown Admin'}
                      </p>
                      <p className="text-xs text-gray-600">{admin?.role}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{stat.count} actions</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      
      {/* Audit Logs Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
          <div className="flex items-center space-x-4">
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="admin_login">Admin Login</option>
              <option value="admin_logout">Admin Logout</option>
              <option value="user_approved">User Approved</option>
              <option value="user_suspended">User Suspended</option>
              <option value="settings_changed">Settings Changed</option>
              <option value="booking_cancelled">Booking Cancelled</option>
              <option value="refund_issued">Refund Issued</option>
              <option value="data_export">Data Export</option>
            </select>
            
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              {availableAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.role})
                </option>
              ))}
            </select>
            
            <select
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getActionIcon(log.action)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.description}</p>
                  <p className="text-xs text-gray-600">
                    {log.admin?.name} ({log.admin?.role}) • {log.ipAddress} • {formatTimeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 ml-auto">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                  {log.severity}
                </span>
                <span className="text-xs text-gray-500">{log.action.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page - 1).toString());
                setSearchParams(newParams);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page + 1).toString());
                setSearchParams(newParams);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Export Options */}
      <div className="flex items-center justify-center space-x-4">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV Export
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          JSON Export
        </Button>
        <Button variant="outline">
          <Mail className="w-4 h-4 mr-2" />
          Send to Email
        </Button>
      </div>
    </div>
  );
}
