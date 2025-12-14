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
  Menu,
  X,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { ThemeProvider } from "~/contexts/ThemeContext";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      avatar: true,
      email: true,
      appearanceSettings: true,
    },
  });

  // Redirect based on role only when visiting the root dashboard path
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
  }

  // Redirect tour guides from generic bookings to their specific bookings page
  if (url.pathname === "/dashboard/bookings" && user?.role === "TOUR_GUIDE") {
    throw redirect("/dashboard/guide/bookings");
  }

  // Allow tour guide specific routes to pass through
  if (
    user?.role === "TOUR_GUIDE" &&
    (url.pathname.startsWith("/dashboard/guide/") ||
      url.pathname === "/dashboard/guide")
  ) {
    let appearanceSettings = {
      theme: "light",
      fontSize: "medium",
      compactMode: false,
      sidebarCollapsed: false,
      animationsEnabled: true,
    };

    if (user?.appearanceSettings) {
      try {
        appearanceSettings = JSON.parse(user.appearanceSettings);
      } catch (e) {
        console.error("Failed to parse appearance settings:", e);
      }
    }

    return json({
      user,
      stats: {
        bookingsCount: 0,
        upcomingBookings: 0,
        reviewsCount: 0,
        favoritesCount: 0,
      },
      appearanceSettings,
    });
  }

  // Get dashboard stats - only for customers
  // Add timeout to prevent hanging
  try {
    const statsPromise = Promise.all([
      prisma.propertyBooking.findMany({
        where: { userId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
        select: { id: true, status: true, checkIn: true },
      }),
      prisma.vehicleBooking.findMany({
        where: { userId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
        select: { id: true, status: true, startDate: true },
      }),
      prisma.tourBooking.findMany({
        where: { userId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
        select: { id: true, status: true, tourDate: true },
      }),
      prisma.review.count({
        where: { userId },
      }),
      prisma.wishlist.findMany({
        where: { userId },
      }),
    ]);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Loader timeout")), 10000); // 10 second timeout
    });

    const [propertyBookings, vehicleBookings, tourBookings, reviewsCount, wishlists] = await Promise.race([
      statsPromise,
      timeoutPromise,
    ]) as any;

    const bookingsCount =
      propertyBookings.length + vehicleBookings.length + tourBookings.length;

    const now = new Date();
    const upcomingPropertyBookings = propertyBookings.filter(
      (b: any) => (b.status === "PENDING" || b.status === "CONFIRMED") && b.checkIn && new Date(b.checkIn) >= now
    ).length;
    const upcomingVehicleBookings = vehicleBookings.filter(
      (b: any) => (b.status === "PENDING" || b.status === "CONFIRMED") && b.startDate && new Date(b.startDate) >= now
    ).length;
    const upcomingTourBookings = tourBookings.filter(
      (b: any) => (b.status === "PENDING" || b.status === "CONFIRMED") && b.tourDate && new Date(b.tourDate) >= now
    ).length;
    const upcomingBookings =
      upcomingPropertyBookings + upcomingVehicleBookings + upcomingTourBookings;

    const favoritesCount = wishlists.reduce((total: number, wishlist: any) => {
      return (
        total +
        wishlist.propertyIds.length +
        wishlist.vehicleIds.length +
        wishlist.tourIds.length
      );
    }, 0);

  let appearanceSettings = {
    theme: "light",
    fontSize: "medium",
    compactMode: false,
    sidebarCollapsed: false,
    animationsEnabled: true,
  };

  if (user?.appearanceSettings) {
    try {
      appearanceSettings = JSON.parse(user.appearanceSettings);
    } catch (e) {
      console.error("Failed to parse appearance settings:", e);
    }
  }

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
    appearanceSettings,
  });
  } catch (error) {
    console.error("Error in dashboard loader:", error);
    // Return minimal data to prevent page from hanging
    return json({
      user,
      stats: {
        bookingsCount: 0,
        upcomingBookings: 0,
        reviewsCount: 0,
        favoritesCount: 0,
      },
      appearanceSettings: {
        theme: "light",
        fontSize: "medium",
        compactMode: false,
        sidebarCollapsed: false,
        animationsEnabled: true,
      },
    });
  }
}

export default function Dashboard() {
  const { user, stats, appearanceSettings } = useLoaderData<typeof loader>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isProviderRole =
    user.role === "PROPERTY_OWNER" ||
    user.role === "VEHICLE_OWNER" ||
    user.role === "TOUR_GUIDE";

  if (isProviderRole) {
    return (
      <ThemeProvider
        initialTheme={appearanceSettings.theme as "light" | "dark" | "auto"}
      >
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col overflow-x-hidden w-full">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-screen md:w-64 md:flex-col md:z-40">
            <ProviderSidebar user={user} stats={stats} />
          </div>

          {/* Mobile Header */}
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h2>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded-lg">
                    <div className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                      Bookings
                    </div>
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {stats.bookingsCount}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900 p-2 rounded-lg">
                    <div className="text-green-600 dark:text-green-300 text-xs font-medium">
                      Upcoming
                    </div>
                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                      {stats.upcomingBookings}
                    </div>
                  </div>
                </div>
                <Link
                  to={user.role === "TOUR_GUIDE" ? "/dashboard/guide/bookings" : user.role === "PROPERTY_OWNER" ? "/dashboard/provider" : user.role === "VEHICLE_OWNER" ? "/dashboard/vehicle-owner" : "/dashboard/bookings"}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>
                {user.role === "PROPERTY_OWNER" && (
                  <Link
                    to="/dashboard/provider/revenue"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Revenue & Commissions
                  </Link>
                )}
                <Link
                  to="/dashboard/messages"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </Link>
                <Link
                  to={user.role === "TOUR_GUIDE" ? "/dashboard/guide/reviews" : user.role === "PROPERTY_OWNER" ? "/dashboard/provider/reviews" : user.role === "VEHICLE_OWNER" ? "/dashboard/vehicle-owner" : "/dashboard/reviews"}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Star className="w-4 h-4" />
                  Reviews
                </Link>
                <Link
                  to={user.role === "TOUR_GUIDE" ? "/dashboard/guide/profile" : user.role === "PROPERTY_OWNER" ? "/dashboard/provider" : user.role === "VEHICLE_OWNER" ? "/dashboard/vehicle-owner" : "/dashboard/profile"}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  to="/dashboard/settings/appearance"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Palette className="w-4 h-4" />
                  Appearance
                </Link>
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="flex-1 w-full md:ml-64 md:w-[calc(100vw-256px)] md:max-w-[calc(100vw-256px)] overflow-auto overflow-x-hidden">
            <div className="w-full max-w-full min-w-0 overflow-x-hidden box-border">
            <Outlet />
            </div>
          </main>
        </div>
      </ThemeProvider>
    );
  }

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
    <ThemeProvider
      initialTheme={appearanceSettings.theme as "light" | "dark" | "auto"}
    >
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col overflow-x-hidden w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-screen md:w-64 md:flex-col md:z-40 md:bg-white dark:md:bg-gray-800">
          <CustomerSidebar user={safeUser} navigation={navigation} />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Dashboard
              </h2>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full md:ml-64 md:w-[calc(100vw-256px)] md:max-w-[calc(100vw-256px)] overflow-auto overflow-x-hidden">
          <div className="w-full max-w-full min-w-0 overflow-x-hidden box-border">
          <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

function ProviderSidebar({ user, stats }: any) {
  // Determine routes based on user role
  const getBookingsRoute = () => {
    if (user.role === "TOUR_GUIDE") return "/dashboard/guide/bookings";
    if (user.role === "PROPERTY_OWNER") return "/dashboard/provider";
    if (user.role === "VEHICLE_OWNER") return "/dashboard/vehicle-owner";
    return "/dashboard/bookings";
  };

  const getReviewsRoute = () => {
    if (user.role === "TOUR_GUIDE") return "/dashboard/guide/reviews";
    if (user.role === "PROPERTY_OWNER") return "/dashboard/provider/reviews";
    if (user.role === "VEHICLE_OWNER") return "/dashboard/vehicle-owner";
    return "/dashboard/reviews";
  };

  const getProfileRoute = () => {
    if (user.role === "TOUR_GUIDE") return "/dashboard/guide/profile";
    if (user.role === "PROPERTY_OWNER") return "/dashboard/provider";
    if (user.role === "VEHICLE_OWNER") return "/dashboard/vehicle-owner";
    return "/dashboard/profile";
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto flex flex-col pt-16">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Welcome back, {user.name}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="px-6 py-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
              <div className="text-blue-600 dark:text-blue-300 font-medium">
                Total Bookings
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.bookingsCount}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
              <div className="text-green-600 dark:text-green-300 font-medium">
                Upcoming
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.upcomingBookings}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg">
              <div className="text-purple-600 dark:text-purple-300 font-medium">
                Reviews
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.reviewsCount}
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900 p-3 rounded-lg">
              <div className="text-orange-600 dark:text-orange-300 font-medium">
                Favorites
              </div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats.favoritesCount}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 space-y-2">
          <Link
            to={getBookingsRoute()}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <Calendar className="w-4 h-4" />
            My Bookings
          </Link>
          {user.role === "PROPERTY_OWNER" && (
            <Link
              to="/dashboard/provider/revenue"
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <TrendingUp className="w-4 h-4" />
              Revenue & Commissions
            </Link>
          )}
          <Link
            to="/dashboard/messages"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <MessageCircle className="w-4 h-4" />
            Messages
          </Link>
          <Link
            to={getReviewsRoute()}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <Star className="w-4 h-4" />
            Reviews
          </Link>
          <Link
            to={getProfileRoute()}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <Settings className="w-4 h-4" />
            Profile
          </Link>
          <Link
            to="/dashboard/settings/appearance"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <Palette className="w-4 h-4" />
            Appearance
          </Link>
        </div>
      </nav>
    </div>
  );
}

function CustomerSidebar({ user, navigation }: any) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto flex flex-col pt-16">
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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
            <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item: any) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact === true}
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
  );
}
