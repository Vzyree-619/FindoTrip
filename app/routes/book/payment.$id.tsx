import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { NotificationType, UserRole } from "@prisma/client";
import { sendBookingConfirmationEmail, sendEmail } from "~/lib/email/email.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, CreditCard, Shield, CheckCircle, Calendar, MapPin, Users, Car, Star } from "lucide-react";
import { createAndDispatchNotification } from "~/lib/notifications.server";
import type { PaymentMethod } from "@prisma/client";
import { publishToUser } from "~/lib/realtime.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id;
  
  if (!bookingId) {
    throw new Response("Booking ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const bookingType = url.searchParams.get("type");

  if (!bookingType || !["property", "vehicle", "tour"].includes(bookingType)) {
    throw new Response("Invalid booking type", { status: 400 });
  }

  let booking;
  let service;

  try {
    if (bookingType === "property") {
      booking = await prisma.propertyBooking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              city: true,
              country: true,
              images: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } else if (bookingType === "vehicle") {
      booking = await prisma.vehicleBooking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            select: {
              name: true,
              brand: true,
              model: true,
              year: true,
              type: true,
              images: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } else if (bookingType === "tour") {
      booking = await prisma.tourBooking.findUnique({
        where: { id: bookingId },
        include: {
          tour: {
            select: {
              title: true,
              type: true,
              duration: true,
              meetingPoint: true,
              city: true,
              country: true,
              images: true,
            },
          },
          guide: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }

    if (!booking) {
      throw new Response("Booking not found", { status: 404 });
    }

    // Check if booking belongs to the current user
    if (booking.userId !== userId) {
      throw new Response("Unauthorized", { status: 403 });
    }

    // Check if booking is still pending
    if (booking.status !== "PENDING") {
      throw new Response("Booking is no longer pending", { status: 400 });
    }

    // Get payment methods (in a real app, this would come from your payment provider)
    const paymentMethods = [
      { id: "stripe", name: "Stripe (Card)", icon: "💳", description: "Secure card payment" },
      { id: "jazzcash", name: "JazzCash", icon: "📱", description: "Mobile wallet payment" },
    ];

    return json({
      booking,
      bookingType,
      paymentMethods,
    });
  } catch (error) {
    console.error("Error loading booking:", error);
    throw new Response("Failed to load booking", { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id;
  
  if (!bookingId) {
    throw new Response("Booking ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  const bookingType = formData.get("bookingType") as string;

  if (intent === "startPayment") {
    const paymentMethod = formData.get("paymentMethod") as string;
    const type = bookingType;
    if (!paymentMethod) return json({ error: "Payment method required" }, { status: 400 });
    if (paymentMethod === 'jazzcash') {
      return redirect(`/payment/jazzcash/${bookingId}?type=${type}`);
    }
    if (paymentMethod === 'stripe') {
      return redirect(`/payment/stripe/${bookingId}?type=${type}`);
    }
    return json({ error: "Unsupported payment method" }, { status: 400 });
  }

  if (intent === "processPayment") {
    const paymentMethod = formData.get("paymentMethod") as string;
    const cardNumber = formData.get("cardNumber") as string;
    const expiryDate = formData.get("expiryDate") as string;
    const cvv = formData.get("cvv") as string;
    const cardholderName = formData.get("cardholderName") as string;
    const billingAddress = formData.get("billingAddress") as string;
    const billingCity = formData.get("billingCity") as string;
    const billingCountry = formData.get("billingCountry") as string;
    const billingPostalCode = formData.get("billingPostalCode") as string;

    if (!paymentMethod) {
      return json({ error: "Payment method is required" }, { status: 400 });
    }

    // Get booking details
    let booking;
    if (bookingType === "property") {
      booking = await prisma.propertyBooking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              city: true,
              country: true,
              ownerId: true,
              owner: { select: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      });
    } else if (bookingType === "vehicle") {
      booking = await prisma.vehicleBooking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            select: {
              name: true,
              brand: true,
              model: true,
              year: true,
              type: true,
              ownerId: true,
              owner: { select: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
          user: { select: { name: true, email: true } },
        },
      });
    } else if (bookingType === "tour") {
      booking = await prisma.tourBooking.findUnique({
        where: { id: bookingId },
        include: {
          tour: {
            select: {
              title: true,
              type: true,
              duration: true,
              meetingPoint: true,
              city: true,
              country: true,
              guideId: true,
              guide: { select: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
          user: { select: { name: true, email: true } },
        },
      });
    }

    if (!booking) {
      return json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "PENDING") {
      return json({ error: "Booking is no longer pending" }, { status: 400 });
    }

    try {
      // Generate transaction ID and map payment method
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const mapPaymentMethod = (pm: string): PaymentMethod => {
        switch (pm) {
          case "stripe":
            return "CREDIT_CARD" as PaymentMethod;
          case "paypal":
            return "MOBILE_WALLET" as PaymentMethod;
          case "bank_transfer":
            return "BANK_TRANSFER" as PaymentMethod;
          default:
            return "CREDIT_CARD" as PaymentMethod;
        }
      };

      // Find existing pending payment for this booking
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId, bookingType, userId, status: "PENDING" },
      });

      const methodMapped = mapPaymentMethod(paymentMethod);

      // Stripe intent placeholder
      if (paymentMethod === 'stripe' && process.env.STRIPE_SECRET) {
        // In a real implementation:
        // const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET);
        // const intent = await stripe.paymentIntents.create({ amount: Math.round(booking.totalPrice * 100), currency: booking.currency.toLowerCase() });
        // Save intent.id and client_secret in Payment.gatewayResponse
      }

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            method: methodMapped,
            transactionId,
            status: "COMPLETED",
            paymentGateway: paymentMethod,
            gatewayResponse: { success: true, transactionId, timestamp: new Date().toISOString() },
            paidAt: new Date(),
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            amount: booking.totalPrice,
            currency: booking.currency,
            method: methodMapped,
            transactionId,
            status: "COMPLETED",
            paymentGateway: paymentMethod,
            gatewayResponse: { success: true, transactionId, timestamp: new Date().toISOString() },
            paidAt: new Date(),
            userId,
            bookingId,
            bookingType,
          },
        });
      }

      // Update booking status
      if (bookingType === "property") {
        await prisma.propertyBooking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
          },
        });
      } else if (bookingType === "vehicle") {
        await prisma.vehicleBooking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
          },
        });
      } else if (bookingType === "tour") {
        await prisma.tourBooking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
          },
        });
      }

      // Avoid duplicate availability blocks (already created at booking time). Create only if missing.
      if (bookingType === "property" && "propertyId" in booking && "property" in booking) {
        const exists = await prisma.unavailableDate.findFirst({
          where: {
            serviceId: booking.propertyId,
            serviceType: "property",
            startDate: booking.checkIn,
            endDate: booking.checkOut,
            type: "booked",
          },
        });
        if (!exists) {
          await prisma.unavailableDate.create({
            data: {
              serviceId: booking.propertyId,
              serviceType: "property",
              startDate: booking.checkIn,
              endDate: booking.checkOut,
              type: "booked",
              ownerId: booking.property.ownerId,
            },
          });
        }
      } else if (bookingType === "vehicle" && "vehicleId" in booking && "vehicle" in booking) {
        const exists = await prisma.unavailableDate.findFirst({
          where: {
            serviceId: booking.vehicleId,
            serviceType: "vehicle",
            startDate: booking.startDate,
            endDate: booking.endDate,
            type: "booked",
          },
        });
        if (!exists) {
          await prisma.unavailableDate.create({
            data: {
              serviceId: booking.vehicleId,
              serviceType: "vehicle",
              startDate: booking.startDate,
              endDate: booking.endDate,
              type: "booked",
              ownerId: booking.vehicle.ownerId,
            },
          });
        }
      } else if (bookingType === "tour" && "tourId" in booking && "tour" in booking) {
        const exists = await prisma.unavailableDate.findFirst({
          where: {
            serviceId: booking.tourId,
            serviceType: "tour",
            startDate: booking.tourDate,
            endDate: booking.tourDate,
            type: "booked",
          },
        });
        if (!exists) {
          await prisma.unavailableDate.create({
            data: {
              serviceId: booking.tourId,
              serviceType: "tour",
              startDate: booking.tourDate,
              endDate: booking.tourDate,
              type: "booked",
              ownerId: booking.tour.guideId,
            },
          });
        }
      }

      // Ensure a single commission record exists (was pre-created at booking time)
      let providerId: string | undefined;
      let providerUserIdX: string | undefined;
      let serviceId: string | undefined;
      if (bookingType === "property" && "property" in booking) {
        providerId = booking.property.ownerId;
        providerUserIdX = booking.property.owner?.user?.id;
        serviceId = booking.propertyId;
      } else if (bookingType === "vehicle" && "vehicle" in booking) {
        providerId = booking.vehicle.ownerId;
        providerUserIdX = booking.vehicle.owner?.user?.id;
        serviceId = booking.vehicleId;
      } else if (bookingType === "tour" && "tour" in booking) {
        providerId = booking.tour.guideId;
        providerUserIdX = booking.tour.guide?.user?.id;
        serviceId = booking.tourId;
      }

      if (providerId && serviceId) {
        const existingCommission = await prisma.commission.findFirst({
          where: { bookingId, bookingType },
        });
        if (!existingCommission) {
          const commissionRate = 0.1;
          const commissionAmount = booking.totalPrice * commissionRate;
          await prisma.commission.create({
            data: {
              amount: commissionAmount,
              percentage: commissionRate * 100,
              currency: booking.currency,
              status: "PENDING",
              bookingId,
              bookingType,
              serviceId,
              serviceType: bookingType,
              userId: providerUserIdX || providerId,
              calculatedAt: new Date(),
            },
          });
        }

        // Update provider total revenue
        if (bookingType === "property") {
          await prisma.propertyOwner.update({
            where: { id: providerId },
            data: { totalRevenue: { increment: booking.totalPrice } },
          });
        } else if (bookingType === "vehicle") {
          await prisma.vehicleOwner.update({
            where: { id: providerId },
            data: { totalRevenue: { increment: booking.totalPrice } },
          });
        } else if (bookingType === "tour") {
          await prisma.tourGuide.update({
            where: { id: providerId },
            data: { totalRevenue: { increment: booking.totalPrice } },
          });
        }
      }

      // Real-time notifications via SSE
      const providerUserId =
        bookingType === "property" && "property" in booking ? booking.property.owner?.user?.id :
        bookingType === "vehicle" && "vehicle" in booking ? booking.vehicle.owner?.user?.id :
        bookingType === "tour" && "tour" in booking ? booking.tour.guide?.user?.id :
        undefined;

      await createAndDispatchNotification({
        userId,
        userRole: "CUSTOMER",
        type: "BOOKING_CONFIRMED",
        title: "Booking Confirmed!",
        message: `Your ${bookingType} booking has been confirmed. Booking number: ${booking.bookingNumber}`,
        actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
        data: { bookingId, bookingType, bookingNumber: booking.bookingNumber },
        priority: "HIGH",
      });

      if (providerUserId) {
        await createAndDispatchNotification({
          userId: providerUserId,
          userRole:
            bookingType === "property" ? "PROPERTY_OWNER" :
            bookingType === "vehicle" ? "VEHICLE_OWNER" : "TOUR_GUIDE",
          type: "PAYMENT_RECEIVED",
          title: "Payment Received!",
          message: `Payment received for booking #${booking.bookingNumber}.`,
          actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
          data: { bookingId, bookingType, bookingNumber: booking.bookingNumber, amount: booking.totalPrice, currency: booking.currency },
          priority: "HIGH",
        });
      }

      // Revalidation hints
      try {
        publishToUser(userId, "message", {
          type: "revalidate",
          reason: "payment-confirmed",
          paths: ["/dashboard", "/dashboard/bookings"],
          bookingId,
          bookingType,
        });
        if (providerUserId) {
          publishToUser(providerUserId, "message", {
            type: "revalidate",
            reason: "payment-received",
            paths: [
              bookingType === "property" ? "/dashboard/provider" :
              bookingType === "vehicle" ? "/dashboard/vehicle-owner" : "/dashboard/guide"
            ],
            bookingId,
            bookingType,
          });
        }
      } catch {}

      // Update service statistics
      if (bookingType === "property" && "property" in booking) {
        await prisma.property.update({
          where: { id: booking.propertyId },
          data: {
            totalBookings: { increment: 1 },
          },
        });
      } else if (bookingType === "vehicle" && "vehicle" in booking) {
        await prisma.vehicle.update({
          where: { id: booking.vehicleId },
          data: {
            totalBookings: { increment: 1 },
          },
        });
      } else if (bookingType === "tour" && "tour" in booking) {
        await prisma.tour.update({
          where: { id: booking.tourId },
          data: {
            totalBookings: { increment: 1 },
          },
        });
      }

      // Send confirmation emails
      if (bookingType === "property" && "property" in booking) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
        if (user) {
          await sendBookingConfirmationEmail(
            {
              id: booking.id,
              bookingNumber: booking.bookingNumber,
              user: { name: user.name, email: user.email },
              accommodation: {
                name: booking.property.name,
                address: booking.property.address,
                city: booking.property.city,
                country: booking.property.country,
              },
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              guests: booking.guests,
              totalPrice: booking.totalPrice,
              specialRequests: booking.specialRequests || undefined,
            },
            {
              method: paymentMethod,
              transactionId,
              amount: booking.totalPrice,
            }
          );
        }
      } else {
        // Generic confirmation email for vehicle/tour
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: `Booking Confirmed - ${bookingType.toUpperCase()} | FindoTrip`,
            html: `<p>Hi ${user.name},</p>
                   <p>Your ${bookingType} booking <strong>#${booking.bookingNumber}</strong> has been confirmed.</p>
                   <p>Total Paid: ${booking.currency} ${booking.totalPrice.toFixed(2)}</p>
                   <p><a href="${process.env.APP_URL || ""}/book/confirmation/${bookingId}?type=${bookingType}">View details</a></p>`,
          });
        }
      }

      return redirect(`/book/confirmation/${bookingId}?type=${bookingType}`);
    } catch (error) {
      console.error("Error processing payment:", error);
      return json({ error: "Payment processing failed. Please try again." }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function PaymentPage() {
  const { booking, bookingType, paymentMethods } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("stripe");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [billingDetails, setBillingDetails] = useState({
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const getServiceDetails = () => {
    if (bookingType === "property" && "property" in booking) {
      return {
        name: booking.property.name,
        location: `${booking.property.city}, ${booking.property.country}`,
        dates: `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`,
        guests: booking.guests,
        icon: "🏨",
      };
    } else if (bookingType === "vehicle" && "vehicle" in booking) {
      return {
        name: `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.year})`,
        location: `${booking.pickupLocation}`,
        dates: `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`,
        guests: "1",
        icon: "🚗",
      };
    } else if (bookingType === "tour" && "tour" in booking) {
      return {
        name: booking.tour.title,
        location: `${booking.tour.meetingPoint}, ${booking.tour.city}`,
        dates: `${new Date(booking.tourDate).toLocaleDateString()} at ${booking.timeSlot}`,
        guests: booking.participants,
        icon: "🎯",
      };
    }
    return null;
  };

  const serviceDetails = getServiceDetails();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {serviceDetails && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{serviceDetails.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{serviceDetails.name}</h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{serviceDetails.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm">{serviceDetails.dates}</span>
                        </div>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm">{serviceDetails.guests} {serviceDetails.guests === "1" ? "person" : "people"}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Booking Number</span>
                        <span className="font-mono">{booking.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Booking Type</span>
                        <Badge variant="outline" className="capitalize">{bookingType}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge variant="secondary">{booking.status}</Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold">Price Breakdown</h4>
                      {bookingType === "property" && "property" in booking && (
                        <>
                          <div className="flex justify-between">
                            <span>Base price</span>
                            <span>{booking.currency} {booking.basePrice.toFixed(2)}</span>
                          </div>
                          {booking.cleaningFee > 0 && (
                            <div className="flex justify-between">
                              <span>Cleaning fee</span>
                              <span>{booking.currency} {booking.cleaningFee.toFixed(2)}</span>
                            </div>
                          )}
                          {booking.serviceFee > 0 && (
                            <div className="flex justify-between">
                              <span>Service fee</span>
                              <span>{booking.currency} {booking.serviceFee.toFixed(2)}</span>
                            </div>
                          )}
                          {booking.taxes > 0 && (
                            <div className="flex justify-between">
                              <span>Taxes</span>
                              <span>{booking.currency} {booking.taxes.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      {bookingType === "vehicle" && "vehicle" in booking && (
                        <>
                          <div className="flex justify-between">
                            <span>Base price</span>
                            <span>{booking.currency} {booking.basePrice.toFixed(2)}</span>
                          </div>
                          {booking.driverFee > 0 && (
                            <div className="flex justify-between">
                              <span>Driver fee</span>
                              <span>{booking.currency} {booking.driverFee.toFixed(2)}</span>
                            </div>
                          )}
                          {booking.insuranceFee > 0 && (
                            <div className="flex justify-between">
                              <span>Insurance fee</span>
                              <span>{booking.currency} {booking.insuranceFee.toFixed(2)}</span>
                            </div>
                          )}
                          {booking.securityDeposit > 0 && (
                            <div className="flex justify-between">
                              <span>Security deposit</span>
                              <span>{booking.currency} {booking.securityDeposit.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      {bookingType === "tour" && "tour" in booking && (
                        <>
                          <div className="flex justify-between">
                            <span>Price per person</span>
                            <span>{booking.currency} {booking.pricePerPerson.toFixed(2)}</span>
                          </div>
                          {booking.childDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Child discount</span>
                              <span>-{booking.currency} {booking.childDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          {booking.groupDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Group discount</span>
                              <span>-{booking.currency} {booking.groupDiscount.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{booking.currency} {booking.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-6">
                  <input type="hidden" name="bookingType" value={bookingType} />

                  {/* Payment Method Selection */}
                  <div>
                    <Label>Payment Method</Label>
                    <div className="space-y-3 mt-2">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedPaymentMethod === method.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={() => setSelectedPaymentMethod(method.id)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-xl">{method.icon}</span>
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-gray-600">{method.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Details */}
                  {selectedPaymentMethod === "stripe" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={cardDetails.expiryDate}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                            maxLength={5}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            type="text"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          name="cardholderName"
                          type="text"
                          placeholder="John Doe"
                          value={cardDetails.cardholderName}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Billing Address</h4>
                    <div>
                      <Label htmlFor="billingAddress">Address</Label>
                      <Input
                        id="billingAddress"
                        name="billingAddress"
                        type="text"
                        value={billingDetails.address}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          name="billingCity"
                          type="text"
                          value={billingDetails.city}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingPostalCode">Postal Code</Label>
                        <Input
                          id="billingPostalCode"
                          name="billingPostalCode"
                          type="text"
                          value={billingDetails.postalCode}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, postalCode: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="billingCountry">Country</Label>
                      <Input
                        id="billingCountry"
                        name="billingCountry"
                        type="text"
                        value={billingDetails.country}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, country: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked: boolean) => setAgreeToTerms(checked)}
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm">
                      I agree to the{" "}
                      <a href="/terms" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      Your payment information is encrypted and secure.
                    </span>
                  </div>

                  {/* Error Messages */}
                  {actionData?.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{actionData.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    name="intent"
                    value="processPayment"
                    className="w-full"
                    disabled={isSubmitting || !agreeToTerms}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay {booking.currency} {booking.totalPrice.toFixed(2)}
                      </>
                    )}
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
