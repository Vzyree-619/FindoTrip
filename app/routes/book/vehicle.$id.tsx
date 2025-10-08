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
import { Separator } from "~/components/ui/separator";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, MapPin, Users, Car, Shield, Star, Calendar, Clock } from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const vehicleId = params.id;
  
  if (!vehicleId) {
    throw new Response("Vehicle ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const pickupLocation = url.searchParams.get("pickupLocation");

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
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

  if (!vehicle) {
    throw new Response("Vehicle not found", { status: 404 });
  }

  // Check availability for the requested dates
  let isAvailable = true;
  let conflictingBookings = [];

  if (startDate && endDate) {
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    // Check for conflicting bookings
    conflictingBookings = await prisma.vehicleBooking.findMany({
      where: {
        vehicleId: vehicle.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            startDate: { lte: endDateTime },
            endDate: { gte: startDateTime },
          },
        ],
      },
    });

    // Check unavailable dates
    const unavailablePeriods = vehicle.unavailableDates.filter(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return (
        (periodStart <= endDateTime && periodEnd >= startDateTime)
      );
    });

    isAvailable = conflictingBookings.length === 0 && unavailablePeriods.length === 0;
  }

  // Calculate pricing
  let totalPrice = 0;
  let rentalDays = 0;
  let pricingBreakdown = {
    basePrice: 0,
    driverFee: 0,
    insuranceFee: 0,
    securityDeposit: vehicle.securityDeposit,
    extraFees: 0,
    total: 0,
  };

  if (startDate && endDate) {
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    rentalDays = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    
    pricingBreakdown.basePrice = vehicle.basePrice * rentalDays;
    pricingBreakdown.driverFee = vehicle.driverFee * rentalDays;
    pricingBreakdown.insuranceFee = vehicle.insuranceFee * rentalDays;
    pricingBreakdown.total = pricingBreakdown.basePrice + pricingBreakdown.driverFee + pricingBreakdown.insuranceFee + pricingBreakdown.securityDeposit;
    totalPrice = pricingBreakdown.total;
  }

  return json({
    vehicle,
    isAvailable,
    conflictingBookings,
    pricingBreakdown,
    totalPrice,
    rentalDays,
    searchParams: {
      startDate,
      endDate,
      pickupLocation,
    },
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const vehicleId = params.id;
  
  if (!vehicleId) {
    throw new Response("Vehicle ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "checkAvailability") {
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!startDate || !endDate) {
      return json({ error: "Start and end dates are required" }, { status: 400 });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime >= endDateTime) {
      return json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Check for conflicting bookings
    const conflictingBookings = await prisma.vehicleBooking.findMany({
      where: {
        vehicleId,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            startDate: { lte: endDateTime },
            endDate: { gte: startDateTime },
          },
        ],
      },
    });

    // Check unavailable dates
    const unavailableDates = await prisma.unavailableDate.findMany({
      where: {
        serviceId: vehicleId,
        serviceType: "vehicle",
        OR: [
          {
            startDate: { lte: endDateTime },
            endDate: { gte: startDateTime },
          },
        ],
      },
    });

    const isAvailable = conflictingBookings.length === 0 && unavailableDates.length === 0;

    if (!isAvailable) {
      return json({ 
        error: "Vehicle is not available for the selected dates",
        conflictingBookings,
        unavailableDates,
      }, { status: 400 });
    }

    // Calculate pricing
    const rentalDays = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        basePrice: true,
        driverFee: true,
        insuranceFee: true,
        securityDeposit: true,
        currency: true,
      },
    });

    if (!vehicle) {
      return json({ error: "Vehicle not found" }, { status: 404 });
    }

    const basePrice = vehicle.basePrice * rentalDays;
    const driverFee = vehicle.driverFee * rentalDays;
    const insuranceFee = vehicle.insuranceFee * rentalDays;
    const securityDeposit = vehicle.securityDeposit;
    const totalPrice = basePrice + driverFee + insuranceFee + securityDeposit;

    return json({
      success: true,
      isAvailable: true,
      pricingBreakdown: {
        basePrice,
        driverFee,
        insuranceFee,
        securityDeposit,
        extraFees: 0,
        total: totalPrice,
      },
      rentalDays,
      totalPrice,
    });
  }

  if (intent === "createBooking") {
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const pickupTime = formData.get("pickupTime") as string;
    const returnTime = formData.get("returnTime") as string;
    const pickupLocation = formData.get("pickupLocation") as string;
    const returnLocation = formData.get("returnLocation") as string;
    const renterName = formData.get("renterName") as string;
    const renterEmail = formData.get("renterEmail") as string;
    const renterPhone = formData.get("renterPhone") as string;
    const licenseNumber = formData.get("licenseNumber") as string;
    const licenseExpiry = formData.get("licenseExpiry") as string;
    const driverRequired = formData.get("driverRequired") === "on";
    const specialRequests = formData.get("specialRequests") as string;
    const additionalEquipment = formData.getAll("additionalEquipment") as string[];

    if (!startDate || !endDate || !pickupTime || !returnTime || !pickupLocation || !returnLocation || !renterName || !renterEmail || !renterPhone || !licenseNumber || !licenseExpiry) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const rentalDays = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));

    // Get vehicle details for pricing
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        basePrice: true,
        driverFee: true,
        insuranceFee: true,
        securityDeposit: true,
        currency: true,
        driverIncluded: true,
        driverRequired: true,
      },
    });

    if (!vehicle) {
      return json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Calculate pricing
    const basePrice = vehicle.basePrice * rentalDays;
    const driverFee = (driverRequired || vehicle.driverRequired) ? vehicle.driverFee * rentalDays : 0;
    const insuranceFee = vehicle.insuranceFee * rentalDays;
    const securityDeposit = vehicle.securityDeposit;
    const totalPrice = basePrice + driverFee + insuranceFee + securityDeposit;

    // Generate booking number
    const bookingNumber = `VB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      const booking = await prisma.vehicleBooking.create({
        data: {
          bookingNumber,
          startDate: startDateTime,
          endDate: endDateTime,
          pickupTime,
          returnTime,
          pickupLocation,
          returnLocation,
          driverRequired: driverRequired || vehicle.driverRequired,
          driverIncluded: vehicle.driverIncluded,
          basePrice,
          driverFee,
          insuranceFee,
          securityDeposit,
          extraFees: 0,
          totalPrice,
          currency: vehicle.currency,
          status: "PENDING",
          paymentStatus: "PENDING",
          renterName,
          renterEmail,
          renterPhone,
          licenseNumber,
          licenseExpiry: new Date(licenseExpiry),
          specialRequests,
          additionalEquipment,
          userId,
          vehicleId,
        },
        include: {
          vehicle: {
            select: {
              name: true,
              brand: true,
              model: true,
              year: true,
              type: true,
            },
          },
        },
      });

      return json({
        success: true,
        booking,
        redirectUrl: `/book/payment/${booking.id}?type=vehicle`,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      return json({ error: "Failed to create booking. Please try again." }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function VehicleBooking() {
  const { vehicle, isAvailable, pricingBreakdown, totalPrice, rentalDays, searchParams } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();

  const [selectedDates, setSelectedDates] = useState({
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
  });
  const [times, setTimes] = useState({
    pickupTime: "09:00",
    returnTime: "18:00",
  });
  const [locations, setLocations] = useState({
    pickupLocation: searchParams.pickupLocation || "",
    returnLocation: searchParams.pickupLocation || "",
  });
  const [renterDetails, setRenterDetails] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
  });
  const [specialRequests, setSpecialRequests] = useState("");
  const [driverRequired, setDriverRequired] = useState(vehicle.driverRequired);
  const [additionalEquipment, setAdditionalEquipment] = useState<string[]>([]);

  const isSubmitting = navigation.state === "submitting";

  const handleDateChange = (field: string, value: string) => {
    setSelectedDates(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (field: string, value: string) => {
    setTimes(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setLocations(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setAdditionalEquipment(prev => [...prev, equipment]);
    } else {
      setAdditionalEquipment(prev => prev.filter(item => item !== equipment));
    }
  };

  const updateUrl = () => {
    const newSearchParams = new URLSearchParams(searchParamsUrl);
    if (selectedDates.startDate) newSearchParams.set("startDate", selectedDates.startDate);
    if (selectedDates.endDate) newSearchParams.set("endDate", selectedDates.endDate);
    if (locations.pickupLocation) newSearchParams.set("pickupLocation", locations.pickupLocation);
    setSearchParamsUrl(newSearchParams);
  };

  useEffect(() => {
    updateUrl();
  }, [selectedDates, locations]);

  const equipmentOptions = [
    "GPS Navigation",
    "Child Seat",
    "Booster Seat",
    "Roof Rack",
    "Bike Rack",
    "Ski Rack",
    "Bluetooth Speaker",
    "Phone Charger",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">{vehicle.name}</CardTitle>
                    <div className="text-lg text-gray-600">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </div>
                    <div className="flex items-center mt-2 text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{vehicle.location}, {vehicle.city}, {vehicle.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{vehicle.rating.toFixed(1)}</span>
                      <span className="ml-1 text-gray-500">({vehicle.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{vehicle.seats} seats</span>
                  </div>
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{vehicle.type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{vehicle.transmission}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{vehicle.fuelType}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.slice(0, 8).map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                    {vehicle.features.length > 8 && (
                      <Badge variant="outline">
                        +{vehicle.features.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{vehicle.description}</p>
                </div>

                {/* Recent Reviews */}
                {vehicle.reviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                      {vehicle.reviews.map((review) => (
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
                <CardTitle>Book This Vehicle</CardTitle>
                <div className="text-2xl font-bold text-green-600">
                  {vehicle.currency} {vehicle.basePrice.toFixed(2)} / day
                </div>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={selectedDates.startDate}
                      onChange={(e) => handleDateChange("startDate", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={selectedDates.endDate}
                      onChange={(e) => handleDateChange("endDate", e.target.value)}
                      min={selectedDates.startDate || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pickupTime">Pickup Time</Label>
                      <Input
                        id="pickupTime"
                        name="pickupTime"
                        type="time"
                        value={times.pickupTime}
                        onChange={(e) => handleTimeChange("pickupTime", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnTime">Return Time</Label>
                      <Input
                        id="returnTime"
                        name="returnTime"
                        type="time"
                        value={times.returnTime}
                        onChange={(e) => handleTimeChange("returnTime", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Location Details */}
                  <div>
                    <Label htmlFor="pickupLocation">Pickup Location</Label>
                    <Input
                      id="pickupLocation"
                      name="pickupLocation"
                      type="text"
                      value={locations.pickupLocation}
                      onChange={(e) => handleLocationChange("pickupLocation", e.target.value)}
                      placeholder="Enter pickup address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="returnLocation">Return Location</Label>
                    <Input
                      id="returnLocation"
                      name="returnLocation"
                      type="text"
                      value={locations.returnLocation}
                      onChange={(e) => handleLocationChange("returnLocation", e.target.value)}
                      placeholder="Enter return address"
                      required
                    />
                  </div>

                  {/* Driver Option */}
                  {vehicle.driverIncluded && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="driverRequired"
                        name="driverRequired"
                        checked={driverRequired}
                        onCheckedChange={(checked) => setDriverRequired(checked as boolean)}
                      />
                      <Label htmlFor="driverRequired" className="text-sm">
                        Include driver (+{vehicle.currency} {vehicle.driverFee.toFixed(2)}/day)
                      </Label>
                    </div>
                  )}

                  {/* Renter Details */}
                  <div>
                    <Label htmlFor="renterName">Full Name</Label>
                    <Input
                      id="renterName"
                      name="renterName"
                      type="text"
                      value={renterDetails.name}
                      onChange={(e) => setRenterDetails(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="renterEmail">Email</Label>
                    <Input
                      id="renterEmail"
                      name="renterEmail"
                      type="email"
                      value={renterDetails.email}
                      onChange={(e) => setRenterDetails(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="renterPhone">Phone</Label>
                    <Input
                      id="renterPhone"
                      name="renterPhone"
                      type="tel"
                      value={renterDetails.phone}
                      onChange={(e) => setRenterDetails(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="licenseNumber">Driving License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={renterDetails.licenseNumber}
                      onChange={(e) => setRenterDetails(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="licenseExpiry">License Expiry Date</Label>
                    <Input
                      id="licenseExpiry"
                      name="licenseExpiry"
                      type="date"
                      value={renterDetails.licenseExpiry}
                      onChange={(e) => setRenterDetails(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Additional Equipment */}
                  <div>
                    <Label>Additional Equipment</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {equipmentOptions.map((equipment) => (
                        <div key={equipment} className="flex items-center space-x-2">
                          <Checkbox
                            id={equipment}
                            name="additionalEquipment"
                            value={equipment}
                            checked={additionalEquipment.includes(equipment)}
                            onCheckedChange={(checked) => handleEquipmentChange(equipment, checked as boolean)}
                          />
                          <Label htmlFor={equipment} className="text-sm">
                            {equipment}
                          </Label>
                        </div>
                      ))}
                    </div>
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

                  {/* Pricing Breakdown */}
                  {selectedDates.startDate && selectedDates.endDate && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Price Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{vehicle.currency} {vehicle.basePrice.toFixed(2)} × {rentalDays} days</span>
                          <span>{vehicle.currency} {pricingBreakdown.basePrice.toFixed(2)}</span>
                        </div>
                        {driverRequired && (
                          <div className="flex justify-between">
                            <span>Driver fee</span>
                            <span>{vehicle.currency} {pricingBreakdown.driverFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Insurance fee</span>
                          <span>{vehicle.currency} {pricingBreakdown.insuranceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Security deposit</span>
                          <span>{vehicle.currency} {pricingBreakdown.securityDeposit.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{vehicle.currency} {pricingBreakdown.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

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
                    value="createBooking"
                    className="w-full"
                    disabled={isSubmitting || !selectedDates.startDate || !selectedDates.endDate}
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