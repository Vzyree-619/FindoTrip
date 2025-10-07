import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireTourGuide } from "~/lib/auth/auth.server";
import { getGuideStats, prisma } from "~/lib/db/db.server";
import { Compass, DollarSign, Calendar, Star } from "lucide-react";
import { format } from "date-fns";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireTourGuide(request);

  const guide = await prisma.tourGuide.findUnique({
    where: { userId: user.id },
    include: { user: true },
  });

  if (!guide) {
    throw new Response("Tour guide profile not found", { status: 404 });
  }

  const stats = await getGuideStats(guide.id);

  return json({ user, guide, stats });
}

export default function GuideDashboard() {
  const { user, guide, stats } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tour Guide Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalTours || 0}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Compass className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Upcoming Tours
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.upcomingTours || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.rating.toFixed(1) || 0}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats?.totalRevenue.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
              <Link
                to="/dashboard/guide/edit-profile"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </h3>
                <p className="text-gray-600">
                  {guide.bio || "No bio added yet"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {guide.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {guide.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Experience
                </h3>
                <p className="text-gray-600">{guide.experience} years</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Price per Hour
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  ${guide.pricePerHour}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Location
                </h3>
                <p className="text-gray-600">
                  {guide.city}, {guide.country}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Tours</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.bookings
                .filter(
                  (b) =>
                    b.status === "CONFIRMED" && new Date(b.checkIn) > new Date()
                )
                .sort(
                  (a, b) =>
                    new Date(a.checkIn).getTime() -
                    new Date(b.checkIn).getTime()
                )
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Tour Booking #{booking.bookingNumber}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          {format(new Date(booking.checkIn), "PPP")} at{" "}
                          {format(new Date(booking.checkIn), "p")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration:{" "}
                          {Math.ceil(
                            (new Date(booking.checkOut).getTime() -
                              new Date(booking.checkIn).getTime()) /
                              (1000 * 60 * 60)
                          )}{" "}
                          hours
                        </p>
                        <p className="text-sm text-gray-600">
                          Guests: {booking.guests}
                        </p>
                        {booking.specialRequests && (
                          <p className="text-sm text-gray-500 mt-2">
                            <span className="font-semibold">
                              Special requests:
                            </span>{" "}
                            {booking.specialRequests}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {booking.status}
                        </span>
                        <p className="text-xl font-bold text-gray-900 mt-2">
                          ${booking.totalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {stats?.bookings.filter(
              (b) =>
                b.status === "CONFIRMED" && new Date(b.checkIn) > new Date()
            ).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No upcoming tours
                </h3>
                <p className="text-gray-600">
                  Your upcoming tour bookings will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
