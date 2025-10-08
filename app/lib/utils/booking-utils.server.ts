import { prisma } from "~/lib/db/db.server";
import { sendReviewInviteForBooking } from "~/lib/reviews.server";
import { BookingStatus, PaymentStatus, NotificationType, UserRole } from "@prisma/client";

export interface BookingNotification {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  userRole: UserRole;
  actionUrl?: string;
  data?: any;
}

export interface AvailabilityCheck {
  isAvailable: boolean;
  conflictingBookings: any[];
  unavailableDates: any[];
}

/**
 * Check availability for a service within a date range
 */
export async function checkServiceAvailability(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  startDate: Date,
  endDate: Date,
  timeSlot?: string
): Promise<AvailabilityCheck> {
  let conflictingBookings: any[] = [];
  let unavailableDates: any[] = [];

  // Check for conflicting bookings
  if (serviceType === "property") {
    conflictingBookings = await prisma.propertyBooking.findMany({
      where: {
        propertyId: serviceId,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            checkIn: { lte: endDate },
            checkOut: { gte: startDate },
          },
        ],
      },
    });
  } else if (serviceType === "vehicle") {
    conflictingBookings = await prisma.vehicleBooking.findMany({
      where: {
        vehicleId: serviceId,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });
  } else if (serviceType === "tour") {
    conflictingBookings = await prisma.tourBooking.findMany({
      where: {
        tourId: serviceId,
        status: { in: ["CONFIRMED", "PENDING"] },
        tourDate: startDate,
        ...(timeSlot && { timeSlot }),
      },
    });
  }

  // Check unavailable dates
  unavailableDates = await prisma.unavailableDate.findMany({
    where: {
      serviceId,
      serviceType,
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  const isAvailable = conflictingBookings.length === 0 && unavailableDates.length === 0;

  return {
    isAvailable,
    conflictingBookings,
    unavailableDates,
  };
}

/**
 * Generate a unique booking number
 */
export function generateBookingNumber(serviceType: "property" | "vehicle" | "tour"): string {
  const prefix = serviceType === "property" ? "PB" : serviceType === "vehicle" ? "VB" : "TB";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Calculate pricing for a booking
 */
export function calculateBookingPricing(
  basePrice: number,
  duration: number,
  options: {
    cleaningFee?: number;
    serviceFee?: number;
    driverFee?: number;
    insuranceFee?: number;
    securityDeposit?: number;
    taxRate?: number;
    childDiscount?: number;
    groupDiscount?: number;
  }
) {
  const {
    cleaningFee = 0,
    serviceFee = 0,
    driverFee = 0,
    insuranceFee = 0,
    securityDeposit = 0,
    taxRate = 0,
    childDiscount = 0,
    groupDiscount = 0,
  } = options;

  const subtotal = basePrice * duration;
  const fees = cleaningFee + serviceFee + driverFee + insuranceFee;
  const discounts = childDiscount + groupDiscount;
  const taxableAmount = subtotal + fees - discounts;
  const taxes = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxes + securityDeposit;

  return {
    basePrice: subtotal,
    cleaningFee,
    serviceFee,
    driverFee,
    insuranceFee,
    securityDeposit,
    taxes,
    discounts,
    total,
  };
}

/**
 * Create booking notifications
 */
export async function createBookingNotifications(
  bookingId: string,
  bookingType: "property" | "vehicle" | "tour",
  customerId: string,
  providerId: string,
  bookingNumber: string,
  serviceName: string
): Promise<void> {
  const notifications: BookingNotification[] = [];

  // Customer notification
  notifications.push({
    type: "BOOKING_CONFIRMED",
    title: "Booking Confirmed!",
    message: `Your ${bookingType} booking has been confirmed. Booking number: ${bookingNumber}`,
    userId: customerId,
    userRole: "CUSTOMER",
    actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
    },
  });

  // Provider notification
  let providerRole: UserRole = "PROPERTY_OWNER";
  if (bookingType === "property") providerRole = "PROPERTY_OWNER";
  else if (bookingType === "vehicle") providerRole = "VEHICLE_OWNER";
  else if (bookingType === "tour") providerRole = "TOUR_GUIDE";

  notifications.push({
    type: "BOOKING_CONFIRMED",
    title: "New Booking Received!",
    message: `You have received a new ${bookingType} booking. Booking number: ${bookingNumber}`,
    userId: providerId,
    userRole: providerRole,
    actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
    },
  });

  // Create all notifications
  await prisma.notification.createMany({
    data: notifications.map(notification => ({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      userRole: notification.userRole,
      actionUrl: notification.actionUrl,
      data: notification.data,
    })),
  });
}

/**
 * Update booking status and handle related operations
 */
export async function updateBookingStatus(
  bookingId: string,
  bookingType: "property" | "vehicle" | "tour",
  status: BookingStatus,
  paymentStatus?: PaymentStatus,
  reason?: string
): Promise<void> {
  const updateData: any = { status };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (reason) updateData.cancellationReason = reason;
  if (status === "CANCELLED") updateData.cancelledAt = new Date();

  if (bookingType === "property") {
    await prisma.propertyBooking.update({
      where: { id: bookingId },
      data: updateData,
    });
  } else if (bookingType === "vehicle") {
    await prisma.vehicleBooking.update({
      where: { id: bookingId },
      data: updateData,
    });
  } else if (bookingType === "tour") {
    await prisma.tourBooking.update({
      where: { id: bookingId },
      data: updateData,
    });
  }

  // Create status change notification
  const booking = await getBookingById(bookingId, bookingType);
  if (booking) {
    await createStatusChangeNotification(bookingId, bookingType, status, booking.userId, reason);
    // When a booking is completed, invite the customer to write a review
    if (status === "COMPLETED") {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      await sendReviewInviteForBooking(bookingType, bookingId, appUrl);
    }
  }
}

/**
 * Get booking by ID and type
 */
export async function getBookingById(bookingId: string, bookingType: "property" | "vehicle" | "tour") {
  if (bookingType === "property") {
    return await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } else if (bookingType === "vehicle") {
    return await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: {
          select: {
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } else if (bookingType === "tour") {
    return await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: {
        tour: {
          select: {
            title: true,
            guideId: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
  return null;
}

/**
 * Create status change notification
 */
async function createStatusChangeNotification(
  bookingId: string,
  bookingType: "property" | "vehicle" | "tour",
  status: BookingStatus,
  userId: string,
  reason?: string
): Promise<void> {
  let title: string;
  let message: string;
  let notificationType: NotificationType;

  switch (status) {
    case "CONFIRMED":
      title = "Booking Confirmed";
      message = "Your booking has been confirmed.";
      notificationType = "BOOKING_CONFIRMED";
      break;
    case "CANCELLED":
      title = "Booking Cancelled";
      message = reason ? `Your booking has been cancelled: ${reason}` : "Your booking has been cancelled.";
      notificationType = "BOOKING_CANCELLED";
      break;
    case "COMPLETED":
      title = "Booking Completed";
      message = "Your booking has been completed.";
      notificationType = "BOOKING_CONFIRMED";
      break;
    default:
      title = "Booking Status Updated";
      message = `Your booking status has been updated to ${status.toLowerCase()}.`;
      notificationType = "BOOKING_CONFIRMED";
  }

  await prisma.notification.create({
    data: {
      type: notificationType,
      title,
      message,
      userId,
      userRole: "CUSTOMER",
      actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
      data: {
        bookingId,
        bookingType,
        status,
        reason,
      },
    },
  });
}

/**
 * Calculate commission for a booking
 */
export async function calculateCommission(
  bookingId: string,
  bookingType: "property" | "vehicle" | "tour",
  providerId: string,
  totalAmount: number,
  commissionRate: number = 0.1
): Promise<void> {
  const commissionAmount = totalAmount * commissionRate;

  await prisma.commission.create({
    data: {
      amount: commissionAmount,
      percentage: commissionRate * 100,
      currency: "PKR", // Default currency
      status: "PENDING",
      bookingId,
      bookingType,
      serviceId: providerId,
      serviceType: bookingType,
      userId: providerId,
      calculatedAt: new Date(),
    },
  });
}

/**
 * Update service statistics after booking
 */
export async function updateServiceStatistics(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  bookingAmount: number
): Promise<void> {
  if (serviceType === "property") {
    await prisma.property.update({
      where: { id: serviceId },
      data: {
        totalBookings: { increment: 1 },
      },
    });
  } else if (serviceType === "vehicle") {
    await prisma.vehicle.update({
      where: { id: serviceId },
      data: {
        totalBookings: { increment: 1 },
      },
    });
  } else if (serviceType === "tour") {
    await prisma.tour.update({
      where: { id: serviceId },
      data: {
        totalBookings: { increment: 1 },
      },
    });
  }
}

/**
 * Block dates for a service
 */
export async function blockServiceDates(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  startDate: Date,
  endDate: Date,
  reason: string = "booked",
  ownerId: string
): Promise<void> {
  await prisma.unavailableDate.create({
    data: {
      serviceId,
      serviceType,
      startDate,
      endDate,
      reason,
      type: "booked",
      ownerId,
    },
  });
}

/**
 * Send booking confirmation email (placeholder)
 */
export async function sendBookingConfirmationEmail(
  userEmail: string,
  bookingNumber: string,
  serviceName: string,
  bookingType: "property" | "vehicle" | "tour",
  totalAmount: number,
  currency: string
): Promise<void> {
  // In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
  console.log(`Sending confirmation email to ${userEmail} for booking ${bookingNumber}`);
  
  // Placeholder for email sending logic
  // await emailService.send({
  //   to: userEmail,
  //   subject: `Booking Confirmation - ${bookingNumber}`,
  //   template: 'booking-confirmation',
  //   data: {
  //     bookingNumber,
  //     serviceName,
  //     bookingType,
  //     totalAmount,
  //     currency,
  //   }
  // });
}

/**
 * Generate booking voucher data
 */
export function generateBookingVoucher(
  booking: any,
  service: any,
  provider: any
): {
  bookingNumber: string;
  serviceName: string;
  providerName: string;
  dates: string;
  totalAmount: number;
  currency: string;
  qrCode: string;
} {
  const qrCode = `BOOKING:${booking.bookingNumber}|SERVICE:${service?.name || service?.title}|AMOUNT:${booking.totalPrice}`;
  
  return {
    bookingNumber: booking.bookingNumber,
    serviceName: service?.name || service?.title,
    providerName: provider?.user?.name || provider?.firstName + " " + provider?.lastName,
    dates: booking.checkIn ? 
      `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}` :
      `${new Date(booking.tourDate).toLocaleDateString()}`,
    totalAmount: booking.totalPrice,
    currency: booking.currency,
    qrCode,
  };
}
