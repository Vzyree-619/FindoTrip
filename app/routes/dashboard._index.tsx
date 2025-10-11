import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import {
  Calendar,
  Heart,
  Star,
  Bell,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

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

export default function DashboardIndex() {
  const { user, stats } = useLoaderData<typeof loader>();

  if (!user) {
    return <div>Loading...</div>;
  }

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
            to="/accommodations"
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
                  to="/accommodations"
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
