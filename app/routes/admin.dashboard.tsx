import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireAdmin, getAdminStats, logAdminAction } from "~/lib/admin.server";
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
  MapPin
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const stats = await getAdminStats();
  
  // Log dashboard access
  await logAdminAction(admin.id, 'DASHBOARD_ACCESS', 'Viewed admin dashboard', request);
  
  return json({ admin, stats });
}

export default function AdminDashboard() {
  const { admin, stats } = useLoaderData<typeof loader>();
  
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Providers',
      value: stats.totalProviders.toLocaleString(),
      icon: Building,
      color: 'green',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      icon: Calendar,
      color: 'purple',
      change: '+23%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Revenue',
      value: `PKR ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'yellow',
      change: '+15%',
      changeType: 'positive' as const
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals.toLocaleString(),
      icon: CheckCircle,
      color: 'orange',
      change: '-5%',
      changeType: 'negative' as const
    },
    {
      title: 'Active Support',
      value: stats.activeSupportTickets.toLocaleString(),
      icon: MessageSquare,
      color: 'red',
      change: '+3%',
      changeType: 'negative' as const
    }
  ];
  
  const quickActions = [
    {
      title: 'Review Provider Applications',
      description: 'Approve or reject new provider registrations',
      href: '/admin/approvals/providers',
      icon: UserCheck,
      color: 'blue'
    },
    {
      title: 'Moderate Service Listings',
      description: 'Review and approve property, vehicle, and tour listings',
      href: '/admin/approvals/services',
      icon: Building2,
      color: 'green'
    },
    {
      title: 'Handle Support Tickets',
      description: 'Respond to user and provider support requests',
      href: '/admin/support',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      title: 'View Financial Reports',
      description: 'Analyze revenue, commissions, and financial data',
      href: '/admin/reports/financial',
      icon: TrendingUp,
      color: 'yellow'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {admin.email}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
              green: 'bg-green-50 text-green-600 hover:bg-green-100',
              purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
              yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
            };
            
            return (
              <Card key={action.title} className="p-4 hover:shadow-md transition-shadow">
                <a href={action.href} className="block">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses[action.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </a>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.details}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user?.email}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <a 
              href="/admin/audit" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all activity →
            </a>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Healthy</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">API Services</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Payment Gateway</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Monitoring</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Email Service</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last updated</span>
              <span className="text-sm text-gray-900">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Alerts */}
      {stats.pendingApprovals > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                {stats.pendingApprovals} items require your attention
              </p>
              <p className="text-sm text-orange-700">
                Review pending approvals to keep the platform running smoothly
              </p>
            </div>
            <Button size="sm" className="ml-auto">
              Review Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
