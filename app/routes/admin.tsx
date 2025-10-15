import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation, Form } from "@remix-run/react";
import { requireAdmin, getAdminNavigation, type AdminUser } from "~/lib/admin.server";
import { useState } from "react";
import { 
  Home, 
  Users, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  BarChart, 
  Settings, 
  FileText,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Shield,
  Building,
  Car,
  MapPin,
  Star,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
  Database,
  Wrench,
  UserCheck,
  Building2,
  MessageSquare as SupportIcon,
  Flag,
  CreditCard,
  Image,
  Tag,
  Activity,
  Server,
  AlertCircle,
  ChevronDown,
  Clock
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get comprehensive navigation with all admin features
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: Home,
      current: false
    },
    {
      name: 'Approvals',
      icon: CheckCircle,
      current: false,
      children: [
        { name: 'Pending Providers', href: '/admin/approvals/providers', icon: UserCheck },
        { name: 'Pending Services', href: '/admin/approvals/services', icon: Building2 },
        { name: 'Approved Items', href: '/admin/approvals/approved', icon: CheckCircle },
        { name: 'Rejected Items', href: '/admin/approvals/rejected', icon: X }
      ]
    },
    {
      name: 'User Management',
      icon: Users,
      current: false,
      children: [
        { name: 'All Users', href: '/admin/users/all', icon: Users },
        { name: 'Property Owners', href: '/admin/users/property-owners', icon: Building },
        { name: 'Vehicle Owners', href: '/admin/users/vehicle-owners', icon: Car },
        { name: 'Tour Guides', href: '/admin/users/tour-guides', icon: MapPin },
        { name: 'Customers', href: '/admin/users/customers', icon: UserCheck },
        { name: 'Admins', href: '/admin/users/admins', icon: Shield }
      ]
    },
    {
      name: 'Service Management',
      icon: Building2,
      current: false,
      children: [
        { name: 'Properties', href: '/admin/services/properties', icon: Building },
        { name: 'Vehicles', href: '/admin/services/vehicles', icon: Car },
        { name: 'Tours', href: '/admin/services/tours', icon: MapPin }
      ]
    },
    {
      name: 'Bookings',
      icon: Calendar,
      current: false,
      children: [
        { name: 'All Bookings', href: '/admin/bookings/all', icon: Calendar },
        { name: 'Confirmed', href: '/admin/bookings/confirmed', icon: CheckCircle },
        { name: 'Pending', href: '/admin/bookings/pending', icon: Clock },
        { name: 'Cancelled', href: '/admin/bookings/cancelled', icon: X },
        { name: 'Completed', href: '/admin/bookings/completed', icon: CheckCircle }
      ]
    },
    {
      name: 'Support',
      icon: SupportIcon,
      current: false,
      children: [
        { name: 'Support Tickets', href: '/admin/support/tickets', icon: MessageSquare },
        { name: 'All Conversations', href: '/admin/support/conversations', icon: MessageSquare },
        { name: 'Escalated Issues', href: '/admin/support/escalated', icon: AlertTriangle }
      ]
    },
    {
      name: 'Reviews & Ratings',
      icon: Star,
      current: false,
      children: [
        { name: 'All Reviews', href: '/admin/reviews/all', icon: Star },
        { name: 'Flagged Reviews', href: '/admin/reviews/flagged', icon: Flag },
        { name: 'Review Moderation', href: '/admin/reviews/moderation', icon: Eye }
      ]
    },
    {
      name: 'Financial',
      icon: DollarSign,
      current: false,
      children: [
        { name: 'Revenue Overview', href: '/admin/financial/revenue', icon: TrendingUp },
        { name: 'Commission Tracking', href: '/admin/financial/commissions', icon: CreditCard },
        { name: 'Payouts', href: '/admin/financial/payouts', icon: DollarSign },
        { name: 'Financial Reports', href: '/admin/financial/reports', icon: BarChart }
      ]
    },
    {
      name: 'Content',
      icon: FileText,
      current: false,
      children: [
        { name: 'Content Moderation', href: '/admin/content/moderation', icon: Eye },
        { name: 'Media Management', href: '/admin/content/media', icon: Image },
        { name: 'Categories & Tags', href: '/admin/content/categories', icon: Tag }
      ]
    },
    {
      name: 'Settings',
      icon: Settings,
      current: false,
      children: [
        { name: 'Platform Settings', href: '/admin/settings/platform', icon: Settings },
        { name: 'Email Templates', href: '/admin/settings/email', icon: MessageSquare },
        { name: 'Notification Settings', href: '/admin/settings/notifications', icon: Bell },
        { name: 'Security Settings', href: '/admin/settings/security', icon: Shield }
      ]
    },
    {
      name: 'Analytics',
      icon: BarChart,
      current: false,
      children: [
        { name: 'Platform Statistics', href: '/admin/analytics/platform', icon: BarChart },
        { name: 'Growth Metrics', href: '/admin/analytics/growth', icon: TrendingUp },
        { name: 'Activity Logs', href: '/admin/analytics/activity', icon: Activity },
        { name: 'Audit Logs', href: '/admin/analytics/audit', icon: FileText }
      ]
    },
    {
      name: 'System',
      icon: Server,
      current: false,
      children: [
        { name: 'System Health', href: '/admin/system/health', icon: Server },
        { name: 'Error Logs', href: '/admin/system/errors', icon: AlertCircle },
        { name: 'Database Status', href: '/admin/system/database', icon: Database }
      ]
    }
  ];
  
  return json({ admin, navigation });
}

export default function AdminLayout() {
  const { admin, navigation } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Dashboard']));
  
  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };
  
  const isCurrentPath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };
  
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(href);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item: any) => {
              const Icon = item.icon;
              const active = item.href ? isActive(item.href) : false;
              const isExpanded = expandedSections.has(item.name);
              
              if (item.children) {
                return (
                  <div key={item.name} className="mb-2">
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.children.map((child: any) => {
                          const ChildIcon = child.icon;
                          const isChildActive = isCurrentPath(child.href);
                          
                          return (
                            <a
                              key={child.name}
                              href={child.href}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                isChildActive
                                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <ChildIcon className="w-4 h-4 mr-3" />
                              {child.name}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {admin.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {admin.email}
                </p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            
            <form action="/logout" method="post">
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden lg:block">
                <h2 className="text-xl font-semibold text-gray-900">
                  {navigation.find((item: any) => item.href && isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Admin info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Super Admin</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
