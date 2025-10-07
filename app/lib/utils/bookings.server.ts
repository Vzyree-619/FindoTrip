import { prisma } from "~/lib/db/db.server";
import type { BookingStatus } from "@prisma/client";

export type BookingType = "property" | "vehicle" | "tour";

export interface UnifiedBooking {
  id: string;
  bookingNumber: string;
  userId: string;
  status: BookingStatus;
  totalPrice: number;
  currency: string;
  type: BookingType;
  createdAt: Date;
  updatedAt: Date;
  // Type-specific fields
  checkIn?: Date;
  checkOut?: Date;
  startDate?: Date;
  endDate?: Date;
  tourDate?: Date;
  // References
  propertyId?: string;
  vehicleId?: string;
  tourId?: string;
}

/**
 * Get all bookings for a user across all booking types
 */
export async function getUserBookings(userId: string, status?: BookingStatus | BookingStatus[]) {
  const statusFilter = status 
    ? (Array.isArray(status) ? { in: status } : status)
    : undefined;

  const whereClause = statusFilter 
    ? { userId, status: statusFilter }
    : { userId };

  const [propertyBookings, vehicleBookings, tourBookings] = await Promise.all([
    prisma.propertyBooking.findMany({
      where: whereClause,
      include: {
        // Add any relations you need
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicleBooking.findMany({
      where: whereClause,
      include: {
        // Add any relations you need
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tourBooking.findMany({
      where: whereClause,
      include: {
        // Add any relations you need
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Combine and transform to unified format
  const unifiedBookings: UnifiedBooking[] = [
    ...propertyBookings.map(b => ({
      ...b,
      type: 'property' as BookingType,
      propertyId: b.propertyId,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
    })),
    ...vehicleBookings.map(b => ({
      ...b,
      type: 'vehicle' as BookingType,
      vehicleId: b.vehicleId,
      startDate: b.startDate,
      endDate: b.endDate,
    })),
    ...tourBookings.map(b => ({
      ...b,
      type: 'tour' as BookingType,
      tourId: b.tourId,
      guideId: b.guideId,
      tourDate: b.tourDate,
    })),
  ];

  // Sort by creation date
  return unifiedBookings.sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}

/**
 * Get a single booking by ID and type
 */
export async function getBooking(bookingId: string, type: BookingType) {
  switch (type) {
    case 'property':
      return await prisma.propertyBooking.findUnique({
        where: { id: bookingId },
      });
    case 'vehicle':
      return await prisma.vehicleBooking.findUnique({
        where: { id: bookingId },
      });
    case 'tour':
      return await prisma.tourBooking.findUnique({
        where: { id: bookingId },
      });
    default:
      throw new Error(`Invalid booking type: ${type}`);
  }
}

/**
 * Get a booking by booking number (searches across all types)
 */
export async function getBookingByNumber(bookingNumber: string) {
  const [propertyBooking, vehicleBooking, tourBooking] = await Promise.all([
    prisma.propertyBooking.findUnique({
      where: { bookingNumber },
    }),
    prisma.vehicleBooking.findUnique({
      where: { bookingNumber },
    }),
    prisma.tourBooking.findUnique({
      where: { bookingNumber },
    }),
  ]);

  if (propertyBooking) {
    return { ...propertyBooking, type: 'property' as BookingType };
  }
  if (vehicleBooking) {
    return { ...vehicleBooking, type: 'vehicle' as BookingType };
  }
  if (tourBooking) {
    return { ...tourBooking, type: 'tour' as BookingType };
  }

  return null;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  type: BookingType,
  status: BookingStatus
) {
  switch (type) {
    case 'property':
      return await prisma.propertyBooking.update({
        where: { id: bookingId },
        data: { status },
      });
    case 'vehicle':
      return await prisma.vehicleBooking.update({
        where: { id: bookingId },
        data: { status },
      });
    case 'tour':
      return await prisma.tourBooking.update({
        where: { id: bookingId },
        data: { status },
      });
    default:
      throw new Error(`Invalid booking type: ${type}`);
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  type: BookingType,
  cancellationReason?: string
) {
  const data = {
    status: 'CANCELLED' as BookingStatus,
    cancelledAt: new Date(),
    cancellationReason,
  };

  switch (type) {
    case 'property':
      return await prisma.propertyBooking.update({
        where: { id: bookingId },
        data,
      });
    case 'vehicle':
      return await prisma.vehicleBooking.update({
        where: { id: bookingId },
        data,
      });
    case 'tour':
      return await prisma.tourBooking.update({
        where: { id: bookingId },
        data,
      });
    default:
      throw new Error(`Invalid booking type: ${type}`);
  }
}

/**
 * Get bookings count for a user
 */
export async function getUserBookingsCount(
  userId: string,
  status?: BookingStatus | BookingStatus[]
) {
  const statusFilter = status 
    ? (Array.isArray(status) ? { in: status } : status)
    : undefined;

  const whereClause = statusFilter 
    ? { userId, status: statusFilter }
    : { userId };

  const [propertyCount, vehicleCount, tourCount] = await Promise.all([
    prisma.propertyBooking.count({ where: whereClause }),
    prisma.vehicleBooking.count({ where: whereClause }),
    prisma.tourBooking.count({ where: whereClause }),
  ]);

  return propertyCount + vehicleCount + tourCount;
}

