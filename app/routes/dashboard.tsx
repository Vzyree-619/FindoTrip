import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
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
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, avatar: true }
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

  // Get dashboard stats - only for customers
  const [propertyBookings, vehicleBookings, tourBookings, reviewsCount, wishlists] = await Promise.all([
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
  const bookingsCount = propertyBookings.length + vehicleBookings.length + tourBookings.length;
  
  // Calculate upcoming bookings
  const now = new Date();
  const upcomingPropertyBookings = propertyBookings.filter(
    b => b.status === "CONFIRMED" && b.checkIn >= now
  ).length;
  const upcomingVehicleBookings = vehicleBookings.filter(
    b => b.status === "CONFIRMED" && b.startDate >= now
  ).length;
  const upcomingTourBookings = tourBookings.filter(
    b => b.status === "CONFIRMED" && b.tourDate >= now
  ).length;
  const upcomingBookings = upcomingPropertyBookings + upcomingVehicleBookings + upcomingTourBookings;

  // Calculate favorites count
  const favoritesCount = wishlists.reduce((total, wishlist) => {
    return total + wishlist.propertyIds.length + wishlist.vehicleIds.length + wishlist.tourIds.length;
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
  const isProviderRole = user.role === "PROPERTY_OWNER" || user.role === "VEHICLE_OWNER" || user.role === "TOUR_GUIDE";
  if (isProviderRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Provider Sidebar */}
          <div className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user.name}</p>
            </div>
            <nav className="mt-6">
              <div className="px-6 py-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600 font-medium">Total Bookings</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.bookingsCount}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-green-600 font-medium">Upcoming</div>
                    <div className="text-2xl font-bold text-green-900">{stats.upcomingBookings}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-purple-600 font-medium">Reviews</div>
                    <div className="text-2xl font-bold text-purple-900">{stats.reviewsCount}</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-orange-600 font-medium">Favorites</div>
                    <div className="text-2xl font-bold text-orange-900">{stats.favoritesCount}</div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 space-y-2">
                <Link to="/dashboard/bookings" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  📅 My Bookings
                </Link>
                <Link to="/dashboard/messages" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  💬 Messages
                </Link>
                <Link to="/dashboard/reviews" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  ⭐ Reviews
                </Link>
                <Link to="/dashboard/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  ⚙️ Profile
                </Link>
              </div>
            </nav>
          </div>
          <main className="flex-1 overflow-y-auto">
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
    { name: "Profile", href: "/dashboard/profile", icon: Settings },
  ];

  return (
    <div className="bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:left-0 md:top-20 md:h-[calc(100vh-5rem)] md:z-10">
          <div className="bg-white border-r border-gray-200 h-full">
            {/* User Profile Summary */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200">
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
                  <p className="text-base font-medium text-gray-900 truncate">{safeUser.name}</p>
                  <p className="text-sm text-gray-500 truncate">{safeUser.email}</p>
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
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
        <div className="flex flex-col flex-1 md:ml-64 md:pt-4">
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

