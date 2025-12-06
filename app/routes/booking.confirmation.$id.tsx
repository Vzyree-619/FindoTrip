import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import { ChatInterface } from "~/components/chat";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
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
  const [chatOpen, setChatOpen] = useState(false);

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
              <button onClick={() => setChatOpen(true)} className="flex-1 bg-gray-800 text-white text-center py-3 px-6 rounded-lg hover:bg-gray-700 font-semibold transition">
                Message Provider
              </button>
            </div>
            <ChatInterface isOpen={chatOpen} onClose={() => setChatOpen(false)} targetUserId={(booking as any).providerId} initialMessage={`Hi, I'm reaching out regarding booking #${booking.id}.`} />
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
/*
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useMemo } from "react";
import { CheckCircle, Download, Printer, Mail, Calendar, MapPin, Users, CreditCard, Phone } from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id as string;
  if (!bookingId) throw redirect("/");

  const url = new URL(request.url);
  const bookingType = (url.searchParams.get("type") || "property").toLowerCase();
  if (!["property", "vehicle", "tour"].includes(bookingType)) throw redirect("/");

  let booking: any = null;
  let payment: any = null;

  if (bookingType === "property") {
    booking = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { name: true, address: true, city: true, country: true, images: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    payment = await prisma.payment.findFirst({ where: { bookingId, bookingType: "property" }, orderBy: { createdAt: "desc" } });
  } else if (bookingType === "vehicle") {
    booking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: { select: { brand: true, model: true, year: true, images: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    payment = await prisma.payment.findFirst({ where: { bookingId, bookingType: "vehicle" }, orderBy: { createdAt: "desc" } });
  } else {
    booking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: {
        tour: { select: { title: true, duration: true, meetingPoint: true, city: true, country: true, images: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    payment = await prisma.payment.findFirst({ where: { bookingId, bookingType: "tour" }, orderBy: { createdAt: "desc" } });
  }

  if (!booking || booking.userId !== userId) throw redirect("/");

  return json({ bookingType, booking, payment, pending: url.searchParams.get("pending") === "1" });
}

export default function BookingConfirmation() {
  const { bookingType, booking, payment, pending } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const service = useMemo(() => {
    if (bookingType === "property") {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        title: "Your Stay",
        name: booking.property.name,
        image: booking.property.images?.[0] || "/landingPageImg.jpg",
        location: `${booking.property.address}, ${booking.property.city}, ${booking.property.country}`,
        startLabel: "Check-in",
        endLabel: "Check-out",
        startDate: start,
        endDate: end,
        guestsText: `${booking.guests} guests`,
        durationText: `${nights} night${nights > 1 ? "s" : ""}`,
      };
    }
    if (bookingType === "vehicle") {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        title: "Your Ride",
        name: `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.year})`,
        image: booking.vehicle.images?.[0] || "/placeholder-vehicle.jpg",
        location: booking.pickupLocation || "Pickup location provided",
        startLabel: "Pickup",
        endLabel: "Dropoff",
        startDate: start,
        endDate: end,
        guestsText: `1 passenger`,
        durationText: `${days} day${days > 1 ? "s" : ""}`,
      };
    }
    const start = new Date(booking.tourDate);
    return {
      title: "Your Tour",
      name: booking.tour.title,
      image: booking.tour.images?.[0] || "/placeholder-tour.jpg",
      location: `${booking.tour.meetingPoint || "Meeting point"}, ${booking.tour.city}, ${booking.tour.country}`,
      startLabel: "Date",
      endLabel: "Date",
      startDate: start,
      endDate: start,
      guestsText: `${booking.participants} participant${booking.participants > 1 ? "s" : ""}`,
      durationText: `${booking.tour.duration} hours`,
    };
  }, [bookingType, booking]);

  const bookingNumber = booking.bookingNumber || `BK-${String(booking.id).slice(-6)}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your reservation is confirmed. A receipt has been sent to <span className="font-medium">{booking.user.email}</span>.
          </p>
          {pending && (
            <div className="mt-2 inline-block px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-sm">Payment pending verification</div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#01502E] px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Confirmation Number</h2>
                <p className="text-lg font-mono">{bookingNumber}</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"><Download className="h-4 w-4" /> Download</button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"><Printer className="h-4 w-4" /> Print</button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">{service.name}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{service.location}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{booking.user.phone || '+92 XXX XXXXXXX'}</span></div>
                  </div>
                </div>
                <div>
                  <img src={service.image} alt={service.name} className="w-full h-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2"><Calendar className="h-5 w-5 text-[#01502E]" /><span className="font-semibold text-gray-900">{service.startLabel}</span></div>
                <p className="text-lg font-medium">{service.startDate.toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">{bookingType === 'property' ? 'After 3:00 PM' : bookingType === 'vehicle' ? 'Pickup time as arranged' : 'Meet at the meeting point'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2"><Calendar className="h-5 w-5 text-[#01502E]" /><span className="font-semibold text-gray-900">{bookingType === 'property' ? 'Check-out' : bookingType === 'vehicle' ? 'Dropoff' : 'Date'}</span></div>
                <p className="text-lg font-medium">{service.endDate.toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">{bookingType === 'property' ? 'Before 11:00 AM' : bookingType === 'vehicle' ? 'Dropoff time as arranged' : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-[#01502E]" /><span className="font-semibold text-gray-900">{bookingType === 'tour' ? 'Participants' : 'Guests'}</span></div>
                <p className="text-lg font-medium">{service.guestsText}</p>
                <p className="text-sm text-gray-600">{service.durationText}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3"><CreditCard className="h-5 w-5 text-[#01502E]" /><span className="font-semibold">Payment Method</span></div>
                    <p className="text-gray-900 capitalize">{payment?.method?.toLowerCase().replace("_", " ") || 'pending'}</p>
                    <p className="text-sm text-gray-600">Transaction ID: {payment?.transactionId || 'pending'}</p>
                    <p className="text-sm text-gray-600">Payment Date: {payment?.paidAt ? new Date(payment.paidAt).toLocaleString() : 'pending'}</p>
                  </div>
                  <div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">PKR {(booking.totalPrice * 0.85).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Taxes & fees</span><span className="font-medium">PKR {(booking.totalPrice * 0.15).toLocaleString()}</span></div>
                      <div className="pt-2 border-t border-gray-300 flex justify-between text-lg"><span className="font-bold">Total Paid</span><span className="font-bold text-[#01502E]">PKR {booking.totalPrice.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {booking.specialRequests && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Special Requests</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-blue-800">{booking.specialRequests}</p></div>
              </div>
            )}

            <div className="bg-gradient-to-r from-[#01502E]/5 to-[#01502E]/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>✉️ Confirmation email sent to {booking.user.email}</li>
                <li>📱 Provider has been notified</li>
                <li>💬 You can message provider anytime</li>
                <li>📅 Reminders will be sent before your {bookingType === 'tour' ? 'tour' : bookingType === 'vehicle' ? 'rental' : 'stay'}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><Mail className="h-4 w-4" /> Email Confirmation</button>
          <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><Download className="h-4 w-4" /> Download Voucher</button>
          <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><Printer className="h-4 w-4" /> Print</button>
        </div>

        <div className="mt-6 text-center">
          <Link to="/dashboard/bookings" className="px-4 py-2 rounded-lg bg-[#01502E] text-white inline-block mr-2">View My Bookings</Link>
          <Link to="/" className="px-4 py-2 rounded-lg border inline-block">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
*/
