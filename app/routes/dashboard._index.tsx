import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import {
  Calendar,
  Heart,
  Star,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Get dashboard stats - only for customers
  const [propertyBookings, vehicleBookings, tourBookings, reviewsCount, wishlists, recentBookingsData] = await Promise.all([
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
    // Get recent bookings with full details for Recent Activity section
    Promise.all([
      prisma.propertyBooking.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.vehicleBooking.findMany({
        where: { userId },
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.tourBooking.findMany({
        where: { userId },
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]),
  ]);

  // Calculate total bookings
  const bookingsCount = propertyBookings.length + vehicleBookings.length + tourBookings.length;
  
  // Calculate upcoming bookings (include PENDING and CONFIRMED)
  const now = new Date();
  const upcomingPropertyBookings = propertyBookings.filter(
    b => (b.status === "PENDING" || b.status === "CONFIRMED") && b.checkIn && new Date(b.checkIn) >= now
  ).length;
  const upcomingVehicleBookings = vehicleBookings.filter(
    b => (b.status === "PENDING" || b.status === "CONFIRMED") && b.startDate && new Date(b.startDate) >= now
  ).length;
  const upcomingTourBookings = tourBookings.filter(
    b => (b.status === "PENDING" || b.status === "CONFIRMED") && b.tourDate && new Date(b.tourDate) >= now
  ).length;
  const upcomingBookings = upcomingPropertyBookings + upcomingVehicleBookings + upcomingTourBookings;

  // Calculate favorites count
  const favoritesCount = wishlists.reduce((total, wishlist) => {
    return total + wishlist.propertyIds.length + wishlist.vehicleIds.length + wishlist.tourIds.length;
  }, 0);

  // Combine and format recent bookings for display
  const [recentPropertyBookings, recentVehicleBookings, recentTourBookings] = recentBookingsData;
  const recentBookings = [
    ...recentPropertyBookings.map(b => ({
      id: b.id,
      type: 'property' as const,
      serviceName: b.property?.name || 'Property',
      serviceLocation: `${b.property?.city || ''}, ${b.property?.country || ''}`.trim(),
      serviceImage: b.property?.images?.[0],
      status: b.status,
      date: b.checkIn,
      createdAt: b.createdAt,
      bookingNumber: b.bookingNumber,
    })),
    ...recentVehicleBookings.map(b => ({
      id: b.id,
      type: 'vehicle' as const,
      serviceName: `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''} ${b.vehicle?.year || ''}`.trim() || 'Vehicle',
      serviceLocation: b.pickupLocation || 'Location TBD',
      serviceImage: b.vehicle?.images?.[0],
      status: b.status,
      date: b.startDate,
      createdAt: b.createdAt,
      bookingNumber: b.bookingNumber,
    })),
    ...recentTourBookings.map(b => ({
      id: b.id,
      type: 'tour' as const,
      serviceName: b.tour?.title || 'Tour',
      serviceLocation: `${b.tour?.city || ''}, ${b.tour?.country || ''}`.trim(),
      serviceImage: b.tour?.images?.[0],
      status: b.status,
      date: b.tourDate,
      createdAt: b.createdAt,
      bookingNumber: b.bookingNumber,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Get top 5 most recent

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
    recentBookings,
  });
}

export default function DashboardIndex() {
  const { user, stats, recentBookings } = useLoaderData<typeof loader>();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8">
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
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/dashboard/bookings/${booking.id}?type=${booking.type}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#01502E] transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Service Image */}
                      <div className="flex-shrink-0">
                        {booking.serviceImage ? (
                          <img
                            src={booking.serviceImage}
                            alt={booking.serviceName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {booking.serviceName}
                            </h4>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{booking.serviceLocation}</span>
                            </div>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {booking.date
                                  ? new Date(booking.date).toLocaleDateString()
                                  : 'Date TBD'}
                              </span>
                              <span className="mx-2">•</span>
                              <span>Booking #{booking.bookingNumber}</span>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="ml-4 flex-shrink-0">
                            {booking.status === "PENDING" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            )}
                            {booking.status === "CONFIRMED" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Confirmed
                              </span>
                            )}
                            {booking.status === "COMPLETED" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </span>
                            )}
                            {booking.status === "CANCELLED" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* View All Bookings Link */}
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/dashboard/bookings"
                    className="text-sm font-medium text-[#01502E] hover:text-[#013d23]"
                  >
                    View all bookings →
                  </Link>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
