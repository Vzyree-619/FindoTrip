import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { useState } from "react";
import { 
  Home, 
  Users, 
  Settings, 
  Menu,
  X,
  LogOut,
  Shield,
  CheckCircle,
  Calendar,
  MessageSquare,
  BarChart,
  FileText,
  Bell,
  Search,
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
  Flag,
  CreditCard,
  Image,
  Tag,
  Activity,
  Server,
  AlertCircle,
  ChevronDown,
  Clock,
  Briefcase,
  Plus
} from "lucide-react";
import { Button } from "~/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  return json({ admin });
}

export default function AdminLayout() {
  const { admin } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set<string>());

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin-secure',
      icon: Home,
      current: false
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
      icon: MessageSquare,
      current: false,
      children: [
        { name: 'Support Tickets', href: '/admin/support/tickets', icon: MessageSquare },
        { name: 'All Conversations', href: '/admin/support/conversations', icon: MessageSquare },
        { name: 'Escalated Issues', href: '/admin/support/escalated', icon: AlertTriangle }
      ]
    },
    {
      name: 'Reviews',
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
        { name: 'General Settings', href: '/admin/settings/general', icon: Settings },
        { name: 'Email Templates', href: '/admin/settings/emails', icon: MessageSquare },
        { name: 'Notification Settings', href: '/admin/settings/notifications', icon: Bell },
        { name: 'Security Settings', href: '/admin/settings/security', icon: Shield }
      ]
    },
    {
      name: 'Job Postings',
      icon: Briefcase,
      current: false,
      children: [
        { name: 'All Jobs', href: '/admin/jobs', icon: Briefcase },
        { name: 'Add New Job', href: '/admin/jobs/new', icon: Plus }
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

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const isCurrentPath = (href: string) => {
    return location.pathname === href;
  };

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-2 pb-4">
            <div className="flex-shrink-0 flex items-center px-4">
              <Shield className="h-8 w-8 text-[#01502E]" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
            <nav className="mt-2 px-2 space-y-1">
              {navigation.map((item) => {
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
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = isCurrentPath(child.href);
                              
                              return (
                                <a
                                  key={child.name}
                                  href={child.href}
                                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isChildActive
                                      ? 'bg-[#01502E] text-white'
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
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-screen max-h-screen bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-1 pb-2">
              <div className="flex items-center flex-shrink-0 px-4 py-3">
                <Shield className="h-8 w-8 text-[#01502E]" />
                <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
              </div>
              <nav className="mt-3 flex-1 px-2 space-y-0.5 overflow-hidden">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = item.href ? isActive(item.href) : false;
                  const isExpanded = expandedSections.has(item.name);
                  
                  if (item.children) {
                    return (
                      <div key={item.name} className="mb-1.5">
                        <button
                          onClick={() => toggleSection(item.name)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
                          <div className="ml-6 mt-1.5 space-y-1">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = isCurrentPath(child.href);
                              
                              return (
                                <a
                                  key={child.name}
                                  href={child.href}
                                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isChildActive
                                      ? 'bg-[#01502E] text-white'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
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
                      className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-[#01502E] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {admin.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{admin.name}</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-[#01502E]" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Admin</span>
            </div>
            <div className="w-6" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-4 px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
