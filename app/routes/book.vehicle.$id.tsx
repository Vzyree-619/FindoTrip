import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";
import { 
  Calendar, 
  MapPin, 
  Car, 
  Shield, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Star
} from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const vehicleId = params.id;
  if (!vehicleId) throw new Response("Vehicle ID is required", { status: 400 });

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const pickupLocation = url.searchParams.get("pickupLocation") || "";

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      owner: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      unavailableDates: true,
    },
  });
  if (!vehicle) throw new Response("Vehicle not found", { status: 404 });

  // Availability check (basic range overlap)
  let isAvailable = false;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const overlapping = vehicle.unavailableDates.some((p: any) => {
      const s = new Date(p.startDate);
      const e = new Date(p.endDate);
      return s <= end && e >= start;
    });
    isAvailable = !overlapping && start < end;
  }

  // Simple pricing breakdown
  const dailyRate = vehicle.basePrice;
  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24))) : 1;
  const insuranceDaily = vehicle.insuranceFee || 0;
  const driverDaily = vehicle.driverFee || 0;
  const insurance = (insuranceDaily * days) || 0;
  const driver = (driverDaily * days) || 0;
  const rental = dailyRate * days;
  const service = Math.round(0.05 * (rental + insurance + driver));
  const taxes = Math.round(0.1 * (rental + insurance + driver));
  const total = rental + insurance + driver + service + taxes;

  return json({ vehicle, userId, isAvailable, pricing: { dailyRate, days, insuranceDaily, driverDaily, rental, insurance, driver, service, taxes, total }, startDate, endDate, pickupLocation });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const vehicleId = params.id!;
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "book") {
    const startDate = form.get("startDate") as string;
    const endDate = form.get("endDate") as string;
    const pickupLocation = (form.get("pickupLocation") as string) || "";
    const insuranceSelected = form.get("insuranceSelected") === "on";
    const driverSelected = form.get("driverSelected") === "on";
    if (!startDate || !endDate) return json({ error: "Pick start and end date" }, { status: 400 });
    if (new Date(endDate) <= new Date(startDate)) return json({ error: "Dropoff must be after pickup" }, { status: 400 });

    // Basic conflict check
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { unavailableDates: true } });
    if (!vehicle) return json({ error: "Vehicle not found" }, { status: 404 });
    const start = new Date(startDate), end = new Date(endDate);
    const overlapping = vehicle.unavailableDates.some((p: any) => new Date(p.startDate) <= end && new Date(p.endDate) >= start);
    if (overlapping) return json({ error: "Vehicle is not available for selected dates" }, { status: 400 });

    // Get user information for renter details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true }
    });
    
    // Generate unique booking number
    const bookingNumber = `VB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create booking and redirect to payment
    const booking = await prisma.vehicleBooking.create({
      data: {
        bookingNumber,
        userId,
        vehicleId,
        startDate: start,
        endDate: end,
        pickupTime: "10:00",
        returnTime: "10:00",
        pickupLocation,
        returnLocation: pickupLocation,
        driverRequired: driverSelected,
        driverIncluded: driverSelected,
        basePrice: vehicle.basePrice,
        driverFee: driverSelected ? 2000 : 0,
        insuranceFee: insuranceSelected ? 1000 : 0,
        securityDeposit: 5000,
        extraFees: 0,
        totalPrice: vehicle.basePrice + (driverSelected ? 2000 : 0) + (insuranceSelected ? 1000 : 0) + 5000,
        status: "PENDING",
        renterName: user?.name || "Unknown",
        renterEmail: user?.email || "unknown@example.com",
        renterPhone: user?.phone || "000-000-0000",
        licenseNumber: "TEMP-LICENSE-123", // This should be collected from user profile or form
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      select: { id: true },
    });
    return redirect(`/book/payment/${booking.id}?type=vehicle`);
  }
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function VehicleBookingPage() {
  const { vehicle, isAvailable, pricing, startDate, endDate, pickupLocation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();

  const disabled = nav.state !== "idle";
  const days = pricing.days;
  const total = pricing.total;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Car className="h-4 w-4" />
            <span>Vehicle Booking</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Booking</h1>
          <p className="text-slate-600 mt-2">Review your selection and finalize your vehicle rental</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Information Card */}
            <Card className="overflow-hidden">
              <div className="relative">
                <img 
                  src={vehicle.image || '/car.jpg'} 
                  alt={vehicle.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant={isAvailable ? "default" : "destructive"} className="bg-white/90 text-slate-900">
                    {isAvailable ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unavailable
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{vehicle.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        <span>{vehicle.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{vehicle.capacity} passengers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#01502E]">PKR {vehicle.basePrice.toLocaleString()}</div>
                    <div className="text-sm text-slate-600">per day</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Owner:</span>
                    <span className="ml-2 text-slate-600">{vehicle.owner.user.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Contact:</span>
                    <span className="ml-2 text-slate-600">{vehicle.owner.user.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
                <CardDescription>
                  Select your rental dates and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form method="post" replace>
                  <input type="hidden" name="intent" value="book" />
                  
                  {/* Date Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Pickup Date
                      </Label>
                      <Input 
                        id="startDate"
                        name="startDate" 
                        type="date" 
                        defaultValue={startDate || ''} 
                        required 
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Dropoff Date
                      </Label>
                      <Input 
                        id="endDate"
                        name="endDate" 
                        type="date" 
                        defaultValue={endDate || ''} 
                        required 
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="pickupLocation" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Location
                    </Label>
                    <Input 
                      id="pickupLocation"
                      name="pickupLocation" 
                      defaultValue={pickupLocation || ''} 
                      placeholder="Enter pickup location" 
                      className="h-11"
                    />
                  </div>

                  {/* Additional Services */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Additional Services</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <Checkbox id="insurance" name="insuranceSelected" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Premium Insurance</span>
                          </div>
                          <p className="text-sm text-slate-600">+ PKR {pricing.insuranceDaily.toLocaleString()} per day</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <Checkbox id="driver" name="driverSelected" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Professional Driver</span>
                          </div>
                          <p className="text-sm text-slate-600">+ PKR {pricing.driverDaily.toLocaleString()} per day</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {actionData && (actionData as any).error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {(actionData as any).error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={disabled || !isAvailable} 
                      className="w-full h-12 text-lg font-semibold bg-[#01502E] hover:bg-[#013d23] disabled:opacity-50"
                    >
                      {disabled ? (
                        <>
                          <Clock className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Price Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Daily Rate</span>
                    <span className="font-medium">PKR {pricing.dailyRate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Duration</span>
                    <span className="font-medium">{days} {days === 1 ? 'day' : 'days'}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Base Rental</span>
                    <span className="font-medium">PKR {pricing.rental.toLocaleString()}</span>
                  </div>
                  
                  {pricing.insurance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Insurance</span>
                      <span className="font-medium">PKR {pricing.insurance.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {pricing.driver > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Driver</span>
                      <span className="font-medium">PKR {pricing.driver.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Service Fee</span>
                    <span className="font-medium">PKR {pricing.service.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Taxes</span>
                    <span className="font-medium">PKR {pricing.taxes.toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#01502E]">PKR {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Important Notes</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Pricing excludes fuel, tolls, and parking fees</li>
                    <li>• Security deposit required at pickup</li>
                    <li>• Valid driving license required</li>
                    <li>• Free cancellation up to 24 hours before pickup</li>
                  </ul>
                </div>

                {/* Availability Status */}
                <div className={`p-4 rounded-lg ${isAvailable ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                  <div className={`flex items-center gap-2 ${isAvailable ? 'text-green-800' : 'text-orange-800'}`}>
                    {isAvailable ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Available for selected dates</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Selected dates may have conflicts</span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${isAvailable ? 'text-green-700' : 'text-orange-700'}`}>
                    {isAvailable 
                      ? 'Your vehicle is ready for booking' 
                      : 'Please select different dates or contact the owner'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
