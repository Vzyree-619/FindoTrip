import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  return json({ userId });
}

export default function DashboardOverview() {
  const { userId } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600 mb-6">Quick links to your dashboard sections</p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard/profile" className="px-4 py-2 bg-[#01502E] text-white rounded">Profile</Link>
          <Link to="/dashboard/bookings" className="px-4 py-2 bg-[#01502E] text-white rounded">Bookings</Link>
          <Link to="/dashboard/favorites" className="px-4 py-2 bg-[#01502E] text-white rounded">Wishlist</Link>
        </div>
      </div>
    </div>
  );
}

