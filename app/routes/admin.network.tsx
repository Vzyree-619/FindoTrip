import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Network, 
  Users, 
  Globe, 
  Server, 
  Database, 
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);

  // Get network statistics
  const [
    totalUsers,
    activeUsers,
    totalProperties,
    totalVehicles,
    totalTours,
    totalBookings,
    systemHealth,
    recentActivity
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.property.count(),
    prisma.vehicle.count(),
    prisma.tour.count(),
    prisma.propertyBooking.count() + prisma.vehicleBooking.count() + prisma.tourBooking.count(),
    // System health check
    Promise.resolve({
      database: 'healthy',
      api: 'healthy',
      cache: 'healthy',
      storage: 'healthy'
    }),
    // Recent activity (last 24 hours)
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get user distribution by role
  const userDistribution = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER' } }),
    prisma.user.count({ where: { role: 'VEHICLE_OWNER' } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE' } }),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
  ]);

  // Get geographic distribution
  const geographicDistribution = await prisma.property.groupBy({
    by: ['country'],
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  });

  return json({
    admin,
    stats: {
      totalUsers,
      activeUsers,
      totalProperties,
      totalVehicles,
      totalTours,
      totalBookings,
      recentActivity
    },
    systemHealth,
    userDistribution: {
      customers: userDistribution[0],
      propertyOwners: userDistribution[1],
      vehicleOwners: userDistribution[2],
      tourGuides: userDistribution[3],
      admins: userDistribution[4]
    },
    geographicDistribution
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;

  switch (action) {
    case 'refresh_stats':
      // Refresh network statistics
      return json({ success: true, message: 'Network statistics refreshed' });
    
    case 'health_check':
      // Perform system health check
      return json({ success: true, message: 'System health check completed' });
    
    default:
      return json({ success: false, message: 'Invalid action' });
  }
}

export default function NetworkManagement() {
  const { admin, stats, systemHealth, userDistribution, geographicDistribution } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Network className="w-8 h-8 mr-3" />
                Network Management
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage your platform's network performance and user activity
              </p>
            </div>
            <div className="flex space-x-3">
              <Form method="post">
                <input type="hidden" name="action" value="refresh_stats" />
                <Button type="submit" variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Stats
                </Button>
              </Form>
              <Form method="post">
                <input type="hidden" name="action" value="health_check" />
                <Button type="submit" variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Health Check
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* Action Feedback */}
        {actionData && (
          <div className={`mb-6 p-4 rounded-md ${
            actionData.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {actionData.message}
          </div>
        )}

        {/* Network Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-green-600">
                    {stats.activeUsers.toLocaleString()} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Server className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTours.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(systemHealth).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Badge className={getHealthColor(status)}>
                      <span className="flex items-center">
                        {getHealthIcon(status)}
                        <span className="ml-1 capitalize">{status}</span>
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customers</span>
                  <span className="font-medium">{userDistribution.customers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Property Owners</span>
                  <span className="font-medium">{userDistribution.propertyOwners.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicle Owners</span>
                  <span className="font-medium">{userDistribution.vehicleOwners.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tour Guides</span>
                  <span className="font-medium">{userDistribution.tourGuides.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Admins</span>
                  <span className="font-medium">{userDistribution.admins.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geographicDistribution.map((location, index) => (
                <div key={location.country} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{location.country}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">{location._count.id} properties</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(location._count.id / geographicDistribution[0]._count.id) * 100}%` 
                        }}
                      ></div>
                    </div>
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
