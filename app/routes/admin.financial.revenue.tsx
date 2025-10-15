import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Building, 
  Car, 
  MapPin, 
  User,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Star,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Zap
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '30';
  const type = url.searchParams.get('type') || 'all';
  
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Get revenue statistics
  const [totalRevenue, propertyRevenue, vehicleRevenue, tourRevenue] = await Promise.all([
    Promise.all([
      prisma.propertyBooking.aggregate({ 
        _sum: { totalPrice: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'CONFIRMED'
        }
      }),
      prisma.vehicleBooking.aggregate({ 
        _sum: { totalPrice: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'CONFIRMED'
        }
      }),
      prisma.tourBooking.aggregate({ 
        _sum: { totalPrice: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'CONFIRMED'
        }
      })
    ]).then(results => results.reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0)),
    
    prisma.propertyBooking.aggregate({ 
      _sum: { totalPrice: true },
      _count: { id: true },
      where: { 
        createdAt: { gte: startDate },
        status: 'CONFIRMED'
      }
    }),
    
    prisma.vehicleBooking.aggregate({ 
      _sum: { totalPrice: true },
      _count: { id: true },
      where: { 
        createdAt: { gte: startDate },
        status: 'CONFIRMED'
      }
    }),
    
    prisma.tourBooking.aggregate({ 
      _sum: { totalPrice: true },
      _count: { id: true },
      where: { 
        createdAt: { gte: startDate },
        status: 'CONFIRMED'
      }
    })
  ]);
  
  // Get commission data
  const commissionRate = 0.1; // 10% commission
  const totalCommission = totalRevenue * commissionRate;
  const netRevenue = totalRevenue - totalCommission;
  
  // Get monthly revenue for chart
  const monthlyRevenue = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(new Date().getFullYear(), i, 1);
      const monthEnd = new Date(new Date().getFullYear(), i + 1, 0);
      
      return Promise.all([
        prisma.propertyBooking.aggregate({
          _sum: { totalPrice: true },
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: 'CONFIRMED'
          }
        }),
        prisma.vehicleBooking.aggregate({
          _sum: { totalPrice: true },
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: 'CONFIRMED'
          }
        }),
        prisma.tourBooking.aggregate({
          _sum: { totalPrice: true },
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: 'CONFIRMED'
          }
        })
      ]).then(results => {
        const monthRevenue = results.reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0);
        return {
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          commission: monthRevenue * commissionRate
        };
      });
    })
  );
  
  // Get top performing services
  const [topProperties, topVehicles, topTours] = await Promise.all([
    prisma.property.findMany({
      take: 5,
      orderBy: { bookings: { _count: 'desc' } },
      include: {
        _count: {
          select: { bookings: true }
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          select: { totalPrice: true }
        }
      }
    }),
    
    prisma.vehicle.findMany({
      take: 5,
      orderBy: { bookings: { _count: 'desc' } },
      include: {
        _count: {
          select: { bookings: true }
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          select: { totalPrice: true }
        }
      }
    }),
    
    prisma.tour.findMany({
      take: 5,
      orderBy: { bookings: { _count: 'desc' } },
      include: {
        _count: {
          select: { bookings: true }
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          select: { totalPrice: true }
        }
      }
    })
  ]);
  
  // Get revenue by status
  const revenueByStatus = await Promise.all([
    prisma.propertyBooking.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'CONFIRMED' }
    }),
    prisma.vehicleBooking.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'CONFIRMED' }
    }),
    prisma.tourBooking.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'CONFIRMED' }
    }),
    prisma.propertyBooking.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'PENDING' }
    }),
    prisma.vehicleBooking.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'PENDING' }
    }),
    prisma.tourBooking.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'PENDING' }
    })
  ]);
  
  const confirmedRevenue = revenueByStatus.slice(0, 3).reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0);
  const pendingRevenue = revenueByStatus.slice(3, 6).reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0);
  
  // Get growth metrics
  const previousPeriodStart = new Date(Date.now() - (days * 2) * 24 * 60 * 60 * 1000);
  const previousPeriodEnd = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const previousRevenue = await Promise.all([
    prisma.propertyBooking.aggregate({ 
      _sum: { totalPrice: true },
      where: { 
        createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd },
        status: 'CONFIRMED'
      }
    }),
    prisma.vehicleBooking.aggregate({ 
      _sum: { totalPrice: true },
      where: { 
        createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd },
        status: 'CONFIRMED'
      }
    }),
    prisma.tourBooking.aggregate({ 
      _sum: { totalPrice: true },
      where: { 
        createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd },
        status: 'CONFIRMED'
      }
    })
  ]).then(results => results.reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0));
  
  const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  
  return json({
    admin,
    revenue: {
      total: totalRevenue,
      property: propertyRevenue._sum.totalPrice || 0,
      vehicle: vehicleRevenue._sum.totalPrice || 0,
      tour: tourRevenue._sum.totalPrice || 0,
      commission: totalCommission,
      net: netRevenue
    },
    bookings: {
      property: propertyRevenue._count.id || 0,
      vehicle: vehicleRevenue._count.id || 0,
      tour: tourRevenue._count.id || 0,
      total: (propertyRevenue._count.id || 0) + (vehicleRevenue._count.id || 0) + (tourRevenue._count.id || 0)
    },
    monthlyRevenue,
    topProperties,
    topVehicles,
    topTours,
    revenueByStatus: {
      confirmed: confirmedRevenue,
      pending: pendingRevenue
    },
    growth: {
      rate: growthRate,
      previous: previousRevenue,
      current: totalRevenue
    },
    filters: { period, type }
  });
}

export default function RevenueOverview() {
  const { admin, revenue, bookings, monthlyRevenue, topProperties, topVehicles, topTours, revenueByStatus, growth, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };
  
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Overview</h1>
          <p className="text-gray-600">Platform revenue analytics and financial insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Period Filter */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <select
            value={filters.period}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('period', e.target.value);
              setSearchParams(newParams);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </Card>
      
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.total)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Property Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.property)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.vehicle)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tour Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.tour)}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Commission & Growth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Platform Commission</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.commission)}</p>
              <p className="text-xs text-gray-500">10% of total revenue</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.net)}</p>
              <p className="text-xs text-gray-500">After commission</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${growth.rate >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {growth.rate >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className={`text-2xl font-bold ${growth.rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(growth.rate)}
              </p>
              <p className="text-xs text-gray-500">vs previous period</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Booking Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Property Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.property}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.vehicle}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tour Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.tour}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Monthly Revenue Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
        <div className="space-y-4">
          {monthlyRevenue.map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <span className="font-medium text-gray-900">{month.month}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(month.revenue)}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">{formatCurrency(month.commission)}</p>
                  <p className="text-xs text-gray-500">Commission</p>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(month.revenue / Math.max(...monthlyRevenue.map(m => m.revenue))) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Top Performing Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Properties</h3>
          <div className="space-y-3">
            {topProperties.map((property, index) => (
              <div key={property.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.name}</p>
                    <p className="text-sm text-gray-600">{property.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{property._count.bookings}</p>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Vehicles</h3>
          <div className="space-y-3">
            {topVehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-sm text-gray-600">{vehicle.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{vehicle._count.bookings}</p>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tours</h3>
          <div className="space-y-3">
            {topTours.map((tour, index) => (
              <div key={tour.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tour.title}</p>
                    <p className="text-sm text-gray-600">{tour.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{tour._count.bookings}</p>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Revenue by Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Confirmed Revenue</p>
                  <p className="text-sm text-gray-600">Completed bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{formatCurrency(revenueByStatus.confirmed)}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Pending Revenue</p>
                  <p className="text-sm text-gray-600">Awaiting confirmation</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(revenueByStatus.pending)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Revenue Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Properties</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((revenue.property / revenue.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vehicles</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((revenue.vehicle / revenue.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tours</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((revenue.tour / revenue.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
