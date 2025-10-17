import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Star, MapPin, Car, Users as TourIcon } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);

  // Get comprehensive analytics data
  const [
    // User analytics
    totalUsers,
    newUsersThisMonth,
    activeUsers,
    
    // Revenue analytics
    totalRevenue,
    monthlyRevenue,
    averageBookingValue,
    
    // Booking analytics
    totalBookings,
    monthlyBookings,
    bookingTrends,
    
    // Service analytics
    totalProperties,
    totalVehicles,
    totalTours,
    averageRating,
    
    // Recent activity
    recentBookings,
    topProperties,
    topVehicles,
    topTours
  ] = await Promise.all([
    // User counts
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Revenue calculations
    prisma.propertyBooking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { totalPrice: true }
    }),
    prisma.propertyBooking.aggregate({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { totalPrice: true }
    }),
    prisma.propertyBooking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _avg: { totalPrice: true }
    }),
    
    // Booking counts
    prisma.propertyBooking.count({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } }
    }),
    prisma.propertyBooking.count({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    
    // Booking trends (last 6 months)
    prisma.propertyBooking.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      _count: { id: true }
    }),
    
    // Service counts
    prisma.property.count(),
    prisma.vehicle.count(),
    prisma.tour.count(),
    
    // Average rating
    prisma.review.aggregate({
      _avg: { rating: true }
    }),
    
    // Recent bookings
    prisma.propertyBooking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { name: true } },
        user: { select: { name: true } }
      }
    }),
    
    // Top properties by bookings
    prisma.property.findMany({
      take: 5,
      orderBy: { totalBookings: "desc" },
      select: {
        name: true,
        city: true,
        basePrice: true,
        currency: true,
        totalBookings: true
      }
    }),
    
    // Top vehicles by bookings
    prisma.vehicle.findMany({
      take: 5,
      orderBy: { totalBookings: "desc" },
      select: {
        name: true,
        brand: true,
        model: true,
        basePrice: true,
        currency: true,
        totalBookings: true
      }
    }),
    
    // Top tours by bookings
    prisma.tour.findMany({
      take: 5,
      orderBy: { totalBookings: "desc" },
      select: {
        title: true,
        city: true,
        pricePerPerson: true,
        currency: true,
        totalBookings: true
      }
    })
  ]);

  const totalRevenueAmount = totalRevenue._sum.totalPrice || 0;
  const monthlyRevenueAmount = monthlyRevenue._sum.totalPrice || 0;
  const averageBooking = averageBookingValue._avg.totalPrice || 0;

  return json({
    user,
    analytics: {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        active: activeUsers
      },
      revenue: {
        total: totalRevenueAmount,
        monthly: monthlyRevenueAmount,
        averageBooking: averageBooking
      },
      bookings: {
        total: totalBookings,
        monthly: monthlyBookings,
        trends: bookingTrends
      },
      services: {
        properties: totalProperties,
        vehicles: totalVehicles,
        tours: totalTours,
        averageRating: averageRating._avg.rating || 0
      },
      recent: {
        bookings: recentBookings,
        topProperties,
        topVehicles,
        topTours
      }
    }
  });
}

export default function AdminAnalytics() {
  const { user, analytics } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into platform performance and user engagement.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.users.total}</p>
                  <p className="text-xs text-green-600">+{analytics.users.newThisMonth} this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {analytics.revenue.total.toLocaleString()}</p>
                  <p className="text-xs text-green-600">PKR {analytics.revenue.monthly.toLocaleString()} this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.bookings.total}</p>
                  <p className="text-xs text-green-600">+{analytics.bookings.monthly} this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.services.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">out of 5.0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#01502E]" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{analytics.services.properties}</p>
                <p className="text-sm text-gray-600">Total Properties</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-[#01502E]" />
                Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{analytics.services.vehicles}</p>
                <p className="text-sm text-gray-600">Total Vehicles</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TourIcon className="h-5 w-5 text-[#01502E]" />
                Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{analytics.services.tours}</p>
                <p className="text-sm text-gray-600">Total Tours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#01502E]" />
                Top Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recent.topProperties.map((property, index) => (
                  <div key={property.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{property.name}</p>
                      <p className="text-xs text-gray-500">{property.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{property.totalBookings} bookings</p>
                      <p className="text-xs text-gray-500">{property.currency} {property.basePrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-[#01502E]" />
                Top Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recent.topVehicles.map((vehicle, index) => (
                  <div key={vehicle.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{vehicle.name}</p>
                      <p className="text-xs text-gray-500">{vehicle.brand} {vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{vehicle.totalBookings} bookings</p>
                      <p className="text-xs text-gray-500">{vehicle.currency} {vehicle.basePrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TourIcon className="h-5 w-5 text-[#01502E]" />
                Top Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recent.topTours.map((tour, index) => (
                  <div key={tour.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{tour.title}</p>
                      <p className="text-xs text-gray-500">{tour.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{tour.totalBookings} bookings</p>
                      <p className="text-xs text-gray-500">{tour.currency} {tour.pricePerPerson}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#01502E]" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recent.bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{booking.property.name}</p>
                    <p className="text-xs text-gray-500">Booked by {booking.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{booking.currency} {booking.totalPrice.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
