import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import {
  CheckCircle,
  Download,
  Printer,
  Mail,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Phone,
  Clock,
} from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id;

  if (!bookingId) {
    throw redirect("/");
  }

  // Get booking with all related data
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      accommodation: true,
      user: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!booking || booking.userId !== userId) {
    throw redirect("/");
  }

  return json({ booking });
}

export default function BookingConfirmation() {
  const { booking } = useLoaderData<typeof loader>();
  const payment = booking.payments[0];

  // Calculate nights
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your reservation has been successfully confirmed. We've sent a confirmation email to{" "}
            <span className="font-medium">{booking.user.email}</span>
          </p>
        </div>

        {/* Confirmation Details */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#01502E] px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Confirmation Number</h2>
                <p className="text-lg font-mono">{booking.bookingNumber}</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                  <Printer className="h-4 w-4" />
                  Print
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Property Details */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Stay</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">
                    {booking.accommodation?.name}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {booking.accommodation?.address}, {booking.accommodation?.city}, {booking.accommodation?.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+92 XXX XXXXXXX</span>
                    </div>
                  </div>
                </div>

                {booking.accommodation?.images && booking.accommodation.images.length > 0 && (
                  <div>
                    <img
                      src={booking.accommodation.images[0]}
                      alt={booking.accommodation.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-[#01502E]" />
                  <span className="font-semibold text-gray-900">Check-in</span>
                </div>
                <p className="text-lg font-medium">
                  {checkInDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-600">After 3:00 PM</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-[#01502E]" />
                  <span className="font-semibold text-gray-900">Check-out</span>
                </div>
                <p className="text-lg font-medium">
                  {checkOutDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-600">Before 11:00 AM</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-[#01502E]" />
                  <span className="font-semibold text-gray-900">Guests</span>
                </div>
                <p className="text-lg font-medium">{booking.guests} guests</p>
                <p className="text-sm text-gray-600">{nights} nights</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-5 w-5 text-[#01502E]" />
                      <span className="font-semibold">Payment Method</span>
                    </div>
                    <p className="text-gray-900 capitalize">
                      {payment?.method.toLowerCase().replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Transaction ID: {payment?.transactionId}
                    </p>
                  </div>
                  <div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal ({nights} nights)</span>
                        <span className="font-medium">PKR {(booking.totalPrice * 0.85).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes & fees</span>
                        <span className="font-medium">PKR {(booking.totalPrice * 0.15).toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300 flex justify-between text-lg">
                        <span className="font-bold">Total Paid</span>
                        <span className="font-bold text-[#01502E]">
                          PKR {booking.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Special Requests</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">{booking.specialRequests}</p>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-gradient-to-r from-[#01502E]/5 to-[#01502E]/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#01502E] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Confirmation Email Sent</p>
                    <p className="text-sm text-gray-600">
                      Check your email for detailed booking information and property contact details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#01502E] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Prepare for Your Trip</p>
                    <p className="text-sm text-gray-600">
                      Review the property amenities and local area information in your confirmation email.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#01502E] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Enjoy Your Stay!</p>
                    <p className="text-sm text-gray-600">
                      Arrive at the property and present your confirmation number at check-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                to="/bookings"
                className="flex-1 bg-[#01502E] text-white text-center py-3 px-6 rounded-lg hover:bg-[#013d23] font-semibold transition"
              >
                View All Bookings
              </Link>
              <Link
                to="/"
                className="flex-1 border border-[#01502E] text-[#01502E] text-center py-3 px-6 rounded-lg hover:bg-[#01502E] hover:text-white font-semibold transition"
              >
                Book Another Stay
              </Link>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800">
              <strong>Email Confirmation:</strong> A detailed confirmation has been sent to {booking.user.email}. 
              If you don't see it, please check your spam folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
