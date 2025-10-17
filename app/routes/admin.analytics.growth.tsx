import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  UserPlus,
  Activity,
  DollarSign,
  Calendar,
  Target,
  Zap,
  Award,
  Trophy,
  Medal,
  Crown,
  Star,
  Heart,
  BarChart3,
  PieChart,
  LineChart,
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
  Search,
  Filter,
  Globe as GlobeIcon,
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
  const period = url.searchParams.get('period') || '12';
  
  const months = parseInt(period);
  const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
  
  // Get monthly growth data
  const monthlyData = await Promise.all(
    Array.from({ length: months }, (_, i) => {
      const monthStart = new Date(startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      return Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        }),
        prisma.booking.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        }),
        prisma.booking.aggregate({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            },
            status: 'CONFIRMED'
          },
          _sum: { totalAmount: true }
        })
      ]);
    })
  );
  
  // Get user acquisition cost (simplified calculation)
  const totalMarketingSpend = await prisma.marketingSpend.aggregate({
    where: {
      createdAt: { gte: startDate }
    },
    _sum: { amount: true }
  });
  
  const totalNewUsers = await prisma.user.count({
    where: {
      createdAt: { gte: startDate }
    }
  });
  
  const userAcquisitionCost = totalNewUsers > 0 ? (totalMarketingSpend._sum.amount || 0) / totalNewUsers : 0;
  
  // Get customer lifetime value
  const customerLifetimeValue = await prisma.booking.aggregate({
    where: {
      createdAt: { gte: startDate },
      status: 'CONFIRMED'
    },
    _avg: { totalAmount: true }
  });
  
  // Get churn rate (users who haven't been active in 30 days)
  const churnRate = await prisma.user.count({
    where: {
      lastActiveAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  const totalUsers = await prisma.user.count();
  const churnPercentage = totalUsers > 0 ? (churnRate / totalUsers) * 100 : 0;
  
  // Get retention rate (users active in last 30 days)
  const retentionRate = await prisma.user.count({
    where: {
      lastActiveAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  const retentionPercentage = totalUsers > 0 ? (retentionRate / totalUsers) * 100 : 0;
  
  // Get growth forecasting data
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  
  const userGrowthRate = previousMonth && previousMonth[0] > 0 
    ? ((currentMonth[0] - previousMonth[0]) / previousMonth[0]) * 100 
    : 0;
  
  const bookingGrowthRate = previousMonth && previousMonth[1] > 0 
    ? ((currentMonth[1] - previousMonth[1]) / previousMonth[1]) * 100 
    : 0;
  
  const revenueGrowthRate = previousMonth && previousMonth[2]._sum.totalAmount && previousMonth[2]._sum.totalAmount > 0 
    ? ((currentMonth[2]._sum.totalAmount - previousMonth[2]._sum.totalAmount) / previousMonth[2]._sum.totalAmount) * 100 
    : 0;
  
  // Forecast next 3 months
  const forecastData = Array.from({ length: 3 }, (_, i) => {
    const monthIndex = months + i;
    const forecastUsers = Math.round(currentMonth[0] * Math.pow(1 + userGrowthRate / 100, i + 1));
    const forecastBookings = Math.round(currentMonth[1] * Math.pow(1 + bookingGrowthRate / 100, i + 1));
    const forecastRevenue = (currentMonth[2]._sum.totalAmount || 0) * Math.pow(1 + revenueGrowthRate / 100, i + 1);
    
    return {
      month: monthIndex,
      users: forecastUsers,
      bookings: forecastBookings,
      revenue: forecastRevenue
    };
  });
  
  // Get top performing services
  const topServices = await prisma.booking.groupBy({
    by: ['serviceType'],
    where: {
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    _sum: { totalAmount: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });
  
  // Get geographic growth
  const geographicGrowth = await prisma.booking.groupBy({
    by: ['location'],
    where: {
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    _sum: { totalAmount: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });
  
  return json({
    admin,
    period: {
      months,
      label: `${months} months`
    },
    monthlyData: monthlyData.map((data, index) => ({
      month: index + 1,
      users: data[0],
      bookings: data[1],
      revenue: data[2]._sum.totalAmount || 0
    })),
    growthMetrics: {
      userAcquisitionCost,
      customerLifetimeValue: customerLifetimeValue._avg.totalAmount || 0,
      churnRate: churnPercentage,
      retentionRate: retentionPercentage,
      userGrowthRate,
      bookingGrowthRate,
      revenueGrowthRate
    },
    forecastData,
    topServices: topServices.map(service => ({
      serviceType: service.serviceType,
      bookings: service._count.id,
      revenue: service._sum.totalAmount || 0
    })),
    geographicGrowth: geographicGrowth.map(geo => ({
      location: geo.location,
      bookings: geo._count.id,
      revenue: geo._sum.totalAmount || 0
    }))
  });
}

export default function GrowthMetrics() {
  const { 
    admin, 
    period, 
    monthlyData, 
    growthMetrics, 
    forecastData, 
    topServices, 
    geographicGrowth 
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
          <h1 className="text-2xl font-bold text-gray-900">Growth Metrics</h1>
          <p className="text-gray-600">Track platform growth and forecast future performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period.months}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="24">Last 24 Months</option>
          </select>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Growth Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">User Growth</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(growthMetrics.userGrowthRate)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(growthMetrics.revenueGrowthRate)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">User Acquisition Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(growthMetrics.userAcquisitionCost)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Lifetime Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(growthMetrics.customerLifetimeValue)}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Retention & Churn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Retention Rate</h2>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {formatPercentage(growthMetrics.retentionRate)}
            </div>
            <p className="text-sm text-gray-600">Users active in last 30 days</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Churn Rate</h2>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {formatPercentage(growthMetrics.churnRate)}
            </div>
            <p className="text-sm text-gray-600">Users inactive for 30+ days</p>
          </div>
        </Card>
      </div>
      
      {/* Monthly Growth Chart */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LineChart className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Monthly Growth Trends</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
            <div className="space-y-2">
              {monthlyData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Month {data.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{data.users}</span>
                    {index > 0 && (
                      <div className="flex items-center space-x-1">
                        {getGrowthIcon(data.users - monthlyData[index - 1].users)}
                        <span className={`text-xs ${getGrowthColor(data.users - monthlyData[index - 1].users)}`}>
                          {data.users > monthlyData[index - 1].users ? '+' : ''}
                          {data.users - monthlyData[index - 1].users}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Growth</h3>
            <div className="space-y-2">
              {monthlyData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Month {data.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{data.bookings}</span>
                    {index > 0 && (
                      <div className="flex items-center space-x-1">
                        {getGrowthIcon(data.bookings - monthlyData[index - 1].bookings)}
                        <span className={`text-xs ${getGrowthColor(data.bookings - monthlyData[index - 1].bookings)}`}>
                          {data.bookings > monthlyData[index - 1].bookings ? '+' : ''}
                          {data.bookings - monthlyData[index - 1].bookings}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Growth</h3>
            <div className="space-y-2">
              {monthlyData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Month {data.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(data.revenue)}</span>
                    {index > 0 && (
                      <div className="flex items-center space-x-1">
                        {getGrowthIcon(data.revenue - monthlyData[index - 1].revenue)}
                        <span className={`text-xs ${getGrowthColor(data.revenue - monthlyData[index - 1].revenue)}`}>
                          {data.revenue > monthlyData[index - 1].revenue ? '+' : ''}
                          {formatCurrency(data.revenue - monthlyData[index - 1].revenue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Growth Forecasting */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Growth Forecasting</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {forecastData.map((forecast, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Month {forecast.month} Forecast
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Users</span>
                  <span className="text-sm font-medium text-gray-900">{forecast.users.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bookings</span>
                  <span className="text-sm font-medium text-gray-900">{forecast.bookings.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(forecast.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Top Performing Services */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Trophy className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Top Performing Services</h2>
        </div>
        
        <div className="space-y-4">
          {topServices.map((service, index) => (
            <div key={service.serviceType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                  #{index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{service.serviceType}</p>
                  <p className="text-xs text-gray-600">{service.bookings} bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(service.revenue)}</p>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Geographic Growth */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Geographic Growth</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Growing Locations</h3>
            <div className="space-y-3">
              {geographicGrowth.slice(0, 5).map((geo, index) => (
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Map</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Interactive growth map would go here</span>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Growth Insights */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Growth Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>User Growth:</strong> {growthMetrics.userGrowthRate > 0 ? 'Growing' : 'Declining'} at {formatPercentage(Math.abs(growthMetrics.userGrowthRate))} per month
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Revenue Growth:</strong> {growthMetrics.revenueGrowthRate > 0 ? 'Growing' : 'Declining'} at {formatPercentage(Math.abs(growthMetrics.revenueGrowthRate))} per month
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Retention:</strong> {growthMetrics.retentionRate > 70 ? 'Excellent' : growthMetrics.retentionRate > 50 ? 'Good' : 'Needs Improvement'} at {formatPercentage(growthMetrics.retentionRate)}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {growthMetrics.userGrowthRate < 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Action Required:</strong> User growth is declining. Consider marketing campaigns and user acquisition strategies.
                  </p>
                </div>
              )}
              {growthMetrics.retentionRate < 50 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Improvement Needed:</strong> Low retention rate. Focus on user engagement and experience improvements.
                  </p>
                </div>
              )}
              {growthMetrics.userAcquisitionCost > growthMetrics.customerLifetimeValue && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Optimization:</strong> User acquisition cost exceeds lifetime value. Optimize marketing spend and improve conversion.
                  </p>
                </div>
              )}
            </div>
          </div>
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
