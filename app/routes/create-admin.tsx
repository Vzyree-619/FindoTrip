import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'data@findotrip.com' },
      select: { id: true, email: true, name: true, role: true, active: true }
    });

    return json({ existingAdmin });
  } catch (error) {
    return json({ error: error.message, existingAdmin: null });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === 'create') {
      // Create admin user
      const adminUser = await prisma.user.upsert({
        where: { email: 'data@findotrip.com' },
        update: {
          role: 'SUPER_ADMIN',
          active: true,
          verified: true,
          password: 'password123' // Plain text for demo
        },
        create: {
          email: 'data@findotrip.com',
          password: 'password123', // Plain text for demo
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          active: true,
          verified: true
        }
      });

      return json({ success: true, message: 'Admin user created/updated successfully', user: adminUser });
    } else if (action === 'delete') {
      // Delete admin user
      await prisma.user.delete({
        where: { email: 'data@findotrip.com' }
      });

      return json({ success: true, message: 'Admin user deleted successfully' });
    }

    return json({ success: false, message: 'Invalid action' });
  } catch (error) {
    return json({ success: false, message: error.message });
  }
}

export default function CreateAdmin() {
  const { existingAdmin, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin User Management</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Database Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {actionData && (
          <div className={`border rounded-lg p-4 mb-6 ${
            actionData.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {actionData.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={actionData.success ? 'text-green-800' : 'text-red-800'}>
                {actionData.message}
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-[#01502E]" />
              <span>Admin User Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingAdmin ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Admin User Exists</h3>
                  <div className="space-y-1 text-green-700">
                    <p><strong>Email:</strong> {existingAdmin.email}</p>
                    <p><strong>Name:</strong> {existingAdmin.name}</p>
                    <p><strong>Role:</strong> {existingAdmin.role}</p>
                    <p><strong>Active:</strong> {existingAdmin.active ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="action" value="delete" />
                  <Button 
                    type="submit" 
                    variant="destructive"
                    className="w-full"
                  >
                    Delete Admin User
                  </Button>
                </Form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Admin User Found</h3>
                  <p className="text-yellow-700">
                    The admin user 'data@findotrip.com' does not exist. 
                    Click the button below to create it.
                  </p>
                </div>
                
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="action" value="create" />
                  <Button 
                    type="submit"
                    className="w-full bg-[#01502E] hover:bg-[#013d23]"
                  >
                    Create Admin User
                  </Button>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Credentials Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border">data@findotrip.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Password:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border">password123</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">SUPER_ADMIN</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center space-x-4">
          <a 
            href="/admin-test-login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Admin Login
          </a>
          <a 
            href="/admin-login" 
            className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23]"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
