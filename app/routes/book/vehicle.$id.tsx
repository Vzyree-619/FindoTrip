import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";

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

    // Create booking and redirect to payment
    const booking = await prisma.vehicleBooking.create({
      data: {
        userId,
        vehicleId,
        startDate: start,
        endDate: end,
        pickupLocation,
        insuranceSelected,
        driverRequired: driverSelected,
        status: "PENDING",
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form method="post" replace>
                <input type="hidden" name="intent" value="book" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Pickup Date</Label>
                    <Input name="startDate" type="date" defaultValue={startDate || ''} required />
                  </div>
                  <div>
                    <Label>Dropoff Date</Label>
                    <Input name="endDate" type="date" defaultValue={endDate || ''} required />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Pickup Location</Label>
                  <Input name="pickupLocation" defaultValue={pickupLocation || ''} placeholder="Enter pickup point" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="insuranceSelected" />
                    <span>Premium Insurance (+ {pricing.insuranceDaily}/day)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="driverSelected" />
                    <span>Driver (+ {pricing.driverDaily}/day)</span>
                  </label>
                </div>
                {actionData && (actionData as any).error && (
                  <p className="mt-3 text-red-600">{(actionData as any).error}</p>
                )}
                <div className="mt-6">
                  <Button type="submit" disabled={disabled} className="w-full bg-[#01502E] hover:bg-[#013d23]">
                    {disabled ? 'Processing…' : 'Book Now'}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Daily Rate</span><span>{pricing.dailyRate}</span></div>
              <div className="flex justify-between"><span>Days</span><span>{days}</span></div>
              <div className="flex justify-between"><span>Insurance</span><span>{pricing.insurance}</span></div>
              <div className="flex justify-between"><span>Driver</span><span>{pricing.driver}</span></div>
              <div className="flex justify-between"><span>Service Fee</span><span>{pricing.service}</span></div>
              <div className="flex justify-between"><span>Taxes</span><span>{pricing.taxes}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{total}</span></div>
              <div className="mt-2 text-sm {isAvailable ? 'text-[#01502E]' : 'text-orange-700'}">{isAvailable ? 'Available' : 'Selected dates overlap with blocked periods'}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

