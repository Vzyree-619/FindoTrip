import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  BarChart3, 
  TrendingUp,
  Users,
  UserPlus,
  Activity,
  DollarSign,
  Calendar,
  MapPin,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
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
  MessageSquare,
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
  Globe as GlobeIcon,
  CreditCard,
  Shield,
  Bell,
  Building,
  Car,
  MapPin as MapPinIcon,
  Star,
  Heart,
  Share2,
  Gift,
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
  PieChart,
  LineChart,
  TrendingDown,
  Zap,
  Award,
  Target as TargetIcon2,
  Trophy,
  Medal,
  Crown,
  Star as StarIcon2,
  Heart as HeartIcon2,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon2,
  BookmarkCheck as BookmarkCheckIcon2,
  Lightbulb as LightbulbIcon2,
  Target as TargetIcon3,
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
  const period = url.searchParams.get('period') || '30';
  const comparePeriod = url.searchParams.get('comparePeriod') || 'previous';
  
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const compareStartDate = new Date(Date.now() - (days * 2) * 24 * 60 * 60 * 1000);
  const compareEndDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Get user statistics
  const [totalUsers, activeUsers, newUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ 
      where: { 
        lastActiveAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.user.count({ 
      where: { 
        createdAt: { gte: startDate } 
      } 
    })
  ]);
  
  // Get previous period for comparison
  const [previousTotalUsers, previousActiveUsers, previousNewUsers] = await Promise.all([
    prisma.user.count({ 
      where: { 
        createdAt: { lt: startDate } 
      } 
    }),
    prisma.user.count({ 
      where: { 
        lastActiveAt: { 
          gte: compareStartDate,
          lt: compareEndDate
        } 
      } 
    }),
    prisma.user.count({ 
      where: { 
        createdAt: { 
          gte: compareStartDate,
          lt: compareEndDate
        } 
      } 
    })
  ]);
  
  // Get booking statistics
  const [totalBookings, totalRevenue, avgBookingValue] = await Promise.all([
    prisma.booking.count({ 
      where: { 
        createdAt: { gte: startDate } 
      } 
    }),
    prisma.booking.aggregate({
      where: { 
        createdAt: { gte: startDate },
        status: 'CONFIRMED'
      },
      _sum: { totalAmount: true }
    }),
    prisma.booking.aggregate({
      where: { 
        createdAt: { gte: startDate },
        status: 'CONFIRMED'
      },
      _avg: { totalAmount: true }
    })
  ]);
  
  // Get previous period booking data
  const [previousTotalBookings, previousTotalRevenue, previousAvgBookingValue] = await Promise.all([
    prisma.booking.count({ 
      where: { 
        createdAt: { 
          gte: compareStartDate,
          lt: compareEndDate
        } 
      } 
    }),
    prisma.booking.aggregate({
      where: { 
        createdAt: { 
          gte: compareStartDate,
          lt: compareEndDate
        },
        status: 'CONFIRMED'
      },
      _sum: { totalAmount: true }
    }),
    prisma.booking.aggregate({
      where: { 
        createdAt: { 
          gte: compareStartDate,
          lt: compareEndDate
        },
        status: 'CONFIRMED'
      },
      _avg: { totalAmount: true }
    })
  ]);
  
  // Get conversion rate
  const totalVisitors = await prisma.analyticsEvent.count({
    where: {
      eventType: 'page_view',
      createdAt: { gte: startDate }
    }
  });
  
  const conversionRate = totalVisitors > 0 ? (totalBookings / totalVisitors) * 100 : 0;
  
  // Get booking trends by service type
  const bookingTrends = await prisma.booking.groupBy({
    by: ['serviceType'],
    where: { 
      createdAt: { gte: startDate } 
    },
    _count: { id: true },
    _sum: { totalAmount: true }
  });
  
  // Get traffic sources
  const trafficSources = await prisma.analyticsEvent.groupBy({
    by: ['source'],
    where: {
      eventType: 'page_view',
      createdAt: { gte: startDate }
    },
    _count: { id: true }
  });
  
  // Get geographic distribution
  const geographicData = await prisma.booking.groupBy({
    by: ['location'],
    where: { 
      createdAt: { gte: startDate } 
    },
    _count: { id: true },
    _sum: { totalAmount: true }
  });
  
  // Get user behavior metrics
  const userBehavior = await Promise.all([
    prisma.analyticsEvent.aggregate({
      where: {
        eventType: 'session_duration',
        createdAt: { gte: startDate }
      },
      _avg: { value: true }
    }),
    prisma.analyticsEvent.aggregate({
      where: {
        eventType: 'pages_per_session',
        createdAt: { gte: startDate }
      },
      _avg: { value: true }
    }),
    prisma.analyticsEvent.aggregate({
      where: {
        eventType: 'bounce_rate',
        createdAt: { gte: startDate }
      },
      _avg: { value: true }
    })
  ]);
  
  // Get most viewed pages
  const mostViewedPages = await prisma.analyticsEvent.groupBy({
    by: ['page'],
    where: {
      eventType: 'page_view',
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });
  
  // Get most searched terms
  const mostSearchedTerms = await prisma.analyticsEvent.groupBy({
    by: ['searchTerm'],
    where: {
      eventType: 'search',
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });
  
  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  return json({
    admin,
    period: {
      current: days,
      label: `${days} days`
    },
    kpis: {
      totalUsers: {
        value: totalUsers,
        growth: calculateGrowth(totalUsers, previousTotalUsers),
        label: 'Total Users'
      },
      activeUsers: {
        value: activeUsers,
        growth: calculateGrowth(activeUsers, previousActiveUsers),
        label: 'Active Users'
      },
      newUsers: {
        value: newUsers,
        growth: calculateGrowth(newUsers, previousNewUsers),
        label: 'New Users'
      },
      totalBookings: {
        value: totalBookings,
        growth: calculateGrowth(totalBookings, previousTotalBookings),
        label: 'Total Bookings'
      },
      conversionRate: {
        value: conversionRate,
        growth: 0, // Will calculate separately
        label: 'Conversion Rate'
      },
      avgBookingValue: {
        value: avgBookingValue._avg.totalAmount || 0,
        growth: calculateGrowth(
          avgBookingValue._avg.totalAmount || 0, 
          previousAvgBookingValue._avg.totalAmount || 0
        ),
        label: 'Avg Booking Value'
      }
    },
    revenue: {
      total: totalRevenue._sum.totalAmount || 0,
      growth: calculateGrowth(
        totalRevenue._sum.totalAmount || 0,
        previousTotalRevenue._sum.totalAmount || 0
      )
    },
    bookingTrends: bookingTrends.map(trend => ({
      serviceType: trend.serviceType,
      count: trend._count.id,
      revenue: trend._sum.totalAmount || 0,
      percentage: totalBookings > 0 ? (trend._count.id / totalBookings) * 100 : 0
    })),
    trafficSources: trafficSources.map(source => ({
      source: source.source || 'Direct',
      count: source._count.id,
      percentage: totalVisitors > 0 ? (source._count.id / totalVisitors) * 100 : 0
    })),
    geographicData: geographicData.map(geo => ({
      location: geo.location || 'Unknown',
      bookings: geo._count.id,
      revenue: geo._sum.totalAmount || 0
    })),
    userBehavior: {
      avgSessionDuration: userBehavior[0]._avg.value || 0,
      pagesPerSession: userBehavior[1]._avg.value || 0,
      bounceRate: userBehavior[2]._avg.value || 0
    },
    mostViewedPages: mostViewedPages.map(page => ({
      page: page.page || 'Unknown',
      views: page._count.id
    })),
    mostSearchedTerms: mostSearchedTerms.map(term => ({
      term: term.searchTerm || 'Unknown',
      searches: term._count.id
    }))
  });
}

export default function PlatformAnalytics() {
  const { 
    admin, 
    period, 
    kpis, 
    revenue, 
    bookingTrends, 
    trafficSources, 
    geographicData, 
    userBehavior, 
    mostViewedPages, 
    mostSearchedTerms 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handlePeriodChange = (newPeriod: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('period', newPeriod);
    setSearchParams(newParams);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };
  
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600">Comprehensive platform metrics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period.current}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(kpis).map(([key, kpi]) => (
          <Card key={key} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {key === 'conversionRate' ? formatPercentage(kpi.value) : 
                   key === 'avgBookingValue' ? formatCurrency(kpi.value) :
                   kpi.value.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {getGrowthIcon(kpi.growth)}
                <span className={`text-sm font-medium ${getGrowthColor(kpi.growth)}`}>
                  {kpi.growth > 0 ? '+' : ''}{formatPercentage(kpi.growth)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Revenue Overview */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Revenue Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Total Revenue</h3>
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(revenue.total)}</span>
              <div className="flex items-center space-x-1">
                {getGrowthIcon(revenue.growth)}
                <span className={`text-sm font-medium ${getGrowthColor(revenue.growth)}`}>
                  {revenue.growth > 0 ? '+' : ''}{formatPercentage(revenue.growth)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Chart</h3>
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Revenue chart would go here</span>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Booking Trends */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Booking Trends</h2>
        </div>
        
        <div className="space-y-4">
          {bookingTrends.map((trend) => (
            <div key={trend.serviceType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{trend.serviceType}</p>
                  <p className="text-xs text-gray-600">{trend.count} bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(trend.revenue)}</p>
                <p className="text-xs text-gray-600">{formatPercentage(trend.percentage)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Traffic Sources */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Traffic Sources</h2>
        </div>
        
        <div className="space-y-4">
          {trafficSources.map((source) => (
            <div key={source.source} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium text-gray-900">{source.source}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {formatPercentage(source.percentage)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Geographic Distribution */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <MapPin className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Geographic Distribution</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Cities</h3>
            <div className="space-y-3">
              {geographicData.slice(0, 5).map((geo, index) => (
                <div key={geo.location} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{geo.location}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{geo.bookings} bookings</p>
                    <p className="text-xs text-gray-600">{formatCurrency(geo.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Map Visualization</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Interactive map would go here</span>
            </div>
          </div>
        </div>
      </Card>
      
      {/* User Behavior */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Users className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">User Behavior</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(userBehavior.avgSessionDuration / 60)}m {Math.round(userBehavior.avgSessionDuration % 60)}s
            </div>
            <p className="text-sm text-gray-600">Average Session Duration</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {userBehavior.pagesPerSession.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Pages Per Session</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(userBehavior.bounceRate)}
            </div>
            <p className="text-sm text-gray-600">Bounce Rate</p>
          </div>
        </div>
      </Card>
      
      {/* Most Viewed Pages */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Eye className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Most Viewed Pages</h2>
        </div>
        
        <div className="space-y-3">
          {mostViewedPages.map((page, index) => (
            <div key={page.page} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <span className="text-sm font-medium text-gray-900">{page.page}</span>
              </div>
              <span className="text-sm text-gray-600">{page.views.toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Most Searched Terms */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Search className="w-6 h-6 text-pink-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Most Searched Terms</h2>
        </div>
        
        <div className="space-y-3">
          {mostSearchedTerms.map((term, index) => (
            <div key={term.term} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <span className="text-sm font-medium text-gray-900">"{term.term}"</span>
              </div>
              <span className="text-sm text-gray-600">{term.searches.toLocaleString()} searches</span>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Export Options */}
      <div className="flex items-center justify-center space-x-4">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          PDF Report
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Excel Spreadsheet
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV Data
        </Button>
      </div>
    </div>
  );
}
