import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
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
    
    pricingBreakdown.basePrice = property.basePrice * nights;
    pricingBreakdown.taxes = (pricingBreakdown.basePrice + pricingBreakdown.cleaningFee + pricingBreakdown.serviceFee) * (property.taxRate / 100);
    pricingBreakdown.total = pricingBreakdown.basePrice + pricingBreakdown.cleaningFee + pricingBreakdown.serviceFee + pricingBreakdown.taxes;
    totalPrice = pricingBreakdown.total;
  }

  return json({
    property,
    isAvailable,
    conflictingBookings,
    pricingBreakdown,
    totalPrice,
    nights,
    searchParams: {
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests) : 1,
    },
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;
  
  if (!propertyId) {
    throw new Response("Property ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "checkAvailability") {
    const checkIn = formData.get("checkIn") as string;
    const checkOut = formData.get("checkOut") as string;
    const guests = parseInt(formData.get("guests") as string);

    if (!checkIn || !checkOut) {
      return json({ error: "Check-in and check-out dates are required" }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return json({ error: "Check-out date must be after check-in date" }, { status: 400 });
    }

    // Check for conflicting bookings
    const conflictingBookings: any[] = await prisma.propertyBooking.findMany({
      where: {
        propertyId,
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
    const unavailableDates = await prisma.unavailableDate.findMany({
      where: {
        serviceId: propertyId,
        serviceType: "property",
        OR: [
          {
            startDate: { lte: checkOutDate },
            endDate: { gte: checkInDate },
          },
        ],
      },
    });

    const isAvailable = conflictingBookings.length === 0 && unavailableDates.length === 0;

    if (!isAvailable) {
      return json({ 
        error: "Property is not available for the selected dates",
        conflictingBookings,
        unavailableDates,
      }, { status: 400 });
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

    const basePrice = property.basePrice * nights;
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
        },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              city: true,
              country: true,
            },
          },
        },
      });

      return json({
        success: true,
        booking,
        redirectUrl: `/book/payment/${booking.id}?type=property`,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      return json({ error: "Failed to create booking. Please try again." }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function PropertyBooking() {
  const { property, isAvailable, pricingBreakdown, totalPrice, nights, searchParams } = useLoaderData<typeof loader>();
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
                {property.reviews.length > 0 && (
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
                  )}
                </div>
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