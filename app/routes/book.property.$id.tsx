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
// import { Separator } from "~/components/ui/separator";
// import { Checkbox } from "~/components/ui/checkbox";
// import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, MapPin, Users, Wifi, Car, Coffee, Shield, Star } from "lucide-react";
import { blockServiceDates } from "~/lib/utils/calendar.server";
import { createAndDispatchNotification } from "~/lib/notifications.server";
import { publishToUser } from "~/lib/realtime.server";
import { sendEmail } from "~/lib/email/email.server";
import { calculateCommission, createCommission } from "~/lib/utils/commission.server";
import type { PaymentMethod } from "@prisma/client";

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
  const roomTypeId = url.searchParams.get("roomTypeId") || undefined;

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

  // Check availability for the requested dates
  let isAvailable = true;
  let conflictingBookings: any[] = [];

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Check for conflicting bookings
    conflictingBookings = await prisma.propertyBooking.findMany({
      where: {
        propertyId: property.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          },
        ],
      },
    });

    // Check unavailable dates
    const unavailablePeriods = property.unavailableDates.filter(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return (
        (periodStart <= checkOutDate && periodEnd >= checkInDate)
      );
    });

    isAvailable = conflictingBookings.length === 0 && unavailablePeriods.length === 0;
  }

  // Calculate pricing
  let totalPrice = 0;
  let nights = 0;
  let pricingBreakdown = {
    basePrice: 0,
    cleaningFee: property.cleaningFee,
    serviceFee: property.serviceFee,
    taxes: 0,
    total: 0,
  };

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const basePerNight = roomTypeId ? (property.roomTypes || []).find(rt => rt.id === roomTypeId)?.basePrice ?? property.basePrice : property.basePrice;
    pricingBreakdown.basePrice = basePerNight * nights;
    pricingBreakdown.taxes = (pricingBreakdown.basePrice + pricingBreakdown.cleaningFee + pricingBreakdown.serviceFee) * (property.taxRate / 100);
    pricingBreakdown.total = pricingBreakdown.basePrice + pricingBreakdown.cleaningFee + pricingBreakdown.serviceFee + pricingBreakdown.taxes;
    totalPrice = pricingBreakdown.total;
  }

  const availabilityPreview = {};
  if (roomTypeId) {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate() + 60);
    const cursor = new Date(start);
    while (cursor <= end) {
      const dayStart = new Date(cursor);
      const dayEnd = new Date(cursor); dayEnd.setHours(23,59,59,999);
      const inv = await prisma.roomInventoryDaily.findFirst({ where: { roomTypeId, date: dayStart } });
      let capacity = 0;
      if (inv && typeof inv.available === 'number') capacity = inv.available; else {
        const rt = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
        capacity = rt?.inventory || 1;
      }
      const booked = await prisma.propertyBooking.count({ where: { propertyId, roomTypeId, status: { in: ['CONFIRMED','PENDING'] }, checkIn: { lte: dayEnd }, checkOut: { gte: dayStart } } });
      availabilityPreview[dayStart.toISOString().split('T')[0]] = Math.max(0, capacity - booked);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return json({
    property,
    isAvailable,
    conflictingBookings,
    pricingBreakdown,
    totalPrice,
    nights,
    availabilityPreview,
    searchParams: {
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests) : 1,
      roomTypeId,
    },
  });

        if (bookedRooms >= availableRooms) {
          isAvailable = false;
          break;
        }

        dayCursor.setDate(dayCursor.getDate() + 1);
      }

      if (!isAvailable) {
        return json({ 
          error: "Selected room type is fully booked for one or more nights",
          conflictingBookings,
          unavailableDates,
        }, { status: 400 });
      }
    }

    // Calculate pricing
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        basePrice: true,
        cleaningFee: true,
        serviceFee: true,
        taxRate: true,
        
      },
    });

    if (!property) {
      return json({ error: "Property not found" }, { status: 404 });
    }

    const roomTypeId = formData.get("roomTypeId") as string | null;
    const perNight = roomTypeId
      ? (await prisma.roomType.findUnique({ where: { id: roomTypeId } }))?.basePrice ?? property.basePrice
      : property.basePrice;
    const basePrice = perNight * nights;
    const cleaningFee = property.cleaningFee;
    const serviceFee = property.serviceFee;
    const taxes = (basePrice + cleaningFee + serviceFee) * (property.taxRate / 100);
    const totalPrice = basePrice + cleaningFee + serviceFee + taxes;

    return json({
      success: true,
      isAvailable: true,
      pricingBreakdown: {
        basePrice,
        cleaningFee,
        serviceFee,
        taxes,
        total: totalPrice,
      },
      nights,
      totalPrice,
    });
  }

  if (intent === "createBooking") {
    const checkIn = formData.get("checkIn") as string;
    const checkOut = formData.get("checkOut") as string;
    const guests = parseInt(formData.get("guests") as string);
    const adults = parseInt(formData.get("adults") as string);
    const children = parseInt(formData.get("children") as string) || 0;
    const infants = parseInt(formData.get("infants") as string) || 0;
    const guestName = formData.get("guestName") as string;
    const guestEmail = formData.get("guestEmail") as string;
    const guestPhone = formData.get("guestPhone") as string;
    const specialRequests = formData.get("specialRequests") as string;
    const insurance = formData.get("insurance") === "on";

    if (!checkIn || !checkOut || !guestName || !guestEmail || !guestPhone) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get property details for pricing
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        basePrice: true,
        cleaningFee: true,
        serviceFee: true,
        taxRate: true,
        currency: true,
      },
    });

    if (!property) {
      return json({ error: "Property not found" }, { status: 404 });
    }

    // Calculate pricing
    const basePrice = property.basePrice * nights;
    const cleaningFee = property.cleaningFee;
    const serviceFee = property.serviceFee;
    const insuranceFee = insurance ? 50 : 0; // Add insurance fee if selected
    const taxes = (basePrice + cleaningFee + serviceFee + insuranceFee) * (property.taxRate / 100);
    const totalPrice = basePrice + cleaningFee + serviceFee + insuranceFee + taxes;

    // Generate booking number
    const bookingNumber = `PB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      const booking = await prisma.propertyBooking.create({
        data: {
          bookingNumber,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests,
          adults,
          children,
          infants,
          basePrice,
          cleaningFee,
          serviceFee,
          taxes,
          discounts: 0,
          totalPrice,
          currency: property.currency,
          status: "PENDING",
          paymentStatus: "PENDING",
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          userId,
          propertyId,
          roomTypeId: (roomTypeId as string) || null,
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
          providerUserId || userId,
          booking.totalPrice
        );
        await createCommission(calc);
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
    } catch (error) {
      console.error("Error creating booking:", error);
      return json({ error: "Failed to create booking. Please try again." }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function PropertyBooking() {
  const { property, isAvailable, pricingBreakdown, totalPrice, nights, searchParams, availabilityPreview } = useLoaderData<typeof loader>();
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

  const isSubmitting = navigation.state === "submitting";

  const handleDateChange = (field: string, value: string) => {
    setSelectedDates(prev => ({ ...prev, [field]: value }));
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
                        footer={<div className="text-sm text-gray-600">Choose dates with better availability.</div>}
                        components={{
                          DayButton: ({ className, day, modifiers, ...props }: any) => {
                            const key = day.date.toISOString().split('T')[0];
                            const avail = availabilityPreview?.[key] ?? undefined;
                            let color = '';
                            if (typeof avail === 'number') {
                              color = avail <= 0 ? 'bg-red-100 text-red-700' : avail <= 1 ? 'bg-orange-100 text-orange-700' : 'bg-green-50 text-green-700';
                            }
                            return (
                              <button className={`aspect-square w-full rounded-md ${color}`} {...props}>
                                {day.date.getDate()}
                              </button>
                            );
                          }
                        }}
                      />
                    </div>
                  )}
                  {/* Date Selection */}
                  <div>
                    <Label htmlFor="checkIn">Check-in Date</Label>
                    <Input
                      id="checkIn"
                      name="checkIn"
                      type="date"
                      value={selectedDates.checkIn}
                      onChange={(e) => handleDateChange("checkIn", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="checkOut">Check-out Date</Label>
                    <Input
                      id="checkOut"
                      name="checkOut"
                      type="date"
                      value={selectedDates.checkOut}
                      onChange={(e) => handleDateChange("checkOut", e.target.value)}
                      min={selectedDates.checkIn || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

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
                          <span>{property.currency} {property.basePrice.toFixed(2)} × {nights} nights</span>
                          <span>{property.currency} {pricingBreakdown.basePrice.toFixed(2)}</span>
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
                          <span>{property.currency} {pricingBreakdown.taxes.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{property.currency} {(pricingBreakdown.total + (insurance ? 50 : 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Messages */}
                  {actionData && 'error' in actionData && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800">{actionData.error}</p>
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
