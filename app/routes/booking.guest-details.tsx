import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";
import { requireUserId, getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import {
  User,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  const url = new URL(request.url);
  
  const accommodationId = url.searchParams.get("accommodationId");
  const checkIn = url.searchParams.get("checkIn");
  const checkOut = url.searchParams.get("checkOut");
  const guests = url.searchParams.get("guests");

  if (!accommodationId || !checkIn || !checkOut || !guests) {
    throw redirect("/");
  }

  // Get accommodation details
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
  });

  if (!accommodation) {
    throw redirect("/");
  }

  return json({
    user,
    accommodation,
    bookingParams: {
      accommodationId,
      checkIn,
      checkOut,
      guests: parseInt(guests),
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const accommodationId = formData.get("accommodationId") as string;
  const checkIn = new Date(formData.get("checkIn") as string);
  const checkOut = new Date(formData.get("checkOut") as string);
  const guests = parseInt(formData.get("guests") as string);
  const guestName = formData.get("guestName") as string;
  const guestEmail = formData.get("guestEmail") as string;
  const guestPhone = formData.get("guestPhone") as string;
  const arrivalTime = formData.get("arrivalTime") as string;
  const specialRequests = formData.get("specialRequests") as string;

  // Validation
  if (!guestName || !guestEmail) {
    return json({ error: "Guest name and email are required" }, { status: 400 });
  }

  try {
    // Get accommodation for pricing
    const accommodation = await prisma.accommodation.findUnique({
      where: { id: accommodationId },
    });

    if (!accommodation) {
      return json({ error: "Accommodation not found" }, { status: 404 });
    }

    // Calculate total price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = accommodation.pricePerNight * nights;
    const taxes = subtotal * 0.15; // 15% tax
    const serviceFee = 500; // PKR 500 service fee
    const totalPrice = subtotal + taxes + serviceFee;

    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId,
        accommodationId,
        checkIn,
        checkOut,
        guests,
        totalPrice,
        specialRequests: [
          guestName !== (await prisma.user.findUnique({ where: { id: userId } }))?.name ? `Guest Name: ${guestName}` : null,
          guestEmail !== (await prisma.user.findUnique({ where: { id: userId } }))?.email ? `Guest Email: ${guestEmail}` : null,
          guestPhone ? `Guest Phone: ${guestPhone}` : null,
          arrivalTime ? `Arrival Time: ${arrivalTime}` : null,
          specialRequests || null,
        ].filter(Boolean).join('\n'),
        status: "PENDING",
      },
    });

    // Redirect to payment page
    return redirect(`/booking/payment?bookingId=${booking.id}`);

  } catch (error) {
    console.error("Booking creation error:", error);
    return json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export default function GuestDetails() {
  const { user, accommodation, bookingParams } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [guestName, setGuestName] = useState(user?.name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "");

  // Calculate pricing
  const checkInDate = new Date(bookingParams.checkIn);
  const checkOutDate = new Date(bookingParams.checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const subtotal = accommodation.pricePerNight * nights;
  const taxes = subtotal * 0.15;
  const serviceFee = 500;
  const total = subtotal + taxes + serviceFee;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to={`/accommodations/${bookingParams.accommodationId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#01502E] mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to property
        </Link>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="flex items-center text-[#01502E]">
                <div className="flex items-center justify-center w-10 h-10 bg-[#01502E] text-white rounded-full font-semibold">
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Guest Details</span>
              </div>
              <div className="w-24 h-1 bg-gray-300 mx-4"></div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-white rounded-full font-semibold">
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Payment</span>
              </div>
              <div className="w-24 h-1 bg-gray-300 mx-4"></div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-white rounded-full font-semibold">
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Confirmation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guest Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Details</h2>

              {/* Error Message */}
              {actionData?.error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">{actionData.error}</p>
                  </div>
                </div>
              )}

              <Form method="post" className="space-y-6">
                {/* Hidden fields */}
                <input type="hidden" name="accommodationId" value={bookingParams.accommodationId} />
                <input type="hidden" name="checkIn" value={bookingParams.checkIn} />
                <input type="hidden" name="checkOut" value={bookingParams.checkOut} />
                <input type="hidden" name="guests" value={bookingParams.guests} />

                {/* Primary Guest Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Guest Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="guestName"
                          name="guestName"
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="guestEmail"
                          name="guestEmail"
                          type="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guestPhone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="guestPhone"
                          name="guestPhone"
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                          placeholder="+92 XXX XXXXXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Arrival Time
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="arrivalTime"
                          name="arrivalTime"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                        >
                          <option value="">Select arrival time</option>
                          <option value="15:00-18:00">3:00 PM - 6:00 PM</option>
                          <option value="18:00-21:00">6:00 PM - 9:00 PM</option>
                          <option value="21:00-00:00">9:00 PM - 12:00 AM</option>
                          <option value="00:00-03:00">12:00 AM - 3:00 AM</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      rows={4}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition resize-none"
                      placeholder="Any special requests or requirements? (e.g., late check-in, room preferences, accessibility needs)"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Special requests are subject to availability and may incur additional charges.
                  </p>
                </div>

                {/* Important Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Important Information</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Check-in time: After 3:00 PM</li>
                    <li>• Check-out time: Before 11:00 AM</li>
                    <li>• Valid ID required at check-in</li>
                    <li>• Smoking is not permitted in rooms</li>
                  </ul>
                </div>

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </Form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Booking Summary</h3>

              {/* Property Info */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">{accommodation.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {accommodation.city}, {accommodation.country}
                </p>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">
                    {checkInDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">
                    {checkOutDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">{bookingParams.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-medium">{nights}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    PKR {accommodation.pricePerNight.toLocaleString()} × {nights} nights
                  </span>
                  <span className="font-medium">PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes (15%)</span>
                  <span className="font-medium">PKR {taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">PKR {serviceFee.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-[#01502E]">
                    PKR {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
