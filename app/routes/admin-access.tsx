import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, Users, MessageSquare, BarChart3, Settings, AlertTriangle, LogOut, RefreshCw } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function AdminAccess() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const adminRoutes = [
    { href: "/admin", icon: Shield, title: "Main Admin Dashboard", desc: "Complete admin panel with all features", color: "bg-[#01502E]" },
    { href: "/admin/users/all", icon: Users, title: "User Management", desc: "Manage all platform users", color: "bg-blue-600" },
    { href: "/admin/support/tickets", icon: MessageSquare, title: "Support Tickets", desc: "Handle customer support", color: "bg-green-600" },
    { href: "/admin/analytics/platform", icon: BarChart3, title: "Analytics", desc: "Platform metrics and trends", color: "bg-purple-600" },
    { href: "/admin/settings/general", icon: Settings, title: "Settings", desc: "Platform configuration", color: "bg-orange-600" },
  ];

  // Secure admin routes that require proper authentication
  const secureRoutes = [
    { href: "/admin-secure", icon: Shield, title: "Secure Admin Panel", desc: "Fully secured admin dashboard with authentication", color: "bg-[#01502E]" },
    { href: "/dashboard/admin", icon: Shield, title: "Dashboard Admin", desc: "Alternative admin dashboard", color: "bg-blue-600" },
    { href: "/admin-test", icon: Users, title: "Admin Test", desc: "Test admin authentication", color: "bg-green-600" },
    { href: "/admin-debug", icon: AlertTriangle, title: "Admin Debug", desc: "Debug authentication and session issues", color: "bg-red-600" },
    { href: "/session-test", icon: Shield, title: "Session Test", desc: "Test session and authentication status", color: "bg-yellow-600" },
    { href: "/admin-bypass", icon: Shield, title: "Admin Bypass", desc: "Test admin access without middleware", color: "bg-indigo-600" },
  ];

  const handleNavigation = (href: string) => {
    console.log('Button clicked, navigating to:', href);
    // Use window.location for direct navigation
    window.location.href = href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Access Center</h1>
              <p className="text-gray-600 text-lg">
                {user ? (
                  <>Welcome back, <strong className="text-[#01502E]">{user.name}</strong> ({user.role})</>
                ) : (
                  "Please log in to access admin features."
                )}
              </p>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('Refresh button clicked');
                    window.location.reload();
                  }}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('Logout button clicked');
                    navigate('/logout');
                  }}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('Test button clicked');
                    alert('Test button works!');
                  }}
                  className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <span>Test Click</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('Direct admin login');
                    window.location.href = '/admin/login';
                  }}
                  className="flex items-center space-x-2 bg-[#01502E] text-white hover:bg-[#013d23]"
                >
                  <Shield className="w-4 h-4" />
                  <span>Direct Admin Login</span>
                </Button>
              </div>
            )}
          </div>
          
          {!user && (
            <div className="mt-6">
              <Link 
                to="/admin/login" 
                className="inline-flex items-center px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors shadow-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Login as Admin
              </Link>
            </div>
          )}
        </div>

        {user && user.role === 'SUPER_ADMIN' ? (
          <div className="space-y-8">
            {/* Main Admin Routes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Main Admin Panel</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminRoutes.map(({ href, icon: Icon, title, desc, color }) => (
                  <Card key={href} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg" style={{ pointerEvents: 'auto' }}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Button clicked:', title, href);
                          handleNavigation(href);
                        }}
                        type="button"
                      >
                        Access {title}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Secure Admin Routes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Secure Admin Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secureRoutes.map(({ href, icon: Icon, title, desc, color }) => (
                  <Card key={href} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg" style={{ pointerEvents: 'auto' }}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Alternative button clicked:', title, href);
                          handleNavigation(href);
                        }}
                        type="button"
                      >
                        Access {title}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center shadow-xl border-0">
            <div className="max-w-md mx-auto">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You need SUPER_ADMIN privileges to access the admin panel.
              </p>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Available admin accounts:</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• admin@example.com</p>
                  <p>• data@findotrip.com</p>
                  <p className="font-medium">Password: password123</p>
                </div>
              </div>
              <Button asChild className="bg-[#01502E] hover:bg-[#013d23] px-6 py-3">
                <Link to="/admin/login">Go to Admin Login</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
