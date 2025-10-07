import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";
import { requireUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import {
  CreditCard,
  Building2,
  Smartphone,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");

  if (!bookingId) {
    throw redirect("/");
  }

  // Get booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      accommodation: true,
      user: true,
    },
  });

  if (!booking || booking.userId !== userId) {
    throw redirect("/");
  }

  return json({ booking });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const bookingId = formData.get("bookingId");
  const paymentMethod = formData.get("paymentMethod");

  if (typeof bookingId !== "string" || typeof paymentMethod !== "string") {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  try {
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: parseFloat(formData.get("amount") as string),
        currency: "PKR",
        method: paymentMethod as "CARD" | "CASH" | "BANK_TRANSFER",
        status: "PENDING",
        transactionId: `TXN-${Date.now()}`,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    return redirect(`/booking/confirmation/${bookingId}`);
  } catch (error) {
    return json({ error: "Payment processing failed" }, { status: 500 });
  }
}

export default function BookingPayment() {
  const { booking } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [paymentMethod, setPaymentMethod] = useState<"card" | "jazzcash" | "cash">("card");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Calculate pricing
  const subtotal = booking.totalPrice;
  const taxRate = 0.15; // 15% tax
  const taxes = subtotal * taxRate;
  const serviceFee = 500; // PKR 500 service fee
  const total = subtotal + taxes + serviceFee;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to={`/accommodations/${booking.accommodationId}`}
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
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium">Guest Details</span>
              </div>
              <div className="w-24 h-1 bg-[#01502E] mx-4"></div>
              <div className="flex items-center text-[#01502E]">
                <div className="flex items-center justify-center w-10 h-10 bg-[#01502E] text-white rounded-full font-semibold">
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
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

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
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="amount" value={total} />

                {/* Payment Method Selection */}
                <div className="space-y-4">
                  {/* Credit/Debit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full p-4 border-2 rounded-lg transition ${
                      paymentMethod === "card"
                        ? "border-[#01502E] bg-[#01502E]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className={paymentMethod === "card" ? "text-[#01502E]" : "text-gray-400"} />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                          <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                        </div>
                      </div>
                      {paymentMethod === "card" && (
                        <CheckCircle className="h-5 w-5 text-[#01502E]" />
                      )}
                    </div>
                  </button>

                  {/* JazzCash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("jazzcash")}
                    className={`w-full p-4 border-2 rounded-lg transition ${
                      paymentMethod === "jazzcash"
                        ? "border-[#01502E] bg-[#01502E]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className={paymentMethod === "jazzcash" ? "text-[#01502E]" : "text-gray-400"} />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">JazzCash</p>
                          <p className="text-sm text-gray-500">Mobile wallet payment</p>
                        </div>
                      </div>
                      {paymentMethod === "jazzcash" && (
                        <CheckCircle className="h-5 w-5 text-[#01502E]" />
                      )}
                    </div>
                  </button>

                  {/* Pay at Property */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-full p-4 border-2 rounded-lg transition ${
                      paymentMethod === "cash"
                        ? "border-[#01502E] bg-[#01502E]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className={paymentMethod === "cash" ? "text-[#01502E]" : "text-gray-400"} />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Pay at Property</p>
                          <p className="text-sm text-gray-500">Pay when you arrive</p>
                        </div>
                      </div>
                      {paymentMethod === "cash" && (
                        <CheckCircle className="h-5 w-5 text-[#01502E]" />
                      )}
                    </div>
                  </button>
                </div>

                <input type="hidden" name="paymentMethod" value={paymentMethod.toUpperCase()} />

                {/* Card Details Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900">Card Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name on card"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                )}

                {/* JazzCash Form */}
                {paymentMethod === "jazzcash" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900">JazzCash Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="03XX XXXXXXX"
                        maxLength={11}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> You will receive a payment request on your JazzCash account. Please approve it to complete the booking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="flex items-start pt-4">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-4 w-4 mt-1 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    I agree to the{" "}
                    <Link to="/terms" className="text-[#01502E] hover:text-[#013d23] font-medium">
                      booking terms & conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/cancellation-policy" className="text-[#01502E] hover:text-[#013d23] font-medium">
                      cancellation policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !acceptTerms}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      Complete Booking - PKR {total.toLocaleString()}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  Your payment is secure and encrypted
                </p>
              </Form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Booking Summary</h3>

              {/* Property Info */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">{booking.accommodation?.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.accommodation?.city}, {booking.accommodation?.country}
                </p>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">
                    {new Date(booking.checkIn).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">{booking.guests}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
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
