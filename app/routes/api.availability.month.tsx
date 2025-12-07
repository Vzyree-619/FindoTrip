import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { format, startOfMonth, endOfMonth, addDays, startOfDay } from "date-fns";
import { prisma } from "~/lib/db/db.server";
import { calculateRoomPrice } from "~/lib/pricing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const roomId = url.searchParams.get('roomId');
  const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
  const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

  if (!roomId) {
    return json({ error: 'Room ID required' }, { status: 400 });
  }

  // Validate year and month
  if (year < 2020 || year > 2030 || month < 1 || month > 12) {
    return json({ error: 'Invalid year or month' }, { status: 400 });
  }

  const startDate = startOfMonth(new Date(year, month - 1, 1));
  const endDate = endOfMonth(startDate);

  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      basePrice: true,
      totalUnits: true,
      available: true
    }
  });

  if (!room) {
    return json({ error: 'Room not found' }, { status: 404 });
  }

  if (!room.available) {
    return json({
      room: {
        id: room.id,
        name: room.name,
        basePrice: room.basePrice,
        totalUnits: room.totalUnits
      },
      month: format(startDate, 'MMMM yyyy'),
      availability: [],
      message: 'Room is not available for booking'
    });
  }

  const availability: MonthAvailability[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    // Get custom availability settings
    const customAvailability = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: roomId,
          date: startOfDay(currentDate)
        }
      }
    });

    // Count existing bookings
    const bookingsCount = await prisma.propertyBooking.aggregate({
      where: {
        roomTypeId: roomId,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        OR: [
          {
            checkIn: { lte: currentDate },
            checkOut: { gt: currentDate }
          }
        ]
      },
      _sum: {
        numberOfRooms: true
      }
    });

    const bookedUnits = bookingsCount._sum.numberOfRooms || 0;
    const maxUnits = customAvailability?.availableUnits ?? room.totalUnits;
    const availableUnits = Math.max(0, maxUnits - bookedUnits);

    // Get price for this date
    const priceInfo = await calculateRoomPrice(roomId, currentDate);

    availability.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      dayOfWeek: format(currentDate, 'EEEE'),
      isAvailable: customAvailability?.isAvailable !== false && availableUnits > 0,
      availableUnits,
      totalUnits: room.totalUnits,
      occupancyPercent: room.totalUnits > 0 ? ((bookedUnits / room.totalUnits) * 100) : 0,
      price: priceInfo.finalPrice,
      basePrice: room.basePrice,
      isPriceCustom: priceInfo.appliedRules.length > 0,
      priceRules: priceInfo.appliedRules,
      isBlocked: customAvailability?.isAvailable === false,
      blockReason: customAvailability?.reason,
      minStay: customAvailability?.minStay,
      maxStay: customAvailability?.maxStay,
      isFullyBooked: availableUnits === 0 && customAvailability?.isAvailable !== false
    });

    currentDate = addDays(currentDate, 1);
  }

  return json({
    room: {
      id: room.id,
      name: room.name,
      basePrice: room.basePrice,
      totalUnits: room.totalUnits
    },
    month: format(startDate, 'MMMM yyyy'),
    availability
  });
}

interface MonthAvailability {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  availableUnits: number;
  totalUnits: number;
  occupancyPercent: number;
  price: number;
  basePrice: number;
  isPriceCustom: boolean;
  priceRules: string[];
  isBlocked: boolean;
  blockReason?: string;
  minStay?: number;
  maxStay?: number;
  isFullyBooked: boolean;
}
