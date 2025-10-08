import { prisma } from "~/lib/db/db.server";
import type { BookingStatus } from "@prisma/client";
import { createBookingNotifications, notifyBookingConfirmation, notifyProviderNewBooking } from "./notifications.server";
import { calculateCommission, createCommission } from "./commission.server";
import { blockServiceDates } from "./calendar.server";

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

/**
 * Create a new booking with full integration
 */
export async function createBookingWithIntegration(
  bookingData: any,
  bookingType: BookingType,
  customerId: string,
  providerId: string,
  serviceName: string
) {
  // Create the booking
  let booking;
  if (bookingType === "property") {
    booking = await prisma.propertyBooking.create({
      data: bookingData,
    });
  } else if (bookingType === "vehicle") {
    booking = await prisma.vehicleBooking.create({
      data: bookingData,
    });
  } else if (bookingType === "tour") {
    booking = await prisma.tourBooking.create({
      data: bookingData,
    });
  }

  if (!booking) {
    throw new Error("Failed to create booking");
  }

  // Create notifications
  await createBookingNotifications(
    booking.id,
    bookingType,
    customerId,
    providerId,
    booking.bookingNumber,
    serviceName
  );

  // Calculate and create commission
  const commission = await calculateCommission(
    booking.id,
    bookingType,
    bookingData.propertyId || bookingData.vehicleId || bookingData.tourId,
    providerId,
    booking.totalPrice
  );
  await createCommission(commission);

  // Block service dates
  if (bookingType === "property") {
    await blockServiceDates(
      bookingData.propertyId,
      "property",
      new Date(booking.checkIn),
      new Date(booking.checkOut),
      "booked",
      providerId
    );
  } else if (bookingType === "vehicle") {
    await blockServiceDates(
      bookingData.vehicleId,
      "vehicle",
      new Date(booking.startDate),
      new Date(booking.endDate),
      "booked",
      providerId
    );
  } else if (bookingType === "tour") {
    await blockServiceDates(
      bookingData.tourId,
      "tour",
      new Date(booking.tourDate),
      new Date(booking.tourDate),
      "booked",
      providerId
    );
  }

  return booking;
}

/**
 * Confirm a booking and handle all related operations
 */
export async function confirmBooking(
  bookingId: string,
  bookingType: BookingType,
  paymentId: string
) {
  // Update booking status
  await updateBookingStatus(bookingId, bookingType, "CONFIRMED");

  // Get booking details for notifications
  const booking = await getBooking(bookingId, bookingType);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Get service and provider details
  let serviceName: string;
  let providerId: string;
  let customerId: string;

  if (bookingType === "property") {
    const propertyBooking = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            name: true,
            ownerId: true,
          },
        },
      },
    });
    serviceName = propertyBooking?.property?.name || "Property";
    providerId = propertyBooking?.property?.ownerId || "";
    customerId = propertyBooking?.userId || "";
  } else if (bookingType === "vehicle") {
    const vehicleBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: {
          select: {
            name: true,
            ownerId: true,
          },
        },
      },
    });
    serviceName = vehicleBooking?.vehicle?.name || "Vehicle";
    providerId = vehicleBooking?.vehicle?.ownerId || "";
    customerId = vehicleBooking?.userId || "";
  } else if (bookingType === "tour") {
    const tourBooking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: {
        tour: {
          select: {
            title: true,
            guideId: true,
          },
        },
      },
    });
    serviceName = tourBooking?.tour?.title || "Tour";
    providerId = tourBooking?.tour?.guideId || "";
    customerId = tourBooking?.userId || "";
  }

  // Send notifications
  await notifyBookingConfirmation(
    customerId,
    booking.bookingNumber,
    serviceName,
    bookingType,
    bookingId
  );

  // Notify provider
  const providerRole = bookingType === "property" ? "PROPERTY_OWNER" :
                      bookingType === "vehicle" ? "VEHICLE_OWNER" : "TOUR_GUIDE";
  
  await notifyProviderNewBooking(
    providerId,
    providerRole,
    booking.bookingNumber,
    serviceName,
    bookingType,
    bookingId,
    "Customer" // This should be the actual customer name
  );

  return booking;
}

/**
 * Cancel a booking with full cleanup
 */
export async function cancelBookingWithCleanup(
  bookingId: string,
  bookingType: BookingType,
  cancellationReason?: string
) {
  // Cancel the booking
  await cancelBooking(bookingId, bookingType, cancellationReason);

  // Get booking details
  const booking = await getBooking(bookingId, bookingType);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Unblock service dates
  if (bookingType === "property") {
    const propertyBooking = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      select: { propertyId: true, checkIn: true, checkOut: true },
    });
    if (propertyBooking) {
      await prisma.unavailableDate.deleteMany({
        where: {
          serviceId: propertyBooking.propertyId,
          serviceType: "property",
          startDate: new Date(propertyBooking.checkIn),
          endDate: new Date(propertyBooking.checkOut),
          type: "booked",
        },
      });
    }
  } else if (bookingType === "vehicle") {
    const vehicleBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      select: { vehicleId: true, startDate: true, endDate: true },
    });
    if (vehicleBooking) {
      await prisma.unavailableDate.deleteMany({
        where: {
          serviceId: vehicleBooking.vehicleId,
          serviceType: "vehicle",
          startDate: new Date(vehicleBooking.startDate),
          endDate: new Date(vehicleBooking.endDate),
          type: "booked",
        },
      });
    }
  } else if (bookingType === "tour") {
    const tourBooking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      select: { tourId: true, tourDate: true },
    });
    if (tourBooking) {
      await prisma.unavailableDate.deleteMany({
        where: {
          serviceId: tourBooking.tourId,
          serviceType: "tour",
          startDate: new Date(tourBooking.tourDate),
          endDate: new Date(tourBooking.tourDate),
          type: "booked",
        },
      });
    }
  }

  return booking;
}

