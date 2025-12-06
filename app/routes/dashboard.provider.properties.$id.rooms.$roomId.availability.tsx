import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Users, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { RoomCalendar, type DateInfo } from "~/components/calendar/RoomCalendar";
import { DateEditModal } from "~/components/calendar/DateEditModal";
import { BulkEditModal, type BulkAction } from "~/components/calendar/BulkEditModal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;
  const roomId = params.roomId;

  if (!propertyId || !roomId) {
    throw new Response("Property ID and Room ID are required", { status: 400 });
  }

  // Verify ownership
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      owner: { userId }
    }
  });

  if (!property) {
    throw new Response("Property not found or unauthorized", { status: 403 });
  }

  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    include: {
      property: true
    }
  });

  if (!room || room.propertyId !== propertyId) {
    throw new Response("Room not found", { status: 404 });
  }

  // Get bookings for this room
  const bookings = await prisma.propertyBooking.findMany({
    where: {
      roomTypeId: roomId,
      status: { not: 'CANCELLED' }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      checkIn: 'asc'
    }
  });

  // Get availability records
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(addMonths(new Date(), 5)); // 6 months ahead
  const availabilityRecords = await prisma.roomAvailability.findMany({
    where: {
      roomTypeId: roomId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Calculate stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const thisMonthBookings = bookings.filter(b => 
    b.checkIn >= startOfMonth && b.checkIn <= endOfMonth
  );

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const avgRate = bookings.length > 0 ? totalRevenue / bookings.length : 0;

  return json({
    property,
    room,
    bookings,
    availabilityRecords,
    stats: {
      totalBookings: bookings.length,
      thisMonthBookings: thisMonthBookings.length,
      totalRevenue,
      avgRate
    }
  });
}

export default function RoomAvailability() {
  const { property, room, bookings, availabilityRecords, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDateEditOpen, setIsDateEditOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [clickedDateInfo, setClickedDateInfo] = useState<DateInfo | null>(null);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, typeof bookings>();
    bookings.forEach(booking => {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      const current = new Date(start);
      
      while (current < end) {
        const key = format(current, "yyyy-MM-dd");
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(booking);
        current.setDate(current.getDate() + 1);
      }
    });
    return map;
  }, [bookings]);

  // Create availability map
  const availabilityMap = useMemo(() => {
    const map = new Map<string, DateInfo>();
    const totalUnits = room.totalUnits || 1;
    const basePrice = room.basePrice || 0;

    // Initialize with all dates from availability records
    availabilityRecords.forEach(record => {
      const key = format(record.date, "yyyy-MM-dd");
      const dateBookings = bookingsByDate.get(key) || [];
      const bookedUnits = dateBookings.reduce((sum, b) => sum + (b.numberOfRooms || 1), 0);
      const available = Math.max(0, totalUnits - bookedUnits);

      map.set(key, {
        date: record.date,
        price: record.customPrice || basePrice,
        basePrice,
        available,
        totalUnits,
        isBlocked: !record.isAvailable,
        blockReason: record.reason || undefined,
        hasBooking: dateBookings.length > 0,
        bookings: dateBookings.map(b => ({
          id: b.id,
          guestName: b.guestName || b.user?.name || "Guest",
          checkIn: new Date(b.checkIn),
          checkOut: new Date(b.checkOut),
        })),
        minStay: record.minStay || undefined,
        maxStay: record.maxStay || undefined,
      });
    });

    return map;
  }, [availabilityRecords, bookingsByDate, room.totalUnits, room.basePrice]);

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
    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("roomTypeId", room.id);
    formData.append("dates", JSON.stringify(data.dates.map(d => format(d, "yyyy-MM-dd"))));
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

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/calendar/availability",
    });
  };

  const handleBulkAction = (action: BulkAction) => {
    // Handle bulk actions
    console.log("Bulk action:", action, "on dates:", selectedDates);
    // TODO: Implement bulk action handlers
  };

  // Build dates map for calendar
  const datesMap = useMemo(() => {
    const map = new Map<string, DateInfo>();
    const totalUnits = room.totalUnits || 1;
    const basePrice = room.basePrice || 0;

    // Get date range for calendar (current month + 5 months ahead)
    const start = startOfMonth(new Date());
    const end = endOfMonth(addMonths(new Date(), 5));
    const allDays = eachDayOfInterval({ start, end });

    allDays.forEach(day => {
      const key = format(day, "yyyy-MM-dd");
      const availability = availabilityMap.get(key);
      const dateBookings = bookingsByDate.get(key) || [];
      const bookedUnits = dateBookings.reduce((sum, b) => sum + (b.numberOfRooms || 1), 0);
      const available = Math.max(0, totalUnits - bookedUnits);

      if (availability) {
        map.set(key, availability);
      } else {
        map.set(key, {
          date: day,
          price: basePrice,
          basePrice,
          available,
          totalUnits,
          isBlocked: false,
          hasBooking: dateBookings.length > 0,
          bookings: dateBookings.map(b => ({
            id: b.id,
            guestName: b.guestName || b.user?.name || "Guest",
            checkIn: new Date(b.checkIn),
            checkOut: new Date(b.checkOut),
          })),
        });
      }
    });

    return map;
  }, [availabilityMap, bookingsByDate, room.totalUnits, room.basePrice]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/dashboard/provider/properties/${property.id}/rooms`}
            className="flex items-center gap-2 text-[#01502E] hover:text-[#013d23] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Room Availability Calendar</h1>
          <p className="text-gray-600 mt-2">{room.name} - {property.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Total Bookings</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalBookings}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">This Month</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.thisMonthBookings}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-[#01502E]">
              {room.currency} {stats.totalRevenue.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Avg Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {room.currency} {Math.round(stats.avgRate).toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedDates.length > 0 && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">SELECTED: </span>
                <span className="text-sm text-gray-700">
                  {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkEditOpen(true)}
                >
                  Bulk Actions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDates([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Calendar */}
        <Card className="p-6 mb-8">
          <RoomCalendar
            roomName={room.name}
            basePrice={room.basePrice || 0}
            currency={room.currency || "PKR"}
            totalUnits={room.totalUnits || 1}
            dates={datesMap}
            onDateClick={handleDateClick}
            onDateRangeSelect={handleDateRangeSelect}
            monthsToShow={3}
          />
        </Card>

        {/* Bookings List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No bookings yet for this room type</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {booking.guestName || booking.user?.name || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''} • {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#01502E]">
                        {room.currency} {booking.totalAmount?.toLocaleString() || '0'}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      {clickedDate && clickedDateInfo && (
        <DateEditModal
          open={isDateEditOpen}
          onOpenChange={setIsDateEditOpen}
          dates={[clickedDate]}
          roomName={room.name}
          basePrice={room.basePrice || 0}
          currency={room.currency || "PKR"}
          initialData={new Map([[format(clickedDate, "yyyy-MM-dd"), clickedDateInfo]])}
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
