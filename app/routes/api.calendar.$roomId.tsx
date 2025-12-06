import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { startOfDay, addDays } from "date-fns";
import { calculateRoomPrice } from "~/lib/pricing.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const roomId = params.roomId;

  if (!roomId) {
    return json({ error: "Room ID is required" }, { status: 400 });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return json({ error: "Start and end dates required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return json({ error: "Invalid date range" }, { status: 400 });
  }

  // Get room details
  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    return json({ error: "Room not found" }, { status: 404 });
  }

  // Verify ownership
  if (room.property.owner.userId !== userId) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get all dates in range with pricing and availability
  const calendarData: CalendarDay[] = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const normalizedDate = startOfDay(currentDate);

    // Get custom availability/pricing for this date
    const customData = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: roomId,
          date: normalizedDate,
        },
      },
    });

    // Calculate price for this date
    const priceInfo = await calculateRoomPrice(roomId, normalizedDate);

    // Check bookings for this date
    const bookings = await prisma.propertyBooking.findMany({
      where: {
        roomTypeId: roomId,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        OR: [
          {
            checkIn: { lte: normalizedDate },
            checkOut: { gt: normalizedDate },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const bookedUnits = bookings.reduce(
      (sum, b) => sum + (b.numberOfRooms || 1),
      0
    );
    const availableUnits =
      customData?.availableUnits ?? room.totalUnits - bookedUnits;

    calendarData.push({
      date: normalizedDate.toISOString(),
      price: priceInfo.finalPrice,
      basePrice: room.basePrice,
      isCustomPrice: !!customData?.customPrice || priceInfo.appliedRules.length > 0,
      appliedRules: priceInfo.appliedRules,
      isAvailable: customData?.isAvailable ?? true,
      availableUnits: Math.max(0, availableUnits),
      totalUnits: room.totalUnits,
      occupancyPercent:
        room.totalUnits > 0
          ? (bookedUnits / room.totalUnits) * 100
          : 0,
      bookings: bookings.map((b) => ({
        id: b.id,
        customerName: b.guestName || b.user?.name || "Guest",
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        status: b.status,
      })),
      blockReason: customData?.reason || undefined,
      minStay: customData?.minStay || undefined,
      maxStay: customData?.maxStay || undefined,
    });

    currentDate = addDays(currentDate, 1);
  }

  return json({
    room: {
      id: room.id,
      name: room.name,
      basePrice: room.basePrice,
      totalUnits: room.totalUnits,
      currency: room.currency,
    },
    calendar: calendarData,
  });
}

interface CalendarDay {
  date: string;
  price: number;
  basePrice: number;
  isCustomPrice: boolean;
  appliedRules: string[];
  isAvailable: boolean;
  availableUnits: number;
  totalUnits: number;
  occupancyPercent: number;
  bookings: Array<{
    id: string;
    customerName: string;
    checkIn: string;
    checkOut: string;
    status: string;
  }>;
  blockReason?: string;
  minStay?: number;
  maxStay?: number;
}

