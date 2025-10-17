import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Users,
  Building,
  Car,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  Settings,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  Timer,
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
  Tag,
  Priority,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  MessageCircle,
  UserCheck,
  UserX,
  Activity,
  Globe,
  Award,
  Flag,
  Shield,
  BookOpen
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const serviceType = url.searchParams.get('serviceType') || 'all';
  const paymentMethod = url.searchParams.get('paymentMethod') || 'all';
  
  // Set default date range if not provided (last 30 days)
  const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = dateTo ? new Date(dateTo) : new Date();
  
  // Build where clause for revenue data
  const whereClause: any = {
    status: { in: ['CONFIRMED', 'COMPLETED'] },
    createdAt: {
      gte: fromDate,
      lte: toDate
    }
  };
  
  if (serviceType !== 'all') {
    whereClause.serviceType = serviceType.toUpperCase();
  }
  
  if (paymentMethod !== 'all') {
    whereClause.paymentMethod = paymentMethod.toUpperCase();
  }
  
  // Get revenue statistics
  const revenueStats = await Promise.all([
    // Total bookings
    prisma.booking.aggregate({
      where: whereClause,
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    
    // Platform commission
    prisma.booking.aggregate({
      where: whereClause,
      _sum: { platformCommission: true }
    }),
    
    // Paid to providers
    prisma.booking.aggregate({
      where: whereClause,
      _sum: { providerAmount: true }
    }),
    
    // Previous period for comparison
    prisma.booking.aggregate({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(fromDate.getTime() - (toDate.getTime() - fromDate.getTime())),
          lte: fromDate
        }
      },
      _sum: { totalAmount: true }
    })
  ]);
  
  // Get revenue by service type
  const revenueByService = await Promise.all([
    prisma.booking.aggregate({
      where: { ...whereClause, serviceType: 'PROPERTY' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    prisma.booking.aggregate({
      where: { ...whereClause, serviceType: 'VEHICLE' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    prisma.booking.aggregate({
      where: { ...whereClause, serviceType: 'TOUR' },
      _sum: { totalAmount: true },
      _count: { id: true }
    })
  ]);
  
  // Get revenue by payment method
  const revenueByPayment = await Promise.all([
    prisma.booking.aggregate({
      where: { ...whereClause, paymentMethod: 'CREDIT_CARD' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    prisma.booking.aggregate({
      where: { ...whereClause, paymentMethod: 'PAYPAL' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    prisma.booking.aggregate({
      where: { ...whereClause, paymentMethod: 'BANK_TRANSFER' },
      _sum: { totalAmount: true },
      _count: { id: true }
    })
  ]);
  
  // Get top earning services
  const topEarningServices = await prisma.booking.groupBy({
    by: ['serviceId', 'serviceType'],
    where: whereClause,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: 10
  });
  
  // Get daily revenue for chart
  const dailyRevenue = await prisma.booking.groupBy({
    by: ['createdAt'],
    where: whereClause,
    _sum: { totalAmount: true },
    orderBy: { createdAt: 'asc' }
  });
  
  // Get revenue by location
  const revenueByLocation = await prisma.booking.groupBy({
    by: ['city'],
    where: whereClause,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: 10
  });
  
  // Calculate growth percentage
  const currentRevenue = revenueStats[0]._sum.totalAmount || 0;
  const previousRevenue = revenueStats[3]._sum.totalAmount || 0;
  const growthPercentage = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;
  
  return json({
    admin,
    revenueStats: {
      totalBookings: revenueStats[0]._count.id || 0,
      totalRevenue: currentRevenue,
      platformCommission: revenueStats[1]._sum.platformCommission || 0,
      paidToProviders: revenueStats[2]._sum.providerAmount || 0,
      growthPercentage
    },
    revenueByService: {
      properties: {
        amount: revenueByService[0]._sum.totalAmount || 0,
        count: revenueByService[0]._count.id || 0
      },
      vehicles: {
        amount: revenueByService[1]._sum.totalAmount || 0,
        count: revenueByService[1]._count.id || 0
      },
      tours: {
        amount: revenueByService[2]._sum.totalAmount || 0,
        count: revenueByService[2]._count.id || 0
      }
    },
    revenueByPayment: {
      creditCard: {
        amount: revenueByPayment[0]._sum.totalAmount || 0,
        count: revenueByPayment[0]._count.id || 0
      },
      paypal: {
        amount: revenueByPayment[1]._sum.totalAmount || 0,
        count: revenueByPayment[1]._count.id || 0
      },
      bankTransfer: {
        amount: revenueByPayment[2]._sum.totalAmount || 0,
        count: revenueByPayment[2]._count.id || 0
      }
    },
    topEarningServices,
    dailyRevenue,
    revenueByLocation,
    filters: { dateFrom, dateTo, serviceType, paymentMethod }
  });
}

export default function RevenueOverview() {
  const { 
    admin, 
    revenueStats, 
    revenueByService, 
    revenueByPayment, 
    topEarningServices, 
    dailyRevenue, 
    revenueByLocation, 
    filters 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };
  
  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'PROPERTY': return Building;
      case 'VEHICLE': return Car;
      case 'TOUR': return MapPin;
      default: return Star;
    }
  };
  
  const getServiceColor = (serviceType: string) => {
    switch (serviceType) {
      case 'PROPERTY': return 'text-green-600';
      case 'VEHICLE': return 'text-blue-600';
      case 'TOUR': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };
  
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD': return CreditCard;
      case 'PAYPAL': return Wallet;
      case 'BANK_TRANSFER': return Banknote;
      default: return DollarSign;
    }
  };
  
  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD': return 'text-blue-600';
      case 'PAYPAL': return 'text-yellow-600';
      case 'BANK_TRANSFER': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Overview</h1>
          <p className="text-gray-600">Track platform revenue and financial performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
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
            <label className="text-sm text-gray-600">Service Type:</label>
            <select
              value={filters.serviceType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('serviceType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Services</option>
              <option value="property">Properties</option>
              <option value="vehicle">Vehicles</option>
              <option value="tour">Tours</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Payment Method:</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('paymentMethod', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{revenueStats.totalBookings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {formatPercentage(revenueStats.growthPercentage)} vs previous period
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Platform Commission</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.platformCommission)}</p>
              <p className="text-xs text-gray-500">
                {((revenueStats.platformCommission / revenueStats.totalRevenue) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Paid to Providers</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.paidToProviders)}</p>
              <p className="text-xs text-gray-500">
                {((revenueStats.paidToProviders / revenueStats.totalRevenue) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.totalRevenue)}</p>
              <p className="text-xs text-gray-500">
                {formatPercentage(revenueStats.growthPercentage)} growth
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Revenue by Service Type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">Properties</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(revenueByService.properties.amount)}
            </div>
            <div className="text-sm text-gray-600">
              {revenueByService.properties.count} bookings
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ 
                  width: `${(revenueByService.properties.amount / revenueStats.totalRevenue) * 100}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Car className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Vehicles</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(revenueByService.vehicles.amount)}
            </div>
            <div className="text-sm text-gray-600">
              {revenueByService.vehicles.count} bookings
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ 
                  width: `${(revenueByService.vehicles.amount / revenueStats.totalRevenue) * 100}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <MapPin className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-semibold text-gray-900">Tours</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(revenueByService.tours.amount)}
            </div>
            <div className="text-sm text-gray-600">
              {revenueByService.tours.count} bookings
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-500 h-2 rounded-full"
                style={{ 
                  width: `${(revenueByService.tours.amount / revenueStats.totalRevenue) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Revenue by Payment Method */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Credit Card</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(revenueByPayment.creditCard.amount)}
              </div>
              <div className="text-sm text-gray-600">
                {revenueByPayment.creditCard.count} transactions
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-gray-900">PayPal</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(revenueByPayment.paypal.amount)}
              </div>
              <div className="text-sm text-gray-600">
                {revenueByPayment.paypal.count} transactions
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Banknote className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Bank Transfer</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(revenueByPayment.bankTransfer.amount)}
              </div>
              <div className="text-sm text-gray-600">
                {revenueByPayment.bankTransfer.count} transactions
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Top Earning Services */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Earning Services</h3>
        <div className="space-y-3">
          {topEarningServices.map((service, index) => {
            const ServiceIcon = getServiceIcon(service.serviceType);
            return (
              <div key={`${service.serviceType}-${service.serviceId}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <ServiceIcon className={`w-5 h-5 ${getServiceColor(service.serviceType)}`} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {service.serviceType} #{service.serviceId.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {service._count.id} bookings
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(service._sum.totalAmount || 0)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Revenue by Location */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Location</h3>
        <div className="space-y-3">
          {revenueByLocation.map((location, index) => (
            <div key={location.city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">{location.city}</div>
                  <div className="text-sm text-gray-600">
                    {location._count.id} bookings
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(location._sum.totalAmount || 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}