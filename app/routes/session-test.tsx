import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUserId, getUser } from "~/lib/auth/auth.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  const user = await getUser(request);
  
  return json({ 
    userId, 
    user,
    cookies: request.headers.get('Cookie') || 'No cookies',
    url: request.url
  });
}

export default function SessionTest() {
  const { userId, user, cookies, url } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Session Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Session Status
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
              <CardTitle>Request Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">URL:</h3>
                  <p className="text-sm text-gray-600">{url}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cookies:</h3>
                  <p className="text-sm text-gray-600 break-all">{cookies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex space-x-4">
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
