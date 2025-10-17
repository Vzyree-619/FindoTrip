import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, BarChart3, Activity, ServerCog, MessagesSquare, Megaphone, Users, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Eye, Calendar } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  
  // Get comprehensive platform statistics
  const [
    totalUsers,
    customers,
    propertyOwners,
    vehicleOwners,
    tourGuides,
    totalProperties,
    totalVehicles,
    totalTours,
    propertyBookings,
    vehicleBookings,
    tourBookings,
    pendingProperties,
    pendingVehicles,
    pendingTours,
    recentUsers,
    recentBookings,
    platformRevenue,
    activeConversations
  ] = await Promise.all([
    // User statistics
    prisma.user.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "PROPERTY_OWNER" } }),
    prisma.user.count({ where: { role: "VEHICLE_OWNER" } }),
    prisma.user.count({ where: { role: "TOUR_GUIDE" } }),
    
    // Service statistics
    prisma.property.count(),
    prisma.vehicle.count(),
    prisma.tour.count(),
    
    // Booking statistics
    prisma.propertyBooking.count(),
    prisma.vehicleBooking.count(),
    prisma.tourBooking.count(),
    
    // Approval statistics
    prisma.property.count({ where: { approvalStatus: "PENDING" } }),
    prisma.vehicle.count({ where: { approvalStatus: "PENDING" } }),
    prisma.tour.count({ where: { approvalStatus: "PENDING" } }),
    
    // Recent activity
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, role: true, createdAt: true }
    }),
    
    // Recent bookings
    prisma.propertyBooking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, bookingNumber: true, status: true, createdAt: true, totalPrice: true }
    }),
    
    // Revenue calculation
    prisma.propertyBooking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { totalPrice: true }
    }),
    
    // Active conversations
    prisma.conversation.count({ where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
  ]);

  const totalBookingsCount = propertyBookings + vehicleBookings + tourBookings;
  const pendingApprovalsCount = pendingProperties + pendingVehicles + pendingTours;
  const totalRevenue = platformRevenue._sum.totalPrice || 0;

  return json({ 
    user,
    stats: {
      totalUsers,
      customers,
      propertyOwners,
      vehicleOwners,
      tourGuides,
      totalProperties,
      totalVehicles,
      totalTours,
      totalBookings: totalBookingsCount,
      pendingApprovals: pendingApprovalsCount,
      totalRevenue,
      activeConversations
    },
    recentUsers,
    recentBookings
  });
}

export default function AdminDashboard() {
  const { user, stats, recentUsers, recentBookings } = useLoaderData<typeof loader>();

  const sections = [
    { href: "/admin/users/all", icon: Users, title: "User Management", desc: "Manage all platform users" },
    { href: "/admin/approvals/providers", icon: Shield, title: "Content Moderation", desc: "Review and approve content", count: stats.pendingApprovals },
    { href: "/admin/analytics/platform", icon: BarChart3, title: "Analytics", desc: "Platform metrics and trends" },
    { href: "/admin/support/tickets", icon: Users, title: "Support Center", desc: "Tickets and provider support" },
    { href: "/admin/bookings/all", icon: Calendar, title: "Booking Management", desc: "Manage all platform bookings" },
    { href: "/admin/financial/revenue", icon: DollarSign, title: "Financial Overview", desc: "Revenue and commission tracking" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name?.split(" ")[0] || "Admin"}. Manage the platform using the essential tools below.</p>
          <div className="mt-4 space-x-4">
            <Link 
              to="/admin" 
              className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#013d23] transition-colors"
            >
              <Shield className="w-4 h-4 mr-2" />
              Access Full Admin Panel
            </Link>
            <Link 
              to="/admin-access" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Admin Access Center
            </Link>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
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
                  <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#01502E]" />
                User Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customers</span>
                  <span className="font-semibold">{stats.customers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Property Owners</span>
                  <span className="font-semibold">{stats.propertyOwners}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vehicle Owners</span>
                  <span className="font-semibold">{stats.vehicleOwners}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tour Guides</span>
                  <span className="font-semibold">{stats.tourGuides}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#01502E]" />
                Service Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Properties</span>
                  <span className="font-semibold">{stats.totalProperties}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vehicles</span>
                  <span className="font-semibold">{stats.totalVehicles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tours</span>
                  <span className="font-semibold">{stats.totalTours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Conversations</span>
                  <span className="font-semibold">{stats.activeConversations}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#01502E]" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#01502E]" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{booking.bookingNumber}</p>
                      <p className="text-xs text-gray-500">{booking.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">PKR {booking.totalPrice.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(({ href, icon: Icon, title, desc, count }) => (
              <Card key={href} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-[#01502E]" />
                    {title}
                    {count !== undefined && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        {count}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{desc}</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={href}>Open {title}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
