import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { getUserId } from "~/lib/session.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get session information
  const userId = await getUserId(request);
  const user = await getUser(request);
  
  // Get admin user from database
  let adminUser = null;
  try {
    adminUser = await prisma.user.findUnique({
      where: { email: 'data@findotrip.com' },
      select: { id: true, email: true, name: true, role: true, active: true }
    });
  } catch (error) {
    console.error('Database error:', error);
  }
  
  return json({ 
    userId, 
    user, 
    adminUser,
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url
  });
}

export default function AdminDebug() {
  const { userId, user, adminUser, headers, url } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {userId ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>User ID: {userId || 'Not found'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {user ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>User Object: {user ? 'Found' : 'Not found'}</span>
                </div>
                {user && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm">Name: {user.name}</p>
                    <p className="text-sm">Email: {user.email}</p>
                    <p className="text-sm">Role: {user.role}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Database Admin User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {adminUser ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Admin User: {adminUser ? 'Found' : 'Not found'}</span>
                </div>
                {adminUser && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm">ID: {adminUser.id}</p>
                    <p className="text-sm">Email: {adminUser.email}</p>
                    <p className="text-sm">Name: {adminUser.name}</p>
                    <p className="text-sm">Role: {adminUser.role}</p>
                    <p className="text-sm">Active: {adminUser.isActive ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">URL:</h3>
                  <p className="text-sm text-gray-600">{url}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Headers:</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-40">
                    {JSON.stringify(headers, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex space-x-4">
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => window.location.href = '/admin/login'}
            className="flex items-center space-x-2 bg-[#01502E] text-white hover:bg-[#013d23]"
          >
            <Shield className="w-4 h-4" />
            <span>Go to Admin Login</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
