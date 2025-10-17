import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Shield, Users, MessageSquare, BarChart3, Settings, 
  AlertTriangle, CheckCircle, XCircle, DollarSign, 
  TrendingUp, Calendar, Star, Eye, Lock, LogOut
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  // SECURE: This route requires SUPER_ADMIN authentication
  const user = await requireAdmin(request);
  
  // Get comprehensive admin stats with proper error handling
  try {
    const [
      totalUsers,
      propertyBookingsCount,
      vehicleBookingsCount,
      tourBookingsCount,
      totalProperties,
      totalVehicles,
      totalTours,
      recentUsers,
      recentBookings,
      pendingPropertiesCount,
      pendingVehiclesCount,
      pendingToursCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.propertyBooking.count(),
      prisma.vehicleBooking.count(),
      prisma.tourBooking.count(),
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
      }),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.vehicle.count({ where: { status: 'PENDING' } }),
      prisma.tour.count({ where: { status: 'PENDING' } })
    ]);
    
    const totalBookings = propertyBookingsCount + vehicleBookingsCount + tourBookingsCount;
    const pendingApprovals = pendingPropertiesCount + pendingVehiclesCount + pendingToursCount;
    
    return json({ 
      user, 
      stats: { 
        totalUsers, 
        totalBookings, 
        totalProperties, 
        totalVehicles, 
        totalTours,
        pendingApprovals
      },
      recentUsers,
      recentBookings
    });
  } catch (error) {
    console.error('Error loading secure admin data:', error);
    // Return minimal data on error to maintain security
    return json({ 
      user, 
      stats: { 
        totalUsers: 0, 
        totalBookings: 0, 
        totalProperties: 0, 
        totalVehicles: 0, 
        totalTours: 0,
        pendingApprovals: 0
      },
      recentUsers: [],
      recentBookings: []
    });
  }
}

export default function AdminSecure() {
  const { user, stats, recentUsers, recentBookings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const adminSections = [
    { 
      title: "User Management", 
      desc: "View and manage all platform users",
      icon: Users,
      color: "bg-blue-600",
      href: "/admin/users/all",
      count: stats.totalUsers,
      secure: true
    },
    { 
      title: "Support System", 
      desc: "Handle customer support tickets",
      icon: MessageSquare,
      color: "bg-green-600",
      href: "/admin/support/tickets",
      count: 0,
      secure: true
    },
    { 
      title: "Analytics Dashboard", 
      desc: "View platform metrics and trends",
      icon: BarChart3,
      color: "bg-purple-600",
      href: "/admin/analytics/platform",
      count: stats.totalBookings,
      secure: true
    },
    { 
      title: "System Settings", 
      desc: "Configure platform settings",
      icon: Settings,
      color: "bg-orange-600",
      href: "/admin/settings/general",
      count: 0,
      secure: true
    },
    { 
      title: "Property Management", 
      desc: "Manage property listings",
      icon: Shield,
      color: "bg-indigo-600",
      href: "/admin/properties",
      count: stats.totalProperties,
      secure: true
    },
    { 
      title: "Approval Queue", 
      desc: "Review pending approvals",
      icon: AlertTriangle,
      color: "bg-red-600",
      href: "/admin/approvals",
      count: stats.pendingApprovals,
      secure: true
    },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      fetcher.submit({}, { method: 'post', action: '/logout' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Secure Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Lock className="h-8 w-8 text-[#01502E]" />
                <h1 className="text-4xl font-bold text-gray-900">Secure Admin Panel</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Welcome, <strong className="text-[#01502E]">{user.name}</strong> ({user.role})
              </p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Authenticated & Secure</span>
              </div>
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
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Secure Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Security Status: ACTIVE</h3>
                <p className="text-sm text-green-700">
                  Full authentication required. All admin functions are secured with SUPER_ADMIN privileges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Secure Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminSections.map(({ title, desc, icon: Icon, color, href, count, secure }) => (
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
                  {secure && (
                    <Lock className="h-4 w-4 text-green-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 leading-relaxed">{desc}</p>
                <Button 
                  className={`w-full ${color} hover:opacity-90 transition-opacity text-white font-medium py-3 cursor-pointer`}
                  onClick={() => {
                    console.log('Secure navigation to:', href);
                    window.location.href = href;
                  }}
                  type="button"
                >
                  <Shield className="w-4 h-4 mr-2" />
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
