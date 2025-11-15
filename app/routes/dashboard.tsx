import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, NavLink, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import {
  Calendar,
  Heart,
  Star,
  Settings,
  Home,
  Bell,
  MessageCircle,
  Palette,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, avatar: true, email: true },
  });

  // Redirect based on role only when visiting the root dashboard path
  // Avoid self-redirect loops on role-specific child routes (e.g., /dashboard/provider)
  if (url.pathname === "/dashboard") {
    if (user?.role === "PROPERTY_OWNER") {
      throw redirect("/dashboard/provider");
    }
    if (user?.role === "VEHICLE_OWNER") {
      throw redirect("/dashboard/vehicle-owner");
    }
    if (user?.role === "TOUR_GUIDE") {
      throw redirect("/dashboard/guide");
    }
    // SUPER_ADMIN would stay here for admin dashboard
  }

  // Redirect tour guides from generic bookings to their specific bookings page
  if (url.pathname === "/dashboard/bookings" && user?.role === "TOUR_GUIDE") {
    throw redirect("/dashboard/guide/bookings");
  }

  // Allow tour guide specific routes to pass through without redirect
  if (
    user?.role === "TOUR_GUIDE" &&
    (url.pathname.startsWith("/dashboard/guide/") ||
      url.pathname === "/dashboard/guide")
  ) {
    // Let the specific route handle the request, but still pass user data with default stats
    return json({
      user,
      stats: {
        bookingsCount: 0,
        upcomingBookings: 0,
        reviewsCount: 0,
        favoritesCount: 0,
      },
    });
  }

  // Get dashboard stats - only for customers
  const [
    propertyBookings,
    vehicleBookings,
    tourBookings,
    reviewsCount,
    wishlists,
  ] = await Promise.all([
    prisma.propertyBooking.findMany({
      where: { userId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { id: true, status: true, checkIn: true },
    }),
    prisma.vehicleBooking.findMany({
      where: { userId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { id: true, status: true, startDate: true },
    }),
    prisma.tourBooking.findMany({
      where: { userId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { id: true, status: true, tourDate: true },
    }),
    prisma.review.count({
      where: { userId },
    }),
    prisma.wishlist.findMany({
      where: { userId },
    }),
  ]);

  // Calculate total bookings
  const bookingsCount =
    propertyBookings.length + vehicleBookings.length + tourBookings.length;

  // Calculate upcoming bookings
  const now = new Date();
  const upcomingPropertyBookings = propertyBookings.filter(
    (b) => b.status === "CONFIRMED" && b.checkIn >= now
  ).length;
  const upcomingVehicleBookings = vehicleBookings.filter(
    (b) => b.status === "CONFIRMED" && b.startDate >= now
  ).length;
  const upcomingTourBookings = tourBookings.filter(
    (b) => b.status === "CONFIRMED" && b.tourDate >= now
  ).length;
  const upcomingBookings =
    upcomingPropertyBookings + upcomingVehicleBookings + upcomingTourBookings;

  // Calculate favorites count
  const favoritesCount = wishlists.reduce((total, wishlist) => {
    return (
      total +
      wishlist.propertyIds.length +
      wishlist.vehicleIds.length +
      wishlist.tourIds.length
    );
  }, 0);

  return json({
    user: await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        verified: true,
      },
    }),
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

  // Add null check for user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render provider-specific layout with overview
  const isProviderRole =
    user.role === "PROPERTY_OWNER" ||
    user.role === "VEHICLE_OWNER" ||
    user.role === "TOUR_GUIDE";
  if (isProviderRole) {
    return (
      <div className="bg-gray-50">
        <div className="flex">
          {/* Provider Sidebar */}
          <div className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user.name}
              </p>
            </div>
            <nav className="mt-6">
              <div className="px-6 py-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600 font-medium">
                      Total Bookings
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {stats.bookingsCount}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-green-600 font-medium">Upcoming</div>
                    <div className="text-2xl font-bold text-green-900">
                      {stats.upcomingBookings}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-purple-600 font-medium">Reviews</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {stats.reviewsCount}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-orange-600 font-medium">Favorites</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {stats.favoritesCount}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 space-y-2">
                <Link
                  to="/dashboard/guide/bookings"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  📅 My Bookings
                </Link>
                <Link
                  to="/dashboard/messages"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  💬 Messages
                </Link>
                <Link
                  to="/dashboard/guide/reviews"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  ⭐ Reviews
                </Link>
                <Link
                  to="/dashboard/guide/profile"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  ⚙️ Profile
                </Link>
                <Link
                  to="/dashboard/settings/appearance"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  🎨 Appearance
                </Link>
              </div>
            </nav>
          </div>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  // Type assertion that user is not null
  const safeUser = user as NonNullable<typeof user>;

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: Home, exact: true },
    { name: "My Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Messages", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    {
      name: "Appearance",
      href: "/dashboard/settings/appearance",
      icon: Palette,
    },
    { name: "Profile", href: "/dashboard/profile", icon: Settings },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:left-0 md:top-20 md:z-10">
          <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen">
            {/* User Profile Summary */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {safeUser.avatar ? (
                  <img
                    className="inline-block h-12 w-12 rounded-full object-cover"
                    src={safeUser.avatar}
                    alt={safeUser.name}
                  />
                ) : (
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#01502E]">
                    <span className="text-lg font-medium leading-none text-white">
                      {safeUser.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                    {safeUser.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {safeUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.exact}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-base font-medium rounded-lg transition ${
                      isActive
                        ? "bg-[#01502E] text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    }`
                  }
                >
                  <item.icon
                    className="mr-4 flex-shrink-0 h-5 w-5"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 md:ml-64">
          {/* Mobile Header */}
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
              <Link
                to="/"
                className="text-sm text-[#01502E] hover:text-[#013d23] font-medium"
              >
                Back to Site
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 pt-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
