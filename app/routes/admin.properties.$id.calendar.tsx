import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Users, Shield, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { RoomCalendar, type DateInfo } from "~/components/calendar/RoomCalendar";
import { DateEditModal } from "~/components/calendar/DateEditModal";
import { BulkEditModal, type BulkAction } from "~/components/calendar/BulkEditModal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const propertyId = params.id;

  if (!propertyId) {
    throw new Response("Property ID is required", { status: 400 });
  }

  // Admin can view any property
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      roomTypes: {
        orderBy: {
          basePrice: "asc",
        },
      },
    },
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  // Get all room types for this property
  const roomTypes = property.roomTypes;

  // Get pricing rules
  const seasonalPricing = await prisma.seasonalPricing.findMany({
    where: {
      OR: [
        { propertyId: propertyId },
        { roomTypeId: { in: roomTypes.map((r) => r.id) } },
      ],
    },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      priority: "desc",
    },
  });

  const eventPricing = await prisma.specialEventPricing.findMany({
    where: {
      OR: [
        { propertyId: propertyId },
        { roomTypeId: { in: roomTypes.map((r) => r.id) } },
      ],
      isActive: true,
    },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const discountRules = await prisma.discountRule.findMany({
    where: {
      OR: [
        { propertyId: propertyId },
        { roomTypeId: { in: roomTypes.map((r) => r.id) } },
      ],
      isActive: true,
    },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Get revenue stats
  const bookings = await prisma.propertyBooking.findMany({
    where: {
      propertyId: propertyId,
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    select: {
      totalPrice: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const now = new Date();
  const thisMonthBookings = bookings.filter(
    (b) =>
      new Date(b.checkIn).getMonth() === now.getMonth() &&
      new Date(b.checkIn).getFullYear() === now.getFullYear()
  );
  const thisMonthRevenue = thisMonthBookings.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0
  );

  return json({
    property,
    roomTypes,
    seasonalPricing,
    eventPricing,
    discountRules,
    stats: {
      totalRevenue,
      thisMonthRevenue,
      totalBookings: bookings.length,
      thisMonthBookings: thisMonthBookings.length,
    },
    admin,
  });
}

export default function AdminPropertyCalendar() {
  const {
    property,
    roomTypes,
    seasonalPricing,
    eventPricing,
    discountRules,
    stats,
    admin,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    roomTypes[0]?.id || null
  );
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDateEditOpen, setIsDateEditOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [clickedDateInfo, setClickedDateInfo] = useState<DateInfo | null>(null);

  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId);

  // Load calendar data for selected room (would need to fetch from API or duplicate logic)
  // For now, we'll show a message to select a room
  const handleDateClick = (date: Date, info: DateInfo) => {
    setClickedDate(date);
    setClickedDateInfo(info);
    setSelectedDates([date]);
    setIsDateEditOpen(true);
  };

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    const range = eachDayOfInterval({ start: startDate, end: endDate });
    setSelectedDates(range);
    setIsBulkEditOpen(true);
  };

  const handleDateSave = async (data: {
    dates: Date[];
    price?: number;
    useBasePrice: boolean;
    isBlocked: boolean;
    blockReason?: string;
    notes?: string;
    minStay?: number;
    maxStay?: number;
    applyToPattern?: "only-dates" | "weekdays" | "weekends" | "recurring";
  }) => {
    if (!selectedRoomId) return;

    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("roomTypeId", selectedRoomId);
    formData.append("dates", JSON.stringify(data.dates.map((d) => format(d, "yyyy-MM-dd"))));
    if (!data.useBasePrice && data.price) {
      formData.append("price", data.price.toString());
    }
    formData.append("isBlocked", data.isBlocked.toString());
    if (data.blockReason) {
      formData.append("blockReason", data.blockReason);
    }
    if (data.notes) {
      formData.append("notes", data.notes);
    }
    if (data.minStay) {
      formData.append("minStay", data.minStay.toString());
    }
    if (data.maxStay) {
      formData.append("maxStay", data.maxStay.toString());
    }
    formData.append("adminOverride", "true"); // Flag for admin override

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/calendar/availability",
    });
  };

  const handleBulkAction = (action: BulkAction) => {
    console.log("Bulk action:", action, "on dates:", selectedDates);
    // TODO: Implement bulk action handlers
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/services/properties"
            className="flex items-center gap-2 text-[#01502E] hover:text-[#013d23] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Properties
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-[#01502E]" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Calendar View
                </h1>
              </div>
              <h2 className="text-xl text-gray-600">{property.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Owner: {property.owner.user.name} ({property.owner.user.email})
              </p>
            </div>
            <Badge variant="outline" className="bg-yellow-50 border-yellow-200">
              <Shield className="w-4 h-4 mr-1" />
              Admin Mode
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-[#01502E]">
              {property.currency} {stats.totalRevenue.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">This Month</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {property.currency} {stats.thisMonthRevenue.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Total Bookings</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalBookings}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">This Month</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.thisMonthBookings}
            </div>
          </Card>
        </div>

        {/* Room Selection */}
        <Card className="p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Room Type:
          </label>
          <div className="flex flex-wrap gap-2">
            {roomTypes.map((room) => (
              <Button
                key={room.id}
                variant={selectedRoomId === room.id ? "default" : "outline"}
                onClick={() => setSelectedRoomId(room.id)}
                className={
                  selectedRoomId === room.id
                    ? "bg-[#01502E] text-white"
                    : ""
                }
              >
                {room.name} ({property.currency} {room.basePrice.toLocaleString()}/night)
              </Button>
            ))}
          </div>
        </Card>

        {/* Pricing Rules Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Seasonal Pricing Rules
            </h3>
            <div className="text-2xl font-bold text-[#01502E]">
              {seasonalPricing.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Active rules</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Event Pricing
            </h3>
            <div className="text-2xl font-bold text-[#01502E]">
              {eventPricing.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Active events</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Discount Rules
            </h3>
            <div className="text-2xl font-bold text-[#01502E]">
              {discountRules.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Active discounts</p>
          </Card>
        </div>

        {/* Calendar Placeholder - Would integrate RoomCalendar component */}
        {selectedRoom ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Calendar view for: <strong>{selectedRoom.name}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Calendar component integration needed. Use RoomCalendar component
                with admin override capabilities.
              </p>
              <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mt-4" />
              <p className="text-xs text-yellow-600 mt-2">
                Admin Mode: You can override owner's pricing and block dates
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Please select a room type to view calendar</p>
            </div>
          </Card>
        )}

        {/* Admin Actions */}
        <Card className="p-6 mt-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Available Actions:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Override owner's pricing</li>
                <li>Force-block dates</li>
                <li>View all revenue data</li>
                <li>Monitor pricing strategy</li>
                <li>Edit any date settings</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Admin Powers:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Can edit any property's calendar</li>
                <li>Can override owner restrictions</li>
                <li>Can see all booking details</li>
                <li>Can force maintenance blocks</li>
                <li>Can view revenue projections</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {clickedDate && clickedDateInfo && selectedRoom && (
        <DateEditModal
          open={isDateEditOpen}
          onOpenChange={setIsDateEditOpen}
          dates={[clickedDate]}
          roomName={selectedRoom.name}
          basePrice={selectedRoom.basePrice || 0}
          currency={property.currency || "PKR"}
          initialData={new Map([
            [format(clickedDate, "yyyy-MM-dd"), clickedDateInfo],
          ])}
          onSave={handleDateSave}
        />
      )}

      <BulkEditModal
        open={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        dates={selectedDates}
        onActionSelect={handleBulkAction}
      />
    </div>
  );
}

