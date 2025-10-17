import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, ArrowRight, Home, Users, BarChart3, Settings } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function AdminAccessSimple() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#01502E] rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Access Portal</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dedicated admin login system for FindoTrip super administrators. 
            Quick and secure access to the admin dashboard.
          </p>
        </div>

        {/* Main Access Card */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Super Admin Login
            </CardTitle>
            <p className="text-gray-600">
              Secure access to the FindoTrip admin dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current User Status */}
            {user ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Logged in as: {user.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Role: {user.role}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  You are not currently logged in. Please use the admin login below.
                </p>
              </div>
            )}

            {/* Admin Login Button */}
            <div className="space-y-4">
              <Link to="/admin-login" className="block">
                <Button 
                  size="lg" 
                  className="w-full bg-[#01502E] hover:bg-[#013d23] text-white font-medium py-4 text-lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Access Full Admin Panel
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <p className="text-center text-sm text-gray-500">
                Direct access to the full admin panel with all features
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Secure Access</h3>
              </div>
              <p className="text-blue-800 text-sm mb-4">
                This admin portal is restricted to authorized SUPER_ADMIN users only. 
                Contact your system administrator for access credentials.
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Access Requirements:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Valid SUPER_ADMIN account</li>
                  <li>• Authorized email address</li>
                  <li>• Secure password authentication</li>
                </ul>
              </div>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">User Management</p>
                  <p className="text-xs text-gray-600">Manage all platform users</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-600">Platform insights & reports</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Security</p>
                  <p className="text-xs text-gray-600">Secure admin access</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <Settings className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Settings</p>
                  <p className="text-xs text-gray-600">Platform configuration</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-8 space-x-6">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to FindoTrip</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
