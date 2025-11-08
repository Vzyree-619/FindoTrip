import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2,
  Car,
  MapPin,
  Star,
  Eye,
  Flag,
  CreditCard,
  BarChart3,
  Server,
  Database,
  Mail,
  Bell,
  Shield,
  FileText,
  Settings,
  X,
  Plus
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get comprehensive platform statistics
  const [
    // User statistics
    totalUsers,
    customers,
    propertyOwners,
    vehicleOwners,
    tourGuides,
    admins,
    
    // Service statistics
    totalProperties,
    totalVehicles,
    totalTours,
    activeProperties,
    activeVehicles,
    activeTours,
    
    // Booking statistics
    totalBookings,
    propertyBookings,
    vehicleBookings,
    tourBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    
    // Revenue statistics
    totalRevenue,
    monthlyRevenue,
    platformCommission,
    
    // Approval statistics
    pendingProviderApprovals,
    pendingPropertyApprovals,
    pendingVehicleApprovals,
    pendingTourApprovals,
    
    // Support statistics
    activeSupportTickets,
    escalatedTickets,
    resolvedTickets,
    
    // Review statistics
    totalReviews,
    flaggedReviews,
    averageRating,
    
    // Recent data
    recentUsers,
    recentBookings,
    recentActivity,
    recentSupportTickets,
    
    // Platform health
    systemHealth,
    errorCount,
    databaseStatus
  ] = await Promise.all([
    // User counts by role
    prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER' } }),
    prisma.user.count({ where: { role: 'VEHICLE_OWNER' } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE' } }),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    
    // Service counts
    prisma.property.count(),
    prisma.vehicle.count(),
    prisma.tour.count(),
    prisma.property.count({ where: { available: true } }),
    prisma.vehicle.count({ where: { available: true } }),
    prisma.tour.count({ where: { available: true } }),
    
    // Booking counts
    Promise.all([
      prisma.propertyBooking.count(),
      prisma.vehicleBooking.count(),
      prisma.tourBooking.count()
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    prisma.propertyBooking.count(),
    prisma.vehicleBooking.count(),
    prisma.tourBooking.count(),
    Promise.all([
      prisma.propertyBooking.count({ where: { status: 'CONFIRMED' } }),
      prisma.vehicleBooking.count({ where: { status: 'CONFIRMED' } }),
      prisma.tourBooking.count({ where: { status: 'CONFIRMED' } })
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    Promise.all([
      prisma.propertyBooking.count({ where: { status: 'PENDING' } }),
      prisma.vehicleBooking.count({ where: { status: 'PENDING' } }),
      prisma.tourBooking.count({ where: { status: 'PENDING' } })
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    Promise.all([
      prisma.propertyBooking.count({ where: { status: 'CANCELLED' } }),
      prisma.vehicleBooking.count({ where: { status: 'CANCELLED' } }),
      prisma.tourBooking.count({ where: { status: 'CANCELLED' } })
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    
    // Revenue calculations
    Promise.all([
      prisma.propertyBooking.aggregate({ _sum: { totalPrice: true } }),
      prisma.vehicleBooking.aggregate({ _sum: { totalPrice: true } }),
      prisma.tourBooking.aggregate({ _sum: { totalPrice: true } })
    ]).then(results => {
      const total = results.reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0);
      return total;
    }),
    Promise.all([
      prisma.propertyBooking.aggregate({ 
        _sum: { totalPrice: true },
        where: { 
          createdAt: { 
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      }),
      prisma.vehicleBooking.aggregate({ 
        _sum: { totalPrice: true },
        where: { 
          createdAt: { 
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      }),
      prisma.tourBooking.aggregate({ 
        _sum: { totalPrice: true },
        where: { 
          createdAt: { 
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      })
    ]).then(results => {
      const total = results.reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0);
      return total;
    }),
    // Platform commission (assuming 10% commission)
    Promise.all([
      prisma.propertyBooking.aggregate({ _sum: { totalPrice: true } }),
      prisma.vehicleBooking.aggregate({ _sum: { totalPrice: true } }),
      prisma.tourBooking.aggregate({ _sum: { totalPrice: true } })
    ]).then(results => {
      const total = results.reduce((sum, result) => sum + (result._sum.totalPrice || 0), 0);
      return total * 0.1; // 10% commission
    }),
    
    // Pending approvals
    prisma.user.count({ 
      where: { 
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
        verified: false 
      } 
    }),
    prisma.property.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.tour.count({ where: { approvalStatus: 'PENDING' } }),
    
    // Support tickets
    prisma.supportTicket.count({ where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }),
    prisma.supportTicket.count({ where: { escalated: true } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    
    // Reviews
    prisma.review.count(),
    prisma.review.count({ where: { flagged: true } }),
    prisma.review.aggregate({ _avg: { rating: true } }).then(result => result._avg.rating || 0),
    
    // Recent data
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    }),
    Promise.all([
      prisma.propertyBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { name: true } }, user: { select: { name: true } } }
      }),
      prisma.vehicleBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { name: true } }, user: { select: { name: true } } }
      }),
      prisma.tourBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { tour: { select: { title: true } }, user: { select: { name: true } } }
      })
    ]).then(results => results.flat()),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.supportTicket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }),
    
    // System health (mock data for now)
    Promise.resolve({ status: 'healthy', uptime: '99.9%' }),
    Promise.resolve(0), // error count
    Promise.resolve({ status: 'connected', responseTime: '12ms' })
  ]);
  
  // Calculate totals
  const totalPendingApprovals = pendingProviderApprovals + pendingPropertyApprovals + pendingVehicleApprovals + pendingTourApprovals;
  const totalActiveListings = activeProperties + activeVehicles + activeTours;
  
  // Log dashboard access
  await logAdminAction(admin.id, 'DASHBOARD_ACCESS', 'Viewed comprehensive admin dashboard', request);
  
  return json({
    admin,
    stats: {
      // User statistics
      totalUsers,
      customers,
      propertyOwners,
      vehicleOwners,
      tourGuides,
      admins,
      
      // Service statistics
      totalProperties,
      totalVehicles,
      totalTours,
      totalActiveListings,
      activeProperties,
      activeVehicles,
      activeTours,
      
      // Booking statistics
      totalBookings,
      propertyBookings,
      vehicleBookings,
      tourBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      
      // Revenue statistics
      totalRevenue,
      monthlyRevenue,
      platformCommission,
      
      // Approval statistics
      totalPendingApprovals,
      pendingProviderApprovals,
      pendingPropertyApprovals,
      pendingVehicleApprovals,
      pendingTourApprovals,
      
      // Support statistics
      activeSupportTickets,
      escalatedTickets,
      resolvedTickets,
      
      // Review statistics
      totalReviews,
      flaggedReviews,
      averageRating,
      
      // System health
      systemHealth,
      errorCount,
      databaseStatus
    },
    recentUsers,
    recentBookings,
    recentActivity,
    recentSupportTickets
  });
}

export default function AdminDashboard() {
  const { admin, stats, recentUsers, recentBookings, recentActivity, recentSupportTickets } = useLoaderData<typeof loader>();
  
  const statCards = [
    {
      title: 'Pending Approvals',
      value: (stats.totalPendingApprovals || 0).toLocaleString(),
      icon: CheckCircle,
      color: 'orange',
      change: '+3 today',
      changeType: 'neutral' as const,
      href: '/admin/approvals/providers'
    },
    {
      title: 'Total Bookings',
      value: (stats.totalBookings || 0).toLocaleString(),
      icon: Calendar,
      color: 'blue',
      change: '+12 today',
      changeType: 'positive' as const,
      href: '/admin/bookings/all'
    },
    {
      title: 'Revenue This Month',
      value: `PKR ${(stats.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      change: '+$2,340',
      changeType: 'positive' as const,
      href: '/admin/financial/revenue'
    },
    {
      title: 'Active Listings',
      value: (stats.totalActiveListings || 0).toLocaleString(),
      icon: Building2,
      color: 'purple',
      change: '+8 today',
      changeType: 'positive' as const,
      href: '/admin/services/properties'
    }
  ];
  
  const pendingActions = [
    {
      title: `${stats.pendingProviderApprovals} Provider Registrations Pending`,
      href: '/admin/approvals/providers',
      icon: UserCheck,
      color: 'blue'
    },
    {
      title: `${stats.pendingPropertyApprovals + stats.pendingVehicleApprovals + stats.pendingTourApprovals} Service Listings Awaiting Approval`,
      href: '/admin/approvals/services',
      icon: Building2,
      color: 'green'
    },
    {
      title: `${stats.activeSupportTickets} Support Tickets Unassigned`,
      href: '/admin/support/tickets',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      title: `${stats.flaggedReviews} Reviews Flagged for Moderation`,
      href: '/admin/reviews/flagged',
      icon: Flag,
      color: 'red'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {admin.name || admin.email}!</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch('/api/seed-stays', { method: 'POST', headers: { 'x-seed-token': 'dev' } });
                const j = await res.json();
                alert(res.ok ? `Seeded: ${j.created} properties, ${j.roomTypesCreated} room types` : `Seed failed: ${j.error || res.status}`);
                location.reload();
              } catch {}
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Seed Demo Stays
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            orange: 'bg-orange-50 text-orange-600',
            red: 'bg-red-50 text-red-600'
          };
          
          return (
            <Link key={stat.title} to={stat.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {/* Pending Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h2>
        <div className="space-y-3">
          {pendingActions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              red: 'bg-red-100 text-red-600'
            };
            
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colorClasses[action.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{action.title}</span>
                </div>
                <Link to={action.href}>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.slice(0, 8).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.details}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user?.name || activity.user?.email}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/admin/analytics/activity" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All Activity →
            </Link>
          </div>
        </Card>
        
        {/* Platform Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Users by Role:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customers:</span>
                  <span className="text-sm font-medium">{(stats.customers || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Property Owners:</span>
                  <span className="text-sm font-medium">{(stats.propertyOwners || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicle Owners:</span>
                  <span className="text-sm font-medium">{(stats.vehicleOwners || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tour Guides:</span>
                  <span className="text-sm font-medium">{(stats.tourGuides || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bookings by Type:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Properties:</span>
                  <span className="text-sm font-medium">{(stats.propertyBookings || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicles:</span>
                  <span className="text-sm font-medium">{(stats.vehicleBookings || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tours:</span>
                  <span className="text-sm font-medium">{(stats.tourBookings || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Link to="/admin/analytics/platform" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Detailed Stats →
              </Link>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Revenue Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Chart (Last 30 Days)</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Revenue chart will be displayed here</p>
            <p className="text-sm text-gray-400">Integration with charting library needed</p>
          </div>
        </div>
      </Card>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Services */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Services</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Luxury Villa (#123)</p>
                <p className="text-sm text-gray-600">45 bookings</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Sports Car (#456)</p>
                <p className="text-sm text-gray-600">38 rentals</p>
              </div>
              <Car className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">City Tour (#789)</p>
                <p className="text-sm text-gray-600">32 bookings</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/admin/analytics/services" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All →
            </Link>
          </div>
        </Card>
        
        {/* Recent Registrations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {recentUsers.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-sm text-gray-600">{user.role.replace('_', ' ')}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/admin/users/all" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
