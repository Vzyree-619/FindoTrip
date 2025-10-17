import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Shield, Users, MessageSquare, BarChart3, Settings, 
  AlertTriangle, CheckCircle, XCircle, DollarSign, 
  TrendingUp, Calendar, Star, Eye 
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  // Get comprehensive stats without requiring admin authentication
  try {
    const [
      totalUsers,
      totalBookings,
      totalProperties,
      totalVehicles,
      totalTours,
      recentUsers,
      recentBookings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.propertyBooking.count() + prisma.vehicleBooking.count() + prisma.tourBooking.count(),
      prisma.property.count(),
      prisma.vehicle.count(),
      prisma.tour.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      prisma.propertyBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, totalPrice: true, createdAt: true }
      })
    ]);
    
    return json({ 
      user, 
      stats: { 
        totalUsers, 
        totalBookings, 
        totalProperties, 
        totalVehicles, 
        totalTours 
      },
      recentUsers,
      recentBookings
    });
  } catch (error) {
    console.error('Error loading admin data:', error);
    return json({ 
      user, 
      stats: { 
        totalUsers: 0, 
        totalBookings: 0, 
        totalProperties: 0, 
        totalVehicles: 0, 
        totalTours: 0 
      },
      recentUsers: [],
      recentBookings: []
    });
  }
}

export default function AdminSimple() {
  const { user, stats, recentUsers, recentBookings } = useLoaderData<typeof loader>();

  const adminSections = [
    { 
      title: "User Management", 
      desc: "View and manage all platform users",
      icon: Users,
      color: "bg-blue-600",
      href: "/admin/users/all",
      count: stats.totalUsers
    },
    { 
      title: "Support System", 
      desc: "Handle customer support tickets",
      icon: MessageSquare,
      color: "bg-green-600",
      href: "/admin/support/tickets",
      count: 0
    },
    { 
      title: "Analytics Dashboard", 
      desc: "View platform metrics and trends",
      icon: BarChart3,
      color: "bg-purple-600",
      href: "/admin/analytics/platform",
      count: stats.totalBookings
    },
    { 
      title: "System Settings", 
      desc: "Configure platform settings",
      icon: Settings,
      color: "bg-orange-600",
      href: "/admin/settings/general",
      count: 0
    },
    { 
      title: "Property Management", 
      desc: "Manage property listings",
      icon: Shield,
      color: "bg-indigo-600",
      href: "/admin/properties",
      count: stats.totalProperties
    },
    { 
      title: "Vehicle Management", 
      desc: "Manage vehicle listings",
      icon: Shield,
      color: "bg-cyan-600",
      href: "/admin/vehicles",
      count: stats.totalVehicles
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Simple Admin Dashboard</h1>
              <p className="text-gray-600 text-lg">
                {user ? (
                  <>Welcome, <strong className="text-[#01502E]">{user.name}</strong> ({user.role})</>
                ) : (
                  "Admin dashboard without authentication requirements"
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2"
              >
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/login'}
                className="flex items-center space-x-2 bg-[#01502E] text-white hover:bg-[#013d23]"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Login</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Star className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTours}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminSections.map(({ title, desc, icon: Icon, color, href, count }) => (
            <Card key={title} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`p-2 rounded-lg ${color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {title}
                  {count > 0 && (
                    <span className="ml-auto bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                      {count}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 leading-relaxed">{desc}</p>
                <Button 
                  className={`w-full ${color} hover:opacity-90 transition-opacity text-white font-medium py-3 cursor-pointer`}
                  onClick={() => {
                    console.log('Navigating to:', href);
                    // Try to open in new tab to avoid redirect issues
                    window.open(href, '_blank');
                  }}
                  type="button"
                >
                  Access {title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.role}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Booking #{booking.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">Status: {booking.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">PKR {booking.totalPrice}</p>
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
    </div>
  );
}
