import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Activity, 
  Users,
  UserPlus,
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
  User,
  FileText,
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
  Shield,
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
  User as UserIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Tag,
  FileText as FileTextIcon,
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
  User as UserIcon2,
  Users as UsersIcon2,
  Calendar as CalendarIcon2,
  Tag as TagIcon,
  FileText as FileTextIcon2,
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
  Diamond as DiamondIcon2
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const type = url.searchParams.get('type') || 'all';
  const search = url.searchParams.get('search') || '';
  
  // Build where clause for activity logs
  const whereClause: any = {};
  
  if (type !== 'all') {
    whereClause.type = type.toUpperCase();
  }
  
  if (search) {
    whereClause.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { userId: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Get activity logs
  const [activityLogs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.activityLog.count({ where: whereClause })
  ]);
  
  // Get recent user actions
  const recentUserActions = await prisma.activityLog.findMany({
    where: {
      type: { in: ['USER_LOGIN', 'USER_REGISTRATION', 'USER_UPDATE', 'USER_DELETE'] }
    },
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
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      service: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Get recent registrations
  const recentRegistrations = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Get recent messages
  const recentMessages = await prisma.message.findMany({
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      recipient: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Get recent reviews
  const recentReviews = await prisma.review.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      service: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Get live user map data
  const liveUserMap = await prisma.activityLog.groupBy({
    by: ['location'],
    where: {
      type: 'USER_ACTIVE',
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    },
    _count: { id: true }
  });
  
  // Get active sessions count
  const activeSessions = await prisma.session.count({
    where: {
      expiresAt: { gt: new Date() }
    }
  });
  
  // Get activity statistics
  const activityStats = await Promise.all([
    prisma.activityLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.activityLog.count({
      where: {
        type: 'USER_LOGIN',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.activityLog.count({
      where: {
        type: 'BOOKING_CREATED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.activityLog.count({
      where: {
        type: 'REVIEW_CREATED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);
  
  return json({
    admin,
    activityLogs,
    totalCount,
    recentUserActions,
    recentBookings,
    recentRegistrations,
    recentMessages,
    recentReviews,
    liveUserMap,
    activeSessions,
    activityStats: {
      totalToday: activityStats[0],
      loginsToday: activityStats[1],
      bookingsToday: activityStats[2],
      reviewsToday: activityStats[3]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { type, search }
  });
}

export default function ActivityLogs() {
  const { 
    admin, 
    activityLogs, 
    totalCount, 
    recentUserActions, 
    recentBookings, 
    recentRegistrations, 
    recentMessages, 
    recentReviews, 
    liveUserMap, 
    activeSessions, 
    activityStats, 
    pagination, 
    filters 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleTypeChange = (newType: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', newType);
    setSearchParams(newParams);
  };
  
  const handleSearchChange = (search: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (search) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_LOGIN': return <User className="w-4 h-4" />;
      case 'USER_REGISTRATION': return <UserPlus className="w-4 h-4" />;
      case 'BOOKING_CREATED': return <Calendar className="w-4 h-4" />;
      case 'REVIEW_CREATED': return <Star className="w-4 h-4" />;
      case 'MESSAGE_SENT': return <MessageSquare className="w-4 h-4" />;
      case 'USER_UPDATE': return <Edit className="w-4 h-4" />;
      case 'USER_DELETE': return <Trash2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'USER_LOGIN': return 'text-green-600';
      case 'USER_REGISTRATION': return 'text-blue-600';
      case 'BOOKING_CREATED': return 'text-purple-600';
      case 'REVIEW_CREATED': return 'text-yellow-600';
      case 'MESSAGE_SENT': return 'text-indigo-600';
      case 'USER_UPDATE': return 'text-orange-600';
      case 'USER_DELETE': return 'text-red-600';
      default: return 'text-gray-600';
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
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Real-time activity monitoring and user behavior tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>
      
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Today</p>
              <p className="text-2xl font-bold text-gray-900">{activityStats.totalToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Logins Today</p>
              <p className="text-2xl font-bold text-gray-900">{activityStats.loginsToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Bookings Today</p>
              <p className="text-2xl font-bold text-gray-900">{activityStats.bookingsToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Reviews Today</p>
              <p className="text-2xl font-bold text-gray-900">{activityStats.reviewsToday}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent User Actions */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Recent User Actions</h2>
          </div>
          
          <div className="space-y-3">
            {recentUserActions.map((action) => (
              <div key={action.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${getActivityColor(action.type)}`}>
                  {getActivityIcon(action.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{action.description}</p>
                  <p className="text-xs text-gray-600">
                    {action.user?.name} • {formatTimeAgo(action.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Recent Bookings */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{booking.service?.name}</p>
                  <p className="text-xs text-gray-600">
                    {booking.user?.name} • {formatTimeAgo(booking.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${booking.totalAmount?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">{booking.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Live User Map */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Live User Map</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{activeSessions}</div>
              <p className="text-sm text-gray-600">Users currently online</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
            <div className="space-y-2">
              {liveUserMap.map((location) => (
                <div key={location.location} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{location.location || 'Unknown'}</span>
                  <span className="text-sm text-gray-600">{location._count.id} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
          </div>
          
          <div className="space-y-3">
            {recentRegistrations.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.role} • {formatTimeAgo(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Recent Messages */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
          </div>
          
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {message.sender?.name} → {message.recipient?.name}
                  </p>
                  <p className="text-xs text-gray-600">{formatTimeAgo(message.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Recent Reviews */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
          </div>
          
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={review.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{review.service?.name}</p>
                  <p className="text-xs text-gray-600">
                    {review.user?.name} • {review.rating}⭐ • {formatTimeAgo(review.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Activity Logs Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
          <div className="flex items-center space-x-4">
            <select
              value={filters.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="user_login">User Login</option>
              <option value="user_registration">User Registration</option>
              <option value="booking_created">Booking Created</option>
              <option value="review_created">Review Created</option>
              <option value="message_sent">Message Sent</option>
            </select>
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          {activityLogs.map((log) => (
            <div key={log.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${getActivityColor(log.type)}`}>
                {getActivityIcon(log.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{log.description}</p>
                <p className="text-xs text-gray-600">
                  {log.user?.name} ({log.user?.role}) • {log.ipAddress} • {formatTimeAgo(log.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{log.type.replace('_', ' ')}</p>
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
    </div>
  );
}
