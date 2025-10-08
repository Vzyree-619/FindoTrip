import { prisma } from "~/lib/db/db.server";
import { createReviewRequest } from "~/lib/ratings.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface BookingCompletionData {
  bookingId: string;
  bookingType: 'property' | 'vehicle' | 'tour';
  customerId: string;
  serviceId: string;
  providerId: string;
  endDate: Date;
}

// ========================================
// REVIEW REQUEST AUTOMATION
// ========================================

/**
 * Check for completed bookings and create review requests
 * This should be called by a cron job or scheduled task
 */
export async function processCompletedBookings(): Promise<void> {
  try {
    const now = new Date();
    
    // Find all bookings that ended in the last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get completed property bookings
    const completedPropertyBookings = await prisma.propertyBooking.findMany({
      where: {
        status: 'COMPLETED',
        endDate: {
          gte: yesterday,
          lte: now
        }
      },
      select: {
        id: true,
        customerId: true,
        propertyId: true,
        property: {
          select: { ownerId: true }
        }
      }
    });

    // Get completed vehicle bookings
    const completedVehicleBookings = await prisma.vehicleBooking.findMany({
      where: {
        status: 'COMPLETED',
        endDate: {
          gte: yesterday,
          lte: now
        }
      },
      select: {
        id: true,
        customerId: true,
        vehicleId: true,
        vehicle: {
          select: { ownerId: true }
        }
      }
    });

    // Get completed tour bookings
    const completedTourBookings = await prisma.tourBooking.findMany({
      where: {
        status: 'COMPLETED',
        endDate: {
          gte: yesterday,
          lte: now
        }
      },
      select: {
        id: true,
        customerId: true,
        tourId: true,
        tour: {
          select: { guideId: true }
        }
      }
    });

    // Process each completed booking
    const allBookings: BookingCompletionData[] = [
      ...completedPropertyBookings.map(booking => ({
        bookingId: booking.id,
        bookingType: 'property' as const,
        customerId: booking.customerId,
        serviceId: booking.propertyId,
        providerId: booking.property.ownerId,
        endDate: new Date() // Will be updated with actual end date
      })),
      ...completedVehicleBookings.map(booking => ({
        bookingId: booking.id,
        bookingType: 'vehicle' as const,
        customerId: booking.customerId,
        serviceId: booking.vehicleId,
        providerId: booking.vehicle.ownerId,
        endDate: new Date() // Will be updated with actual end date
      })),
      ...completedTourBookings.map(booking => ({
        bookingId: booking.id,
        bookingType: 'tour' as const,
        customerId: booking.customerId,
        serviceId: booking.tourId,
        providerId: booking.tour.guideId,
        endDate: new Date() // Will be updated with actual end date
      }))
    ];

    // Create review requests for each booking
    for (const booking of allBookings) {
      try {
        await createReviewRequest(booking.bookingId, booking.bookingType);
        console.log(`Created review request for booking ${booking.bookingId}`);
      } catch (error) {
        console.error(`Failed to create review request for booking ${booking.bookingId}:`, error);
      }
    }

    console.log(`Processed ${allBookings.length} completed bookings for review requests`);

  } catch (error) {
    console.error("Error processing completed bookings:", error);
    throw new Error("Failed to process completed bookings");
  }
}

/**
 * Create review request for a specific booking
 */
export async function createReviewRequestForBooking(bookingId: string): Promise<void> {
  try {
    // Check if it's a property booking
    const propertyBooking = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, endDate: true }
    });

    if (propertyBooking && propertyBooking.status === 'COMPLETED') {
      await createReviewRequest(bookingId, 'property');
      return;
    }

    // Check if it's a vehicle booking
    const vehicleBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, endDate: true }
    });

    if (vehicleBooking && vehicleBooking.status === 'COMPLETED') {
      await createReviewRequest(bookingId, 'vehicle');
      return;
    }

    // Check if it's a tour booking
    const tourBooking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, endDate: true }
    });

    if (tourBooking && tourBooking.status === 'COMPLETED') {
      await createReviewRequest(bookingId, 'tour');
      return;
    }

    throw new Error("Booking not found or not completed");

  } catch (error) {
    console.error("Error creating review request for booking:", error);
    throw new Error("Failed to create review request");
  }
}

/**
 * Get pending review requests for a customer
 */
export async function getPendingReviewRequests(customerId: string): Promise<any[]> {
  try {
    const reviewRequests = await prisma.reviewRequest.findMany({
      where: {
        customerId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        property: {
          select: { id: true, title: true, images: true }
        },
        vehicle: {
          select: { id: true, name: true, images: true }
        },
        tour: {
          select: { id: true, title: true, images: true }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    return reviewRequests.map(request => ({
      id: request.id,
      bookingId: request.bookingId,
      bookingType: request.bookingType,
      serviceId: request.serviceId,
      serviceType: request.serviceType,
      service: request.property || request.vehicle || request.tour,
      expiresAt: request.expiresAt,
      requestedAt: request.requestedAt
    }));

  } catch (error) {
    console.error("Error getting pending review requests:", error);
    return [];
  }
}

/**
 * Mark review request as completed
 */
export async function markReviewRequestCompleted(
  reviewRequestId: string,
  reviewId: string
): Promise<void> {
  try {
    await prisma.reviewRequest.update({
      where: { id: reviewRequestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        reviewId
      }
    });
  } catch (error) {
    console.error("Error marking review request as completed:", error);
    throw new Error("Failed to mark review request as completed");
  }
}

/**
 * Get review request statistics
 */
export async function getReviewRequestStats(providerId: string): Promise<{
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  expiredRequests: number;
  completionRate: number;
}> {
  try {
    const stats = await prisma.reviewRequest.groupBy({
      by: ['status'],
      where: {
        providerId
      },
      _count: {
        id: true
      }
    });

    const totalRequests = stats.reduce((sum, stat) => sum + stat._count.id, 0);
    const completedRequests = stats.find(s => s.status === 'COMPLETED')?._count.id || 0;
    const pendingRequests = stats.find(s => s.status === 'PENDING')?._count.id || 0;
    const expiredRequests = stats.find(s => s.status === 'EXPIRED')?._count.id || 0;
    const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      completedRequests,
      pendingRequests,
      expiredRequests,
      completionRate: Math.round(completionRate)
    };

  } catch (error) {
    console.error("Error getting review request stats:", error);
    return {
      totalRequests: 0,
      completedRequests: 0,
      pendingRequests: 0,
      expiredRequests: 0,
      completionRate: 0
    };
  }
}

/**
 * Clean up expired review requests
 */
export async function cleanupExpiredReviewRequests(): Promise<void> {
  try {
    const now = new Date();
    
    // Mark expired review requests
    await prisma.reviewRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    console.log("Cleaned up expired review requests");

  } catch (error) {
    console.error("Error cleaning up expired review requests:", error);
  }
}

/**
 * Send reminder emails for pending review requests
 */
export async function sendReviewReminders(): Promise<void> {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get pending review requests older than 3 days
    const pendingRequests = await prisma.reviewRequest.findMany({
      where: {
        status: 'PENDING',
        requestedAt: { lt: threeDaysAgo },
        expiresAt: { gt: new Date() }
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send reminder emails
    for (const request of pendingRequests) {
      try {
        // This would integrate with your email service
        console.log(`Sending review reminder to ${request.customer.email}`);
        // await sendReviewReminderEmail(request.customer.email, request.customer.name, request.bookingId);
      } catch (error) {
        console.error(`Failed to send reminder for request ${request.id}:`, error);
      }
    }

    console.log(`Sent ${pendingRequests.length} review reminders`);

  } catch (error) {
    console.error("Error sending review reminders:", error);
  }
}
