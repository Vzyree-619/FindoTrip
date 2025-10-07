import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Outlet, useLoaderData, NavLink, Link } from "@remix-run/react";
import { requireUserId, getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import {
  User,
  Calendar,
  Heart,
  Star,
  Settings,
  LogOut,
  Home,
  Bell,
  CreditCard,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw redirect("/login");
  }

  // Get dashboard stats
  const [bookingsCount, upcomingBookings, reviewsCount, favoritesCount] = await Promise.all([
    prisma.booking.count({
      where: { userId, status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    prisma.booking.count({
      where: { 
        userId, 
        status: "CONFIRMED",
        checkIn: { gte: new Date() },
      },
    }),
    prisma.review.count({
      where: { userId },
    }),
    prisma.wishlist.count({
      where: { userId },
    }),
  ]);

  return json({
    user,
    stats: {
      bookingsCount,
      upcomingBookings,
      reviewsCount,
      favoritesCount,
    },
  });
}

export default function Dashboard() {
  const { user, stats } = useLoaderData<typeof loader>();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: Home, exact: true },
    { name: "My Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    { name: "Profile", href: "/dashboard/profile", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
            {/* User Profile Summary */}
            <div className="flex items-center flex-shrink-0 px-4 pb-4 border-b border-gray-200">
              <div className="flex items-center">
                {user.avatar ? (
                  <img
                    className="inline-block h-12 w-12 rounded-full object-cover"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#01502E]">
                    <span className="text-lg font-medium leading-none text-white">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#01502E]/10 text-[#01502E] mt-1">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.exact}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition ${
                        isActive
                          ? "bg-[#01502E] text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    <item.icon
                      className="mr-3 flex-shrink-0 h-5 w-5"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="px-2 py-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="font-semibold text-blue-900">{stats.upcomingBookings}</div>
                    <div className="text-blue-600">Upcoming</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="font-semibold text-green-900">{stats.bookingsCount}</div>
                    <div className="text-green-600">Total Trips</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="font-semibold text-red-900">{stats.favoritesCount}</div>
                    <div className="text-red-600">Favorites</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded text-center">
                    <div className="font-semibold text-yellow-900">{stats.reviewsCount}</div>
                    <div className="text-yellow-600">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="px-2 pb-4">
                <form method="post" action="/logout">
                  <button
                    type="submit"
                    className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          {/* Mobile Header */}
          <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
              <Link
                to="/"
                className="text-sm text-[#01502E] hover:text-[#013d23] font-medium"
              >
                Back to Site
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

// Default dashboard overview page
export function DashboardIndex() {
  const { user, stats } = useLoaderData<typeof loader>();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your account today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/accommodations/search"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-[#01502E]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Book a Stay
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Find Hotels
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/bookings"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Trips
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.upcomingBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/favorites"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Saved Places
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.favoritesCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/reviews"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Your Reviews
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.reviewsCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your recent bookings and updates will appear here.
              </p>
              <div className="mt-6">
                <Link
                  to="/accommodations/search"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23]"
                >
                  Book Your First Stay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
