import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "~/components/ui/calendar";
import { DatePicker } from "~/components/ui/date-picker";
// import { Separator } from "~/components/ui/separator";
// import { Checkbox } from "~/components/ui/checkbox";
// import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, MapPin, Users, Wifi, Car, Coffee, Shield, Star } from "lucide-react";
import { blockServiceDates } from "~/lib/utils/calendar.server";
import { createAndDispatchNotification } from "~/lib/notifications.server";
import { publishToUser } from "~/lib/realtime.server";
import { sendEmail } from "~/lib/email/email.server";
import { calculateCommission, createCommission } from "~/lib/utils/commission.server";
import { checkDateRangeAvailability } from "~/lib/availability.server";
import type { PaymentMethod } from "@prisma/client";

// Helper function to generate confirmation code
function generateConfirmationCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `CONF${timestamp}${random}`.toUpperCase();
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;
  
  if (!propertyId) {
    throw new Response("Property ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const checkIn = url.searchParams.get("checkIn");
  const checkOut = url.searchParams.get("checkOut");
  const guests = url.searchParams.get("guests");
  const adults = parseInt(url.searchParams.get("adults") || "2");
  const children = parseInt(url.searchParams.get("children") || "0");
  const roomId = url.searchParams.get("roomId") || url.searchParams.get("roomTypeId") || undefined;

  // Log for debugging
  console.log('🔵 [Book Property Loader] Request:', {
    method: request.method,
    propertyId,
    roomId,
    checkIn,
    checkOut,
    guests,
    url: url.toString()
  });

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      unavailableDates: {
        where: {
          startDate: { gte: new Date() },
        },
        orderBy: {
          startDate: "asc",
        },
      },
    },
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  // Validate required parameters
  // During form submissions, Remix re-fetches the loader via .data endpoint
  // If params are missing, return minimal data instead of throwing
  if (!roomId || !checkIn || !checkOut) {
    console.log('⚠️ [Book Property Loader] Missing params, returning minimal data:', { 
      roomId, checkIn, checkOut, method: request.method, 
      url: url.toString(),
      hasRoomId: !!roomId,
      hasCheckIn: !!checkIn,
      hasCheckOut: !!checkOut
    });
    return json({
      property,
      isAvailable: false,
      pricingBreakdown: {
        roomRate: 0,
        totalRoomCost: 0,
        cleaningFee: 0,
        serviceFee: 0,
        taxAmount: 0,
        totalAmount: 0,
        numberOfNights: 0,
      },
      totalPrice: 0,
      nights: 0,
      searchParams: { checkIn: checkIn || "", checkOut: checkOut || "", guests: parseInt(guests || "1"), roomTypeId: roomId || "" },
      availabilityPreview: {},
      pricePreview: {},
      suggestedRange: null,
    });
  }

  // Fetch specific room
  const room = await prisma.roomType.findUnique({
    where: { id: roomId }
  });

  if (!room || room.propertyId !== propertyId) {
    console.error('❌ [Book Property Loader] Room not found:', { roomId, propertyId, roomExists: !!room, roomPropertyId: room?.propertyId });
    throw new Response("Room not found or does not belong to this property", { status: 404 });
  }

  // Check availability for the requested dates
  let isAvailable = true;
  let availableUnits = room.totalUnits || 1;
  let conflictingBookings: any[] = [];

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Validate dates
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      console.error('❌ [Book Property Loader] Invalid date range:', { checkIn, checkOut, checkInDate, checkOutDate });
      throw new Response("Invalid date range", { status: 400 });
    }
    
    // Check for conflicting bookings for this specific room
    conflictingBookings = await prisma.propertyBooking.findMany({
      where: {
        roomTypeId: room.id,
        status: { not: 'CANCELLED' },
        OR: [
          {
            checkIn: {
              gte: checkInDate,
              lt: checkOutDate
            }
          },
          {
            checkOut: {
              gt: checkInDate,
              lte: checkOutDate
            }
          },
          {
            AND: [
              { checkIn: { lte: checkInDate } },
              { checkOut: { gte: checkOutDate } }
            ]
          }
        ],
      },
    });

    const bookedUnits = conflictingBookings.length;
    availableUnits = (room.totalUnits || 1) - bookedUnits;
    isAvailable = availableUnits > 0;

    // Check unavailable dates
    const unavailablePeriods = property.unavailableDates.filter(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return (
        (periodStart <= checkOutDate && periodEnd >= checkInDate)
      );
    });

    isAvailable = isAvailable && unavailablePeriods.length === 0;
  }

  if (!isAvailable || availableUnits < 1) {
    console.error('❌ [Book Property Loader] Room not available:', { 
      isAvailable, 
      availableUnits, 
      totalUnits: room.totalUnits,
      conflictingBookings: conflictingBookings.length,
      checkIn,
      checkOut
    });
    throw new Response("Room not available for selected dates", { status: 400 });
  }

  // Calculate pricing
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const roomRate = room.basePrice;
  const totalRoomCost = roomRate * numberOfNights;
  const cleaningFee = property.cleaningFee || 0;
  const serviceFee = property.serviceFee || (totalRoomCost * 0.10); // 10% service fee if not set
  const taxAmount = (totalRoomCost + cleaningFee + serviceFee) * ((property.taxRate || 8) / 100); // 8% tax default
  const totalAmount = totalRoomCost + cleaningFee + serviceFee + taxAmount;

  const pricingBreakdown = {
    roomRate,
    numberOfNights,
    totalRoomCost,
    cleaningFee,
    serviceFee,
    taxAmount,
    totalAmount
  };

  return json({
    property,
    room,
    isAvailable,
    availableUnits,
    conflictingBookings,
    pricingBreakdown,
    totalPrice: totalAmount,
    nights: numberOfNights,
    searchParams: {
      checkIn,
      checkOut,
      adults,
      children,
      guests: adults + children,
      roomId: room.id,
    },
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;
  
  if (!propertyId) {
    return json({ error: "Property ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "createBooking") {
    const checkIn = formData.get("checkIn") as string;
    const checkOut = formData.get("checkOut") as string;
    const roomId = (formData.get("roomId") || formData.get("roomTypeId")) as string;
    const adults = parseInt(formData.get("adults") as string);
    const children = parseInt(formData.get("children") as string) || 0;
    const guestName = formData.get("guestName") as string;
    const guestEmail = formData.get("guestEmail") as string;
    const guestPhone = formData.get("guestPhone") as string;
    const specialRequests = formData.get("specialRequests") as string;
    const roomRate = parseFloat(formData.get("roomRate") as string);
    const totalRoomCost = parseFloat(formData.get("totalRoomCost") as string);
    const cleaningFee = parseFloat(formData.get("cleaningFee") as string);
    const serviceFee = parseFloat(formData.get("serviceFee") as string);
    const taxAmount = parseFloat(formData.get("taxAmount") as string);
    const totalAmount = parseFloat(formData.get("totalAmount") as string);

    if (!checkIn || !checkOut || !roomId || !guestName || !guestEmail || !guestPhone) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Verify room exists and belongs to property
    const room = await prisma.roomType.findUnique({
      where: { id: roomId }
    });

    if (!room || room.propertyId !== propertyId) {
      return json({ error: "Room not found or invalid" }, { status: 404 });
    }

    // CRITICAL: Final availability check before creating booking
    const finalAvailabilityCheck = await checkDateRangeAvailability(
      roomId,
      checkInDate,
      checkOutDate,
      1 // Check for 1 room
    );

    if (!finalAvailabilityCheck.isAvailable) {
      // Someone booked it while user was filling form - return detailed conflict info
      return json({
        error: 'BOOKING_CONFLICT',
        message: 'Sorry, this room was just booked by another guest. Please select different dates.',
        conflicts: finalAvailabilityCheck.conflicts,
        reason: finalAvailabilityCheck.reason
      }, { status: 409 }); // 409 Conflict status
    }

    // Generate booking identifiers
    const bookingNumber = `PB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const confirmationCode = generateConfirmationCode();

    const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    try {
      // Use database transaction to prevent race conditions
      const booking = await prisma.$transaction(async (tx) => {
        // Double-check availability within transaction to prevent race conditions
        const transactionAvailabilityCheck = await checkDateRangeAvailability(
          roomId,
          checkInDate,
          checkOutDate,
          1
        );

        if (!transactionAvailabilityCheck.isAvailable) {
          throw new Error('ROOM_FULLY_BOOKED');
        }

        // Create booking within transaction
        return await tx.propertyBooking.create({
          data: {
            bookingNumber,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            numberOfNights,
            adults,
            children,
            roomRate,
            totalRoomCost,
            cleaningFee,
            serviceFee,
            taxAmount,
            totalAmount,
            currency: room.currency || 'PKR',
            status: "PENDING_PAYMENT",
            paymentStatus: "PENDING",
            guestName,
            guestEmail,
            guestPhone,
            specialRequests,
            userId,
            propertyId,
            roomTypeId: roomId,
          },
          include: {
            property: {
              select: {
                name: true,
                address: true,
                city: true,
                country: true,
                ownerId: true,
                owner: {
                  include: {
                    user: { select: { id: true, name: true, email: true } },
                  },
                },
              },
            },
            roomType: true,
          },
        });
      }, {
        timeout: 10000 // 10 second timeout
      });

      // 1) Create a pending payment record (will be updated on payment step)
      const pendingTxnId = `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await prisma.payment.create({
        data: {
          amount: booking.totalPrice,
          currency: booking.currency,
          method: "CREDIT_CARD" as PaymentMethod, // default placeholder, updated later
          transactionId: pendingTxnId,
          status: "PENDING",
          userId,
          bookingId: booking.id,
          bookingType: "property",
        },
      });

      // 2) Block availability immediately so other customers can't double-book
      // Only block entire property for base bookings (no specific room type)
      try {
        if (!booking.roomTypeId) {
          await blockServiceDates(
            propertyId,
            "property",
            checkInDate,
            checkOutDate,
            "booked",
            booking.property.ownerId
          );
        }
      } catch (e) {
        console.error("Failed to block dates for property booking", e);
      }

      // 3) Notify provider (PROPERTY_OWNER) and customer (pending confirmation)
      const providerUserId = booking.property.owner?.user?.id;
      if (providerUserId) {
        await createAndDispatchNotification({
          userId: providerUserId,
          userRole: "PROPERTY_OWNER",
          type: "BOOKING_CONFIRMED",
          title: "New Booking Received",
          message: `You have a new property booking (#${booking.bookingNumber}). Status: Pending payment`,
          actionUrl: `/dashboard/bookings/${booking.id}?type=property`,
          data: {
            bookingId: booking.id,
            bookingType: "property",
            bookingNumber: booking.bookingNumber,
            serviceName: booking.property.name,
          },
          priority: "HIGH",
        });
      }

      await createAndDispatchNotification({
        userId,
        userRole: "CUSTOMER",
        type: "BOOKING_CONFIRMED",
        title: "Booking Created",
        message: `Your booking for ${booking.property.name} is created. Please complete payment to confirm.`,
        actionUrl: `/book/payment/${booking.id}?type=property`,
        data: {
          bookingId: booking.id,
          bookingType: "property",
          bookingNumber: booking.bookingNumber,
          serviceName: booking.property.name,
        },
        priority: "HIGH",
      });

      // 4) Pre-calculate commission for provider (status stays PENDING)
      try {
        const calc = await calculateCommission(
          booking.id,
          "property",
          propertyId,
          booking.property.ownerId, // providerId
          booking.totalPrice
        );
        await createCommission(calc, booking.property.ownerId); // Pass propertyOwnerId
      } catch (e) {
        console.error("Failed to create commission for property booking", e);
      }

      // 5) Revalidation hints via SSE messages
      try {
        publishToUser(userId, "message", {
          type: "revalidate",
          reason: "booking-created",
          paths: ["/dashboard", "/dashboard/bookings"],
          bookingId: booking.id,
          bookingType: "property",
        });
        if (providerUserId) {
          publishToUser(providerUserId, "message", {
            type: "revalidate",
            reason: "new-booking",
            paths: ["/dashboard/provider"],
            bookingId: booking.id,
            bookingType: "property",
          });
        }
      } catch {}

      // 6) Emails (simple): customer and provider
      try {
        if (guestEmail) {
          await sendEmail({
            to: guestEmail,
            subject: `Complete your booking for ${booking.property.name} (Pending Payment)`,
            html: `<p>Hi ${guestName || "there"},</p>
                   <p>Your booking <strong>#${booking.bookingNumber}</strong> for <strong>${booking.property.name}</strong> was created and is pending payment.</p>
                   <p>Please complete payment to confirm your reservation.</p>
                   <p><a href="${process.env.APP_URL || ""}/book/payment/${booking.id}?type=property">Pay now</a></p>`,
          });
        }
        if (providerUserId && booking.property.owner?.user?.email) {
          await sendEmail({
            to: booking.property.owner.user.email,
            subject: `New booking received (#${booking.bookingNumber})`,
            html: `<p>You have a new property booking for <strong>${booking.property.name}</strong>.</p>
                   <p>Status: Pending payment</p>
                   <p><a href="${process.env.APP_URL || ""}/dashboard/provider">Open dashboard</a></p>`,
          });
        }
      } catch {}

      return redirect(`/book/payment/${booking.id}?type=property`);
    } catch (error: any) {
      console.error("Error creating booking:", error);

      // Handle specific booking conflict errors
      if (error.message === 'ROOM_FULLY_BOOKED') {
        return json({
          error: 'BOOKING_CONFLICT',
          message: 'This room was just booked by another guest. Please select different dates.',
          conflicts: [],
          reason: 'Room became unavailable during booking process'
        }, { status: 409 });
      }

      return json({ error: "Failed to create booking. Please try again." }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function PropertyBooking() {
  const { property, isAvailable, pricingBreakdown, totalPrice, nights, searchParams, availabilityPreview, pricePreview, suggestedRange } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();

  const [selectedDates, setSelectedDates] = useState({
    checkIn: searchParams.checkIn || "",
    checkOut: searchParams.checkOut || "",
  });
  const [guests, setGuests] = useState(searchParams.guests || 1);
  const [adults, setAdults] = useState(searchParams.guests || 1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [guestDetails, setGuestDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [specialRequests, setSpecialRequests] = useState("");
  const [insurance, setInsurance] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(searchParams.roomTypeId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [rangeWarning, setRangeWarning] = useState<string | null>(null);
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    searchParams.checkIn ? new Date(searchParams.checkIn) : undefined
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    searchParams.checkOut ? new Date(searchParams.checkOut) : undefined
  );

  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (!selectedDates.checkIn && !selectedDates.checkOut && suggestedRange) {
      setSelectedDates({ checkIn: suggestedRange.checkIn, checkOut: suggestedRange.checkOut });
    }
  }, [suggestedRange]);

  useEffect(() => {
    if (!roomTypeId || !selectedDates.checkIn || !selectedDates.checkOut) { setRangeWarning(null); return; }
    const start = new Date(selectedDates.checkIn);
    const end = new Date(selectedDates.checkOut);
    const probe = new Date(start);
    let ok = true;
    while (probe < end) {
      const key = probe.toISOString().split('T')[0];
      if ((availabilityPreview?.[key] ?? 0) <= 0) { ok = false; break; }
      probe.setDate(probe.getDate() + 1);
    }
    setRangeWarning(ok ? null : 'Selected dates include fully booked nights. Please adjust or use the suggested range.');
  }, [roomTypeId, selectedDates, availabilityPreview]);
  const handleDateSelect = (field: "checkIn" | "checkOut", date: Date | undefined) => {
    const iso = date ? date.toISOString().split("T")[0] : "";
    setSelectedDates(prev => ({ ...prev, [field]: iso }));
    if (field === "checkIn") {
      setCheckInDate(date || undefined);
      if (date && checkOutDate && date >= checkOutDate) {
        setCheckOutDate(undefined);
        setSelectedDates(prev => ({ ...prev, checkOut: "" }));
      }
    } else {
      setCheckOutDate(date || undefined);
    }
  };

  const handleGuestChange = (field: string, value: number) => {
    if (field === "guests") {
      setGuests(value);
      setAdults(Math.max(1, value - children - infants));
    } else if (field === "adults") {
      setAdults(value);
      setGuests(value + children + infants);
    } else if (field === "children") {
      setChildren(value);
    } else if (field === "infants") {
      setInfants(value);
    }
  };

  const updateUrl = () => {
    const newSearchParams = new URLSearchParams(searchParamsUrl);
    if (selectedDates.checkIn) newSearchParams.set("checkIn", selectedDates.checkIn);
    if (selectedDates.checkOut) newSearchParams.set("checkOut", selectedDates.checkOut);
    newSearchParams.set("guests", guests.toString());
    if (roomTypeId) newSearchParams.set("roomTypeId", roomTypeId);
    setSearchParamsUrl(newSearchParams);
  };

  useEffect(() => {
    updateUrl();
  }, [selectedDates, guests]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">{property.name}</CardTitle>
                    <div className="flex items-center mt-2 text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.address}, {property.city}, {property.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{property.rating.toFixed(1)}</span>
                      <span className="ml-1 text-gray-500">({property.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{property.maxGuests} guests</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{property.bedrooms} bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{property.bathrooms} bathrooms</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{property.beds} beds</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.slice(0, 8).map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 8 && (
                      <Badge variant="outline">
                        +{property.amenities.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{property.description}</p>
                </div>

                {/* Recent Reviews */}
                {property.reviews.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                      {property.reviews.map((review) => (
                        <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 font-medium">{review.reviewerName}</span>
                            <span className="ml-2 text-gray-500 text-sm">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Book Your Stay</CardTitle>
                <div className="text-2xl font-bold text-green-600">
                  {property.currency} {property.basePrice.toFixed(2)} / night
                </div>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-6">
                  {Array.isArray(property.roomTypes) && property.roomTypes.length > 0 && (
                    <div>
                      <Label>Room Type</Label>
                      <select name="roomTypeId" value={roomTypeId || ''} onChange={(e) => setRoomTypeId(e.target.value || undefined)} className="mt-2 w-full border rounded px-3 py-2">
                        <option value="">Default (Base)</option>
                        {property.roomTypes.map((rt: any) => (
                          <option key={rt.id} value={rt.id}>{rt.name} — PKR {rt.basePrice.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Availability Calendar Preview */}
                  {roomTypeId && (
                    <div>
                      <Label>Availability Preview</Label>
                      <Calendar
                        mode="single"
                        numberOfMonths={2}
                        selected={selectedDate}
                        onSelect={(d: Date | undefined) => setSelectedDate(d)}
                        disabled={(date: Date) => date < today}
                        footer={<div className="text-sm text-gray-600">Choose dates with better availability.</div>}
                        components={{
                          DayButton: ({ className, day, modifiers, ...props }: any) => {
                            const key = day.date.toISOString().split('T')[0];
                            const avail = availabilityPreview?.[key] ?? undefined;
                            const price = pricePreview?.[key];
                            let color = '';
                            if (typeof avail === 'number') {
                              color = avail <= 0 ? 'bg-red-100 text-red-700' : avail <= 1 ? 'bg-orange-100 text-orange-700' : 'bg-green-50 text-green-700';
                            }
                            return (
                              <button className={`aspect-square w-full rounded-md flex flex-col items-center justify-center ${color}`} {...props}>
                                <span>{day.date.getDate()}</span>
                                {typeof price === 'number' && (
                                  <span className="text-[10px] text-gray-700">{property.currency} {price}</span>
                                )}
                              </button>
                            );
                          }
                        }}
                      />
                    </div>
                  )}
                  {rangeWarning && (
                    <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded text-sm">{rangeWarning}</div>
                  )}
                  {/* Date Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="checkIn">Check-in Date</Label>
                      <DatePicker
                        date={checkInDate}
                        onSelect={(d) => handleDateSelect("checkIn", d)}
                        className="w-full"
                        minDate={today}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkOut">Check-out Date</Label>
                      <DatePicker
                        date={checkOutDate}
                        onSelect={(d) => handleDateSelect("checkOut", d)}
                        className="w-full"
                        minDate={checkInDate || today}
                      />
                    </div>
                  </div>
                  <input type="hidden" name="checkIn" value={selectedDates.checkIn} />
                  <input type="hidden" name="checkOut" value={selectedDates.checkOut} />
                  <input type="hidden" name="roomId" value={roomTypeId || searchParams.roomTypeId || ""} />
                  <input type="hidden" name="roomRate" value={pricingBreakdown.roomRate.toString()} />
                  <input type="hidden" name="totalRoomCost" value={pricingBreakdown.totalRoomCost.toString()} />
                  <input type="hidden" name="cleaningFee" value={pricingBreakdown.cleaningFee.toString()} />
                  <input type="hidden" name="serviceFee" value={pricingBreakdown.serviceFee.toString()} />
                  <input type="hidden" name="taxAmount" value={pricingBreakdown.taxAmount.toString()} />
                  <input type="hidden" name="totalAmount" value={(pricingBreakdown.totalAmount + (insurance ? 50 : 0)).toString()} />

                  {/* Guest Selection */}
                  <div>
                    <Label>Guests</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="adults" className="text-sm">Adults</Label>
                        <Input
                          id="adults"
                          name="adults"
                          type="number"
                          min="1"
                          max={property.maxGuests}
                          value={adults}
                          onChange={(e) => handleGuestChange("adults", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="children" className="text-sm">Children</Label>
                        <Input
                          id="children"
                          name="children"
                          type="number"
                          min="0"
                          value={children}
                          onChange={(e) => handleGuestChange("children", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label htmlFor="infants" className="text-sm">Infants</Label>
                      <Input
                        id="infants"
                        name="infants"
                        type="number"
                        min="0"
                        value={infants}
                        onChange={(e) => handleGuestChange("infants", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Guest Details */}
                  <div>
                    <Label htmlFor="guestName">Full Name</Label>
                    <Input
                      id="guestName"
                      name="guestName"
                      type="text"
                      value={guestDetails.name}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      id="guestEmail"
                      name="guestEmail"
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="guestPhone">Phone</Label>
                    <Input
                      id="guestPhone"
                      name="guestPhone"
                      type="tel"
                      value={guestDetails.phone}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requests or requirements..."
                    />
                  </div>

                  {/* Insurance Option */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="insurance"
                      name="insurance"
                      checked={insurance}
                      onChange={(e) => setInsurance(e.target.checked)}
                    />
                    <Label htmlFor="insurance" className="text-sm">
                      Add travel insurance (+{property.currency} 50)
                    </Label>
                  </div>

                  {/* Pricing Breakdown */}
                  {selectedDates.checkIn && selectedDates.checkOut && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Price Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{property.currency} {pricingBreakdown.roomRate.toFixed(2)} × {pricingBreakdown.numberOfNights} nights</span>
                          <span>{property.currency} {pricingBreakdown.totalRoomCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cleaning fee</span>
                          <span>{property.currency} {pricingBreakdown.cleaningFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service fee</span>
                          <span>{property.currency} {pricingBreakdown.serviceFee.toFixed(2)}</span>
                        </div>
                        {insurance && (
                          <div className="flex justify-between">
                            <span>Travel insurance</span>
                            <span>{property.currency} 50.00</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Taxes</span>
                          <span>{property.currency} {pricingBreakdown.taxAmount.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{property.currency} {(pricingBreakdown.totalAmount + (insurance ? 50 : 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Messages */}
                  {actionData && 'error' in actionData && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 font-medium">{actionData.message || actionData.error}</p>
                      {actionData.error === 'BOOKING_CONFLICT' && actionData.conflicts && actionData.conflicts.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Unavailable dates:</p>
                          <ul className="list-disc list-inside mt-1">
                            {actionData.conflicts.slice(0, 3).map((conflict: any, idx: number) => (
                              <li key={idx}>
                                {new Date(conflict.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {conflict.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    name="intent"
                    value="createBooking"
                    className="w-full"
                    disabled={isSubmitting || !selectedDates.checkIn || !selectedDates.checkOut}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Book Now"
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
