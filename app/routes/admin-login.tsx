import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function AdminLogin() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Admin Access Required
        </h1>
        
        {user ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              You are logged in as <strong>{user.name}</strong> ({user.role})
            </p>
            {user.role === "SUPER_ADMIN" ? (
              <Link
                to="/dashboard/admin"
                className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#013d23]"
              >
                Access Admin Dashboard
              </Link>
            ) : (
              <div className="space-y-4">
                <p className="text-red-600">
                  You need SUPER_ADMIN privileges to access the admin dashboard.
                </p>
                <p className="text-sm text-gray-500">
                  Please log in with an admin account:
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• admin@example.com</p>
                  <p>• data@findotrip.com</p>
                  <p>Password: password123</p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              You need to be logged in as a SUPER_ADMIN to access the admin dashboard.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>Available admin accounts:</p>
              <p>• admin@example.com</p>
              <p>• data@findotrip.com</p>
              <p>Password: password123</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#013d23]"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
