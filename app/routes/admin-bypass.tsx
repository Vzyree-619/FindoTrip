import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, CheckCircle, XCircle, AlertTriangle, Users, DollarSign, Star } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get user without requiring admin authentication
  const user = await getUser(request);
  
  // Get basic stats
  let stats = {
    totalUsers: 0,
    totalBookings: 0,
    totalProperties: 0,
    totalVehicles: 0,
    totalTours: 0
  };
  
  try {
    const [totalUsers, totalBookings, totalProperties, totalVehicles, totalTours] = await Promise.all([
      prisma.user.count(),
      prisma.propertyBooking.count() + prisma.vehicleBooking.count() + prisma.tourBooking.count(),
      prisma.property.count(),
      prisma.vehicle.count(),
      prisma.tour.count()
    ]);
    
    stats = { totalUsers, totalBookings, totalProperties, totalVehicles, totalTours };
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  
  return json({ user, stats });
}

export default function AdminBypass() {
  const { user, stats } = useLoaderData<typeof loader>();

  const isAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Bypass Test</h1>
              <p className="text-gray-600 text-lg">
                {user ? (
                  <>Welcome, <strong className="text-[#01502E]">{user.name}</strong> ({user.role})</>
                ) : (
                  "Not logged in"
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isAdmin ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {isAdmin ? 'SUPER_ADMIN Access Granted' : 'Not SUPER_ADMIN'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2"
              >
                <span>Refresh</span>
              </Button>
              {!user && (
                <Button
                  onClick={() => window.location.href = '/admin/login'}
                  className="flex items-center space-x-2 bg-[#01502E] text-white hover:bg-[#013d23]"
                >
                  <Shield className="w-4 h-4" />
                  <span>Login</span>
                </Button>
              )}
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
                <DollarSign className="h-6 w-6 text-green-600" />
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

        {/* Admin Access */}
        {isAdmin ? (
          <Card className="p-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Admin Access Granted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">
                You have SUPER_ADMIN privileges and can access all admin features.
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={() => window.location.href = '/admin-secure'}
                  className="bg-[#01502E] text-white hover:bg-[#013d23]"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Access Secure Admin
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin/users/all'}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                You need SUPER_ADMIN privileges to access admin features.
              </p>
              <Button
                onClick={() => window.location.href = '/admin/login'}
                className="bg-[#01502E] text-white hover:bg-[#013d23]"
              >
                <Shield className="w-4 h-4 mr-2" />
                Login as Admin
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
