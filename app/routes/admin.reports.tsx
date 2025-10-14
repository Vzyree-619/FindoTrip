import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  BarChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Building,
  Car,
  MapPin,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  CreditCard,
  Wallet,
  Target,
  Award,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '30d';
  const service = url.searchParams.get('service') || 'all';
  
  // Calculate date range
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  // Get financial data
  const [
    totalRevenue,
    totalBookings,
    totalUsers,
    totalProviders,
    revenueByService,
    bookingsByService,
    monthlyRevenue,
    topProperties,
    topVehicles,
    topTours,
    recentBookings,
    paymentMethods,
    userGrowth,
    bookingTrends
  ] = await Promise.all([
    // Total Revenue
    prisma.propertyBooking.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      },
      _sum: { totalPrice: true }
    }).then(result => result._sum.totalPrice || 0) +
    prisma.vehicleBooking.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      },
      _sum: { totalPrice: true }
    }).then(result => result._sum.totalPrice || 0) +
    prisma.tourBooking.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      },
      _sum: { totalPrice: true }
    }).then(result => result._sum.totalPrice || 0),
    
    // Total Bookings
    prisma.propertyBooking.count({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      }
    }) + prisma.vehicleBooking.count({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      }
    }) + prisma.tourBooking.count({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      }
    }),
    
    // Total Users
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: startDate }
      }
    }),
    
    // Total Providers
    prisma.user.count({
      where: {
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
        createdAt: { gte: startDate }
      }
    }),
    
    // Revenue by Service
    Promise.all([
      prisma.propertyBooking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      }).then(result => ({ service: 'Properties', revenue: result._sum.totalPrice || 0 })),
      prisma.vehicleBooking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      }).then(result => ({ service: 'Vehicles', revenue: result._sum.totalPrice || 0 })),
      prisma.tourBooking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      }).then(result => ({ service: 'Tours', revenue: result._sum.totalPrice || 0 }))
    ]),
    
    // Bookings by Service
    Promise.all([
      prisma.propertyBooking.count({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        }
      }).then(count => ({ service: 'Properties', bookings: count })),
      prisma.vehicleBooking.count({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        }
      }).then(count => ({ service: 'Vehicles', bookings: count })),
      prisma.tourBooking.count({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        }
      }).then(count => ({ service: 'Tours', bookings: count }))
    ]),
    
    // Monthly Revenue (last 12 months)
    (async () => {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const revenue = await prisma.propertyBooking.aggregate({
          where: {
            status: 'CONFIRMED',
            createdAt: { gte: monthStart, lte: monthEnd }
          },
          _sum: { totalPrice: true }
        }).then(result => result._sum.totalPrice || 0) +
        await prisma.vehicleBooking.aggregate({
          where: {
            status: 'CONFIRMED',
            createdAt: { gte: monthStart, lte: monthEnd }
          },
          _sum: { totalPrice: true }
        }).then(result => result._sum.totalPrice || 0) +
        await prisma.tourBooking.aggregate({
          where: {
            status: 'CONFIRMED',
            createdAt: { gte: monthStart, lte: monthEnd }
          },
          _sum: { totalPrice: true }
        }).then(result => result._sum.totalPrice || 0);
        
        months.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue
        });
      }
      return months;
    })(),
    
    // Top Properties
    prisma.property.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        basePrice: true,
        rating: true,
        reviewCount: true,
        _count: {
          select: { bookings: true }
        }
      }
    }),
    
    // Top Vehicles
    prisma.vehicle.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        brand: true,
        model: true,
        city: true,
        basePrice: true,
        rating: true,
        reviewCount: true,
        _count: {
          select: { bookings: true }
        }
      }
    }),
    
    // Top Tours
    prisma.tour.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        title: true,
        city: true,
        pricePerPerson: true,
        rating: true,
        reviewCount: true,
        _count: {
          select: { bookings: true }
        }
      }
    }),
    
    // Recent Bookings
    Promise.all([
      prisma.propertyBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          property: { select: { name: true, city: true } }
        }
      }),
      prisma.vehicleBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          vehicle: { select: { brand: true, model: true, city: true } }
        }
      }),
      prisma.tourBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          tour: { select: { title: true, city: true } }
        }
      })
    ]).then(results => results.flat()),
    
    // Payment Methods (mock data for now)
    [
      { method: 'Credit Card', count: 45, percentage: 45 },
      { method: 'Bank Transfer', count: 30, percentage: 30 },
      { method: 'Mobile Wallet', count: 20, percentage: 20 },
      { method: 'Cash', count: 5, percentage: 5 }
    ],
    
    // User Growth (mock data for now)
    Array.from({ length: 12 }, (_, i) => ({
      month: new Date(now.getFullYear(), now.getMonth() - 11 + i, 1).toLocaleDateString('en-US', { month: 'short' }),
      users: Math.floor(Math.random() * 100) + 50
    })),
    
    // Booking Trends (mock data for now)
    Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bookings: Math.floor(Math.random() * 20) + 5
    }))
  ]);
  
  return json({
    admin,
    period,
    service,
    stats: {
      totalRevenue,
      totalBookings,
      totalUsers,
      totalProviders
    },
    revenueByService,
    bookingsByService,
    monthlyRevenue,
    topProperties,
    topVehicles,
    topTours,
    recentBookings,
    paymentMethods,
    userGrowth,
    bookingTrends
  });
}

export default function AdminReports() {
  const { admin, period, service, stats, revenueByService, bookingsByService, monthlyRevenue, topProperties, topVehicles, topTours, recentBookings, paymentMethods, userGrowth, bookingTrends } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedChart, setSelectedChart] = useState('revenue');
  
  const handlePeriodChange = (newPeriod: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('period', newPeriod);
    setSearchParams(newParams);
  };
  
  const handleServiceChange = (newService: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('service', newService);
    setSearchParams(newParams);
  };
  
  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];
  
  const services = [
    { value: 'all', label: 'All Services' },
    { value: 'property', label: 'Properties' },
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'tour', label: 'Tours' }
  ];
  
  const chartTypes = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'growth', label: 'Growth', icon: TrendingUp }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and financial insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {services.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {chartTypes.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {stats.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8.2%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+15.3%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Providers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProviders.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+6.7%</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Building className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
          <div className="space-y-4">
            {revenueByService.map((item, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
              const totalRevenue = revenueByService.reduce((sum, item) => sum + item.revenue, 0);
              const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                    <span className="text-sm font-medium text-gray-900">{item.service}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">PKR {item.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        {/* Bookings by Service */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Service</h3>
          <div className="space-y-4">
            {bookingsByService.map((item, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
              const totalBookings = bookingsByService.reduce((sum, item) => sum + item.bookings, 0);
              const percentage = totalBookings > 0 ? (item.bookings / totalBookings) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                    <span className="text-sm font-medium text-gray-900">{item.service}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{item.bookings.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      
      {/* Monthly Revenue Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
        <div className="h-64 flex items-end space-x-2">
          {monthlyRevenue.map((month, index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
            const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  <div>{month.month}</div>
                  <div className="font-semibold">PKR {month.revenue.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Properties */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Properties</h3>
          <div className="space-y-4">
            {topProperties.map((property, index) => (
              <div key={property.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{property.name}</p>
                    <p className="text-xs text-gray-500">{property.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">PKR {property.basePrice.toLocaleString()}</p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-500">{property.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Top Vehicles */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Vehicles</h3>
          <div className="space-y-4">
            {topVehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-xs text-gray-500">{vehicle.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">PKR {vehicle.basePrice.toLocaleString()}</p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-500">{vehicle.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Top Tours */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tours</h3>
          <div className="space-y-4">
            {topTours.map((tour, index) => (
              <div key={tour.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tour.title}</p>
                    <p className="text-xs text-gray-500">{tour.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">PKR {tour.pricePerPerson.toLocaleString()}</p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-500">{tour.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Recent Bookings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.slice(0, 10).map((booking, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.customer.name}</p>
                      <p className="text-xs text-gray-500">{booking.customer.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {booking.property?.name || booking.vehicle?.brand + ' ' + booking.vehicle?.model || booking.tour?.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.property?.city || booking.vehicle?.city || booking.tour?.city}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-gray-900">PKR {booking.totalPrice?.toLocaleString() || 'N/A'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
