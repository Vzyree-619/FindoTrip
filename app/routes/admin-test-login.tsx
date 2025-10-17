import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'data@findotrip.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        verified: true,
        password: true
      }
    });

    // Get all users with SUPER_ADMIN role
    const allAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        verified: true
      }
    });

    return json({ 
      adminUser, 
      allAdmins,
      totalAdmins: allAdmins.length 
    });
  } catch (error) {
    return json({ 
      error: error.message,
      adminUser: null,
      allAdmins: [],
      totalAdmins: 0
    });
  }
}

export default function AdminTestLogin() {
  const { adminUser, allAdmins, totalAdmins, error } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Login Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Database Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Admin User */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Admin User (data@findotrip.com)</h2>
            {adminUser ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {adminUser.id}</p>
                <p><strong>Email:</strong> {adminUser.email}</p>
                <p><strong>Name:</strong> {adminUser.name}</p>
                <p><strong>Role:</strong> <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{adminUser.role}</span></p>
                <p><strong>Active:</strong> <span className={adminUser.active ? 'text-green-600' : 'text-red-600'}>{adminUser.active ? 'Yes' : 'No'}</span></p>
                <p><strong>Verified:</strong> <span className={adminUser.verified ? 'text-green-600' : 'text-red-600'}>{adminUser.verified ? 'Yes' : 'No'}</span></p>
                <p><strong>Password:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{adminUser.password.substring(0, 20)}...</span></p>
              </div>
            ) : (
              <div className="text-red-600">
                <p>❌ Admin user not found!</p>
                <p className="text-sm mt-2">The user 'data@findotrip.com' does not exist in the database.</p>
              </div>
            )}
          </div>

          {/* All Admin Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All SUPER_ADMIN Users ({totalAdmins})</h2>
            {allAdmins.length > 0 ? (
              <div className="space-y-3">
                {allAdmins.map((admin) => (
                  <div key={admin.id} className="border rounded-lg p-3">
                    <p><strong>Email:</strong> {admin.email}</p>
                    <p><strong>Name:</strong> {admin.name}</p>
                    <p><strong>Active:</strong> <span className={admin.active ? 'text-green-600' : 'text-red-600'}>{admin.active ? 'Yes' : 'No'}</span></p>
                    <p><strong>Verified:</strong> <span className={admin.verified ? 'text-green-600' : 'text-red-600'}>{admin.verified ? 'Yes' : 'No'}</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-600">
                <p>❌ No SUPER_ADMIN users found!</p>
                <p className="text-sm mt-2">There are no users with SUPER_ADMIN role in the database.</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Login Instructions</h3>
          <div className="space-y-2 text-blue-800">
            <p>• If the target admin user exists, use: <strong>data@findotrip.com</strong> / <strong>password123</strong></p>
            <p>• If no admin users exist, you may need to create one first</p>
            <p>• Check that the user has <strong>active: true</strong> and <strong>verified: true</strong></p>
            <p>• The password should match exactly (case-sensitive)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
