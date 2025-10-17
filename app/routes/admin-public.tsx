import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, Users, MessageSquare, BarChart3, Settings, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  // Get basic stats without requiring admin authentication
  const stats = await prisma.user.count();
  const totalUsers = await prisma.user.count();
  const totalBookings = await prisma.propertyBooking.count() + await prisma.vehicleBooking.count() + await prisma.tourBooking.count();
  
  return json({ user, stats: { totalUsers, totalBookings } });
}

export default function AdminPublic() {
  const { user, stats } = useLoaderData<typeof loader>();

  const adminSections = [
    { 
      title: "User Management", 
      desc: "View and manage all platform users",
      icon: Users,
      color: "bg-blue-600",
      href: "/admin/users/all"
    },
    { 
      title: "Support System", 
      desc: "Handle customer support tickets",
      icon: MessageSquare,
      color: "bg-green-600",
      href: "/admin/support/tickets"
    },
    { 
      title: "Analytics Dashboard", 
      desc: "View platform metrics and trends",
      icon: BarChart3,
      color: "bg-purple-600",
      href: "/admin/analytics/platform"
    },
    { 
      title: "System Settings", 
      desc: "Configure platform settings",
      icon: Settings,
      color: "bg-orange-600",
      href: "/admin/settings/general"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Admin Panel</h1>
              <p className="text-gray-600 text-lg">
                {user ? (
                  <>Welcome, <strong className="text-[#01502E]">{user.name}</strong> ({user.role})</>
                ) : (
                  "Admin panel accessible without authentication"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <BarChart3 className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Admin Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user && user.role === 'SUPER_ADMIN' ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminSections.map(({ title, desc, icon: Icon, color, href }) => (
            <Card key={title} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`p-2 rounded-lg ${color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {title}
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

        {/* Authentication Status */}
        <div className="mt-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Logged in as: {user.name} ({user.role})</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Email: {user.email}</span>
                  </div>
                  {user.role === 'SUPER_ADMIN' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>SUPER_ADMIN privileges granted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Limited admin access</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Not logged in - Limited access</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
