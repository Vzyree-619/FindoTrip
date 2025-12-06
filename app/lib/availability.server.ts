import { prisma } from "~/lib/db/db.server";
import { startOfDay, differenceInDays, addDays } from "date-fns";

/**
 * Check if room is available for specific dates
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfRooms: number = 1
): Promise<AvailabilityResult> {
  const room = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: {
      id: true,
      totalUnits: true,
      available: true,
    }
  });

  if (!room) {
    return { isAvailable: false, reason: 'Room type not found' };
  }

  if (!room.available) {
    return { isAvailable: false, reason: 'Room type is not available for booking' };
  }

  // Check each date in the range
  let currentDate = new Date(checkInDate);
  const unavailableDates: Date[] = [];
  const availabilityDetails: DateAvailability[] = [];

  while (currentDate < checkOutDate) {
    const normalizedDate = startOfDay(currentDate);

    // Check if date is blocked
    const availability = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: normalizedDate,
        }
      }
    });

    // If date is specifically blocked
    if (availability && !availability.isAvailable) {
      unavailableDates.push(new Date(normalizedDate));
      availabilityDetails.push({
        date: normalizedDate,
        isAvailable: false,
        reason: availability.reason || 'Date is blocked',
        availableUnits: 0,
      });
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Check how many rooms are already booked for this date
    const bookedCount = await prisma.propertyBooking.aggregate({
      where: {
        roomTypeId,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        OR: [
          {
            checkIn: { lte: normalizedDate },
            checkOut: { gt: normalizedDate }
          }
        ]
      },
      _sum: {
        numberOfRooms: true
      }
    });

    const bookedUnits = bookedCount._sum.numberOfRooms || 0;
    const availableUnits = availability?.availableUnits ?? room.totalUnits;
    const actuallyAvailable = availableUnits - bookedUnits;

    if (actuallyAvailable < numberOfRooms) {
      unavailableDates.push(new Date(normalizedDate));
      availabilityDetails.push({
        date: normalizedDate,
        isAvailable: false,
        reason: `Only ${actuallyAvailable} room(s) available, need ${numberOfRooms}`,
        availableUnits: actuallyAvailable,
      });
    } else {
      availabilityDetails.push({
        date: normalizedDate,
        isAvailable: true,
        availableUnits: actuallyAvailable,
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  if (unavailableDates.length > 0) {
    return {
      isAvailable: false,
      unavailableDates,
      availabilityDetails,
      reason: `Room not available for ${unavailableDates.length} date(s)`,
    };
  }

  // Check minimum stay requirement
  const minStay = await getMinimumStay(roomTypeId, checkInDate);
  const requestedNights = differenceInDays(checkOutDate, checkInDate);

  if (minStay && requestedNights < minStay) {
    return {
      isAvailable: false,
      reason: `Minimum ${minStay} night(s) required for these dates`,
      minStay,
      requestedNights,
    };
  }

  // Check maximum stay requirement
  const maxStay = await getMaximumStay(roomTypeId, checkInDate);
  if (maxStay && requestedNights > maxStay) {
    return {
      isAvailable: false,
      reason: `Maximum ${maxStay} night(s) allowed for these dates`,
      maxStay,
      requestedNights,
    };
  }

  // Get available units for the first date
  const firstDateAvailability = availabilityDetails[0];
  const availableUnits = firstDateAvailability?.availableUnits ?? room.totalUnits;

  return {
    isAvailable: true,
    availableUnits,
    availabilityDetails,
  };
}

/**
 * Get minimum stay requirement for a date
 */
export async function getMinimumStay(roomTypeId: string, date: Date): Promise<number | null> {
  const normalizedDate = startOfDay(date);

  // Check custom availability settings (highest priority)
  const availability = await prisma.roomAvailability.findUnique({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date: normalizedDate,
      }
    }
  });

  if (availability?.minStay) {
    return availability.minStay;
  }

  // Check seasonal pricing rules
  const seasonalRule = await prisma.seasonalPricing.findFirst({
    where: {
      OR: [
        { roomTypeId: roomTypeId },
        { propertyId: { not: null } } // Property-wide rules
      ],
      startDate: { lte: normalizedDate },
      endDate: { gte: normalizedDate },
      isActive: true,
    },
    orderBy: {
      priority: 'desc'
    }
  });

  if (seasonalRule?.minStay) {
    return seasonalRule.minStay;
  }

  // Check event pricing
  const eventRule = await prisma.specialEventPricing.findFirst({
    where: {
      OR: [
        { roomTypeId: roomTypeId },
        { propertyId: { not: null } } // Property-wide events
      ],
      startDate: { lte: normalizedDate },
      endDate: { gte: normalizedDate },
      isActive: true,
    }
  });

  return eventRule?.minStay ?? null;
}

/**
 * Get maximum stay requirement for a date
 */
export async function getMaximumStay(roomTypeId: string, date: Date): Promise<number | null> {
  const normalizedDate = startOfDay(date);

  // Check custom availability settings (highest priority)
  const availability = await prisma.roomAvailability.findUnique({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date: normalizedDate,
      }
    }
  });

  if (availability?.maxStay) {
    return availability.maxStay;
  }

  // Check seasonal pricing rules
  const seasonalRule = await prisma.seasonalPricing.findFirst({
    where: {
      OR: [
        { roomTypeId: roomTypeId },
        { propertyId: { not: null } } // Property-wide rules
      ],
      startDate: { lte: normalizedDate },
      endDate: { gte: normalizedDate },
      isActive: true,
    },
    orderBy: {
      priority: 'desc'
    }
  });

  return seasonalRule?.maxStay ?? null;
}

/**
 * Get availability summary for a date range
 */
export async function getAvailabilitySummary(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilitySummary> {
  let currentDate = new Date(startDate);
  const summary: DateAvailability[] = [];

  while (currentDate < endDate) {
    const normalizedDate = startOfDay(currentDate);
    
    const availability = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: normalizedDate,
        }
      }
    });

    const bookedCount = await prisma.propertyBooking.aggregate({
      where: {
        roomTypeId,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        OR: [
          {
            checkIn: { lte: normalizedDate },
            checkOut: { gt: normalizedDate }
          }
        ]
      },
      _sum: {
        numberOfRooms: true
      }
    });

    const room = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { totalUnits: true }
    });

    const bookedUnits = bookedCount._sum.numberOfRooms || 0;
    const totalUnits = room?.totalUnits ?? 0;
    const availableUnits = availability?.availableUnits ?? totalUnits;
    const actuallyAvailable = Math.max(0, availableUnits - bookedUnits);

    summary.push({
      date: normalizedDate,
      isAvailable: !availability?.isAvailable ? false : actuallyAvailable > 0,
      availableUnits: actuallyAvailable,
      totalUnits,
      bookedUnits,
      isBlocked: availability?.isAvailable === false,
      reason: availability?.isAvailable === false ? (availability.reason || 'Blocked') : undefined,
    });

    currentDate = addDays(currentDate, 1);
  }

  const availableDates = summary.filter(s => s.isAvailable && !s.isBlocked).length;
  const blockedDates = summary.filter(s => s.isBlocked).length;
  const fullyBookedDates = summary.filter(s => !s.isBlocked && s.availableUnits === 0).length;

  return {
    roomTypeId,
    startDate: startOfDay(startDate),
    endDate: startOfDay(endDate),
    dates: summary,
    totalDates: summary.length,
    availableDates,
    blockedDates,
    fullyBookedDates,
    minAvailableUnits: Math.min(...summary.map(s => s.availableUnits)),
    maxAvailableUnits: Math.max(...summary.map(s => s.availableUnits)),
  };
}

// TypeScript interfaces
export interface AvailabilityResult {
  isAvailable: boolean;
  unavailableDates?: Date[];
  reason?: string;
  availableUnits?: number;
  minStay?: number;
  maxStay?: number;
  requestedNights?: number;
  availabilityDetails?: DateAvailability[];
}

export interface DateAvailability {
  date: Date;
  isAvailable: boolean;
  availableUnits: number;
  totalUnits?: number;
  bookedUnits?: number;
  isBlocked?: boolean;
  reason?: string;
}

export interface AvailabilitySummary {
  roomTypeId: string;
  startDate: Date;
  endDate: Date;
  dates: DateAvailability[];
  totalDates: number;
  availableDates: number;
  blockedDates: number;
  fullyBookedDates: number;
  minAvailableUnits: number;
  maxAvailableUnits: number;
}

