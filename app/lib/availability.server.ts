import { prisma } from "~/lib/db/db.server";
import { startOfDay, differenceInDays, addDays, addMonths, subDays, isBefore } from "date-fns";

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
 * Get available dates for a room type for next 12 months
 * Returns detailed availability info for each date
 */
export async function getRoomAvailabilityCalendar(
  roomId: string,
  startDate: Date = new Date(),
  months: number = 12
): Promise<CalendarDateAvailability[]> {

  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    select: { totalUnits: true, available: true }
  });

  if (!room || !room.available) return [];

  const endDate = addMonths(startDate, months);
  const availability: CalendarDateAvailability[] = [];
  let currentDate = startOfDay(startDate);

  while (currentDate <= endDate) {
    // Get custom availability settings
    const customAvailability = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: roomId,
          date: currentDate
        }
      }
    });

    // If explicitly blocked
    if (customAvailability && !customAvailability.isAvailable) {
      availability.push({
        date: currentDate.toISOString(),
        isAvailable: false,
        availableUnits: 0,
        totalUnits: room.totalUnits,
        occupancyPercent: 100,
        reason: 'BLOCKED',
        blockReason: customAvailability.reason || 'Unavailable',
        minStay: customAvailability.minStay,
        maxStay: customAvailability.maxStay,
        price: null
      });
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Count existing bookings for this date
    const bookings = await prisma.propertyBooking.aggregate({
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

    const bookedUnits = bookings._sum.numberOfRooms || 0;
    const maxUnits = customAvailability?.availableUnits ?? room.totalUnits;
    const availableUnits = Math.max(0, maxUnits - bookedUnits);
    const occupancyPercent = room.totalUnits > 0 ? ((bookedUnits / room.totalUnits) * 100) : 0;

    availability.push({
      date: currentDate.toISOString(),
      isAvailable: availableUnits > 0,
      availableUnits,
      totalUnits: room.totalUnits,
      occupancyPercent,
      reason: availableUnits === 0 ? 'FULLY_BOOKED' : null,
      minStay: customAvailability?.minStay,
      maxStay: customAvailability?.maxStay,
      price: null // Will be calculated by pricing engine
    });

    currentDate = addDays(currentDate, 1);
  }

  return availability;
}

/**
 * Check if a specific date range is available
 * Returns detailed conflict information if not available
 */
export async function checkDateRangeAvailability(
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfRooms: number = 1
): Promise<DateRangeAvailabilityResult> {

  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    select: { totalUnits: true, available: true }
  });

  if (!room || !room.available) {
    return {
      isAvailable: false,
      conflicts: [],
      reason: 'Room type not found or unavailable'
    };
  }

  const conflicts: DateConflict[] = [];
  let currentDate = new Date(checkInDate);

  // Check each date in the range
  while (currentDate < checkOutDate) {
    // Check if date is blocked
    const customAvailability = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: roomId,
          date: startOfDay(currentDate)
        }
      }
    });

    if (customAvailability && !customAvailability.isAvailable) {
      conflicts.push({
        date: currentDate.toISOString(),
        type: 'BLOCKED',
        reason: customAvailability.reason || 'Date blocked by property',
        availableUnits: 0
      });
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Count bookings for this date
    const bookings = await prisma.propertyBooking.aggregate({
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

    const bookedUnits = bookings._sum.numberOfRooms || 0;
    const maxUnits = customAvailability?.availableUnits ?? room.totalUnits;
    const availableUnits = maxUnits - bookedUnits;

    if (availableUnits < numberOfRooms) {
      conflicts.push({
        date: currentDate.toISOString(),
        type: 'FULLY_BOOKED',
        reason: `Only ${availableUnits} room(s) available, ${numberOfRooms} requested`,
        availableUnits,
        requestedUnits: numberOfRooms
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  // Check minimum stay requirement
  const numberOfNights = differenceInDays(checkOutDate, checkInDate);
  const minStay = await getMinimumStayForDateRange(roomId, checkInDate, checkOutDate);

  if (minStay && numberOfNights < minStay) {
    return {
      isAvailable: false,
      conflicts: [],
      reason: `Minimum ${minStay} nights required for these dates`,
      minStay,
      requestedNights: numberOfNights
    };
  }

  // Check maximum stay if applicable
  const maxStay = await getMaximumStayForDateRange(roomId, checkInDate, checkOutDate);
  if (maxStay && numberOfNights > maxStay) {
    return {
      isAvailable: false,
      conflicts: [],
      reason: `Maximum ${maxStay} nights allowed for these dates`,
      maxStay,
      requestedNights: numberOfNights
    };
  }

  if (conflicts.length > 0) {
    return {
      isAvailable: false,
      conflicts,
      reason: `${conflicts.length} date(s) unavailable in your selected range`
    };
  }

  return {
    isAvailable: true,
    conflicts: [],
    numberOfNights
  };
}

/**
 * Get minimum stay requirement for a date range
 */
async function getMinimumStayForDateRange(
  roomId: string,
  startDate: Date,
  endDate: Date
): Promise<number | null> {

  let maxMinStay: number | null = null;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const dateMinStay = await getMinimumStay(roomId, currentDate);
    if (dateMinStay && (!maxMinStay || dateMinStay > maxMinStay)) {
      maxMinStay = dateMinStay;
    }
    currentDate = addDays(currentDate, 1);
  }

  return maxMinStay;
}

/**
 * Get maximum stay restriction
 */
async function getMaximumStayForDateRange(
  roomId: string,
  startDate: Date,
  endDate: Date
): Promise<number | null> {

  let minMaxStay: number | null = null;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const availability = await prisma.roomAvailability.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: roomId,
          date: startOfDay(currentDate)
        }
      }
    });

    if (availability?.maxStay) {
      if (!minMaxStay || availability.maxStay < minMaxStay) {
        minMaxStay = availability.maxStay;
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return minMaxStay;
}

/**
 * Suggest alternative available dates near requested dates
 */
export async function suggestAlternativeDates(
  roomId: string,
  preferredCheckIn: Date,
  numberOfNights: number,
  searchRadius: number = 14
): Promise<DateSuggestion[]> {

  const suggestions: DateSuggestion[] = [];

  // Check dates before preferred date
  for (let i = 1; i <= searchRadius; i++) {
    const checkIn = subDays(preferredCheckIn, i);
    const checkOut = addDays(checkIn, numberOfNights);

    const availability = await checkDateRangeAvailability(roomId, checkIn, checkOut);

    if (availability.isAvailable) {
      // Get pricing for this date range
      const pricing = await getPricingForDateRange(roomId, checkIn, checkOut);
      suggestions.push({
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        totalPrice: pricing.total,
        avgPricePerNight: pricing.averagePricePerNight,
        daysDifferent: -i
      });
    }
  }

  // Check dates after preferred date
  for (let i = 1; i <= searchRadius; i++) {
    const checkIn = addDays(preferredCheckIn, i);
    const checkOut = addDays(checkIn, numberOfNights);

    const availability = await checkDateRangeAvailability(roomId, checkIn, checkOut);

    if (availability.isAvailable) {
      // Get pricing for this date range
      const pricing = await getPricingForDateRange(roomId, checkIn, checkOut);
      suggestions.push({
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        totalPrice: pricing.total,
        avgPricePerNight: pricing.averagePricePerNight,
        daysDifferent: i
      });
    }

    // Limit to 5 suggestions
    if (suggestions.length >= 5) break;
  }

  // Sort by price (cheapest first) and proximity
  return suggestions.sort((a, b) => {
    const priceDiff = a.totalPrice - b.totalPrice;
    if (Math.abs(priceDiff) > 50) return priceDiff;
    return Math.abs(a.daysDifferent) - Math.abs(b.daysDifferent);
  });
}

/**
 * Simple pricing calculation for date suggestions
 */
async function getPricingForDateRange(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ total: number; averagePricePerNight: number }> {

  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    select: { basePrice: true }
  });

  if (!room) return { total: 0, averagePricePerNight: 0 };

  const nights = differenceInDays(checkOut, checkIn);
  const total = room.basePrice * nights;

  return {
    total,
    averagePricePerNight: total / nights
  };
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

// New comprehensive interfaces for calendar system
export interface CalendarDateAvailability {
  date: string;
  isAvailable: boolean;
  availableUnits: number;
  totalUnits: number;
  occupancyPercent: number;
  reason?: 'BLOCKED' | 'FULLY_BOOKED' | null;
  blockReason?: string;
  minStay?: number | null;
  maxStay?: number | null;
  price: number | null;
}

export interface DateConflict {
  date: string;
  type: 'BLOCKED' | 'FULLY_BOOKED' | 'PARTIALLY_AVAILABLE';
  reason: string;
  availableUnits: number;
  requestedUnits?: number;
}

export interface DateRangeAvailabilityResult {
  isAvailable: boolean;
  conflicts: DateConflict[];
  reason?: string;
  minStay?: number;
  maxStay?: number;
  requestedNights?: number;
  numberOfNights?: number;
}

export interface DateSuggestion {
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  avgPricePerNight: number;
  daysDifferent: number; // negative = before, positive = after
}

