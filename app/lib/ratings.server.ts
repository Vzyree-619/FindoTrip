import { prisma } from "~/lib/db/db.server";
import { sendEmail } from "~/lib/email/email.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface RatingCalculation {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

interface ServiceRatingUpdate {
  serviceId: string;
  serviceType: 'property' | 'vehicle' | 'tour';
  newAverageRating: number;
  newTotalReviews: number;
}

interface ProviderRatingUpdate {
  providerId: string;
  newAverageRating: number;
  newTotalReviews: number;
}

// ========================================
// RATING CALCULATION FUNCTIONS
// ========================================

/**
 * Calculate average rating for a specific service
 */
export async function calculateServiceRating(serviceId: string, serviceType: 'property' | 'vehicle' | 'tour'): Promise<RatingCalculation> {
  try {
    // Get all reviews for this service
    const reviews = await prisma.review.findMany({
      where: {
        ...(serviceType === 'property' && { propertyId: serviceId }),
        ...(serviceType === 'vehicle' && { vehicleId: serviceId }),
        ...(serviceType === 'tour' && { tourId: serviceId }),
        isActive: true
      },
      select: {
        rating: true
      }
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: {
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0
        }
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal

    // Calculate rating breakdown
    const ratingBreakdown = {
      fiveStar: reviews.filter(r => r.rating === 5).length,
      fourStar: reviews.filter(r => r.rating === 4).length,
      threeStar: reviews.filter(r => r.rating === 3).length,
      twoStar: reviews.filter(r => r.rating === 2).length,
      oneStar: reviews.filter(r => r.rating === 1).length
    };

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingBreakdown
    };
  } catch (error) {
    console.error("Error calculating service rating:", error);
    throw new Error("Failed to calculate service rating");
  }
}

/**
 * Update service rating in database
 */
export async function updateServiceRating(serviceId: string, serviceType: 'property' | 'vehicle' | 'tour'): Promise<ServiceRatingUpdate> {
  try {
    const ratingData = await calculateServiceRating(serviceId, serviceType);

    // Update the appropriate service table
    let updatedService;
    if (serviceType === 'property') {
      updatedService = await prisma.property.update({
        where: { id: serviceId },
        data: {
          averageRating: ratingData.averageRating,
          totalReviews: ratingData.totalReviews
        }
      });
    } else if (serviceType === 'vehicle') {
      updatedService = await prisma.vehicle.update({
        where: { id: serviceId },
        data: {
          averageRating: ratingData.averageRating,
          totalReviews: ratingData.totalReviews
        }
      });
    } else if (serviceType === 'tour') {
      updatedService = await prisma.tour.update({
        where: { id: serviceId },
        data: {
          averageRating: ratingData.averageRating,
          totalReviews: ratingData.totalReviews
        }
      });
    }

    return {
      serviceId,
      serviceType,
      newAverageRating: ratingData.averageRating,
      newTotalReviews: ratingData.totalReviews
    };
  } catch (error) {
    console.error("Error updating service rating:", error);
    throw new Error("Failed to update service rating");
  }
}

/**
 * Calculate provider's overall rating across all their services
 */
export async function calculateProviderRating(providerId: string): Promise<RatingCalculation> {
  try {
    // Get all reviews for all services owned by this provider
    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { property: { ownerId: providerId } },
          { vehicle: { ownerId: providerId } },
          { tour: { guideId: providerId } }
        ],
        isActive: true
      },
      select: {
        rating: true
      }
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: {
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0
        }
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    // Calculate rating breakdown
    const ratingBreakdown = {
      fiveStar: reviews.filter(r => r.rating === 5).length,
      fourStar: reviews.filter(r => r.rating === 4).length,
      threeStar: reviews.filter(r => r.rating === 3).length,
      twoStar: reviews.filter(r => r.rating === 2).length,
      oneStar: reviews.filter(r => r.rating === 1).length
    };

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingBreakdown
    };
  } catch (error) {
    console.error("Error calculating provider rating:", error);
    throw new Error("Failed to calculate provider rating");
  }
}

/**
 * Update provider's overall rating
 */
export async function updateProviderRating(providerId: string): Promise<ProviderRatingUpdate> {
  try {
    const ratingData = await calculateProviderRating(providerId);

    // Update provider's overall rating
    await prisma.user.update({
      where: { id: providerId },
      data: {
        averageRating: ratingData.averageRating,
        totalReviews: ratingData.totalReviews
      }
    });

    return {
      providerId,
      newAverageRating: ratingData.averageRating,
      newTotalReviews: ratingData.totalReviews
    };
  } catch (error) {
    console.error("Error updating provider rating:", error);
    throw new Error("Failed to update provider rating");
  }
}

// ========================================
// REVIEW REQUEST SYSTEM
// ========================================

/**
 * Create review request after booking completion
 */
export async function createReviewRequest(bookingId: string, bookingType: 'property' | 'vehicle' | 'tour'): Promise<void> {
  try {
    // Get booking details
    let booking;
    if (bookingType === 'property') {
      booking = await prisma.propertyBooking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: { id: true, title: true, ownerId: true }
          },
          customer: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } else if (bookingType === 'vehicle') {
      booking = await prisma.vehicleBooking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            select: { id: true, name: true, ownerId: true }
          },
          customer: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } else if (bookingType === 'tour') {
      booking = await prisma.tourBooking.findUnique({
        where: { id: bookingId },
        include: {
          tour: {
            select: { id: true, title: true, guideId: true }
          },
          customer: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    }

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if review request already exists
    const existingRequest = await prisma.reviewRequest.findFirst({
      where: {
        bookingId,
        bookingType,
        isActive: true
      }
    });

    if (existingRequest) {
      return; // Review request already exists
    }

    // Create review request
    await prisma.reviewRequest.create({
      data: {
        bookingId,
        bookingType,
        customerId: booking.customer.id,
        serviceId: bookingType === 'property' ? booking.property.id : 
                   bookingType === 'vehicle' ? booking.vehicle.id : booking.tour.id,
        serviceType: bookingType,
        providerId: bookingType === 'property' ? booking.property.ownerId :
                   bookingType === 'vehicle' ? booking.vehicle.ownerId : booking.tour.guideId,
        status: 'PENDING',
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Send email notification to customer
    await sendReviewRequestEmail(booking.customer.email, booking.customer.name, bookingId, bookingType);

  } catch (error) {
    console.error("Error creating review request:", error);
    throw new Error("Failed to create review request");
  }
}

/**
 * Send review request email to customer
 */
async function sendReviewRequestEmail(customerEmail: string, customerName: string, bookingId: string, bookingType: string): Promise<void> {
  try {
    const reviewUrl = `${process.env.APP_URL}/booking/${bookingId}/review`;
    
    await sendEmail({
      to: customerEmail,
      subject: `How was your ${bookingType} experience?`,
      template: 'review-request',
      data: {
        customerName,
        bookingType,
        reviewUrl,
        serviceName: `${bookingType} booking`
      }
    });
  } catch (error) {
    console.error("Error sending review request email:", error);
    // Don't throw error - email failure shouldn't break the flow
  }
}

// ========================================
// REVIEW SUBMISSION PROCESSING
// ========================================

/**
 * Process review submission and update ratings
 */
export async function processReviewSubmission(
  reviewId: string,
  serviceId: string,
  serviceType: 'property' | 'vehicle' | 'tour',
  providerId: string
): Promise<void> {
  try {
    // Update service rating
    await updateServiceRating(serviceId, serviceType);

    // Update provider rating
    await updateProviderRating(providerId);

    // Mark review request as completed
    await prisma.reviewRequest.updateMany({
      where: {
        serviceId,
        serviceType,
        status: 'PENDING'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Notify provider of new review
    await notifyProviderOfNewReview(providerId, reviewId);

  } catch (error) {
    console.error("Error processing review submission:", error);
    throw new Error("Failed to process review submission");
  }
}

/**
 * Notify provider of new review
 */
async function notifyProviderOfNewReview(providerId: string, reviewId: string): Promise<void> {
  try {
    // Get provider details
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
      select: { id: true, name: true, email: true }
    });

    if (!provider) return;

    // Get review details
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          select: { name: true }
        }
      }
    });

    if (!review) return;

    // Send notification email
    await sendEmail({
      to: provider.email,
      subject: `New review from ${review.customer.name}`,
      template: 'new-review-notification',
      data: {
        providerName: provider.name,
        customerName: review.customer.name,
        rating: review.rating,
        comment: review.comment,
        reviewUrl: `${process.env.APP_URL}/dashboard/reviews`
      }
    });

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: 'REVIEW',
        title: 'New Review Received',
        message: `You received a ${review.rating}-star review from ${review.customer.name}`,
        data: {
          reviewId,
          rating: review.rating,
          customerName: review.customer.name
        }
      }
    });

  } catch (error) {
    console.error("Error notifying provider of new review:", error);
    // Don't throw error - notification failure shouldn't break the flow
  }
}

// ========================================
// RATING THRESHOLD ALERTS
// ========================================

/**
 * Check if provider rating drops below threshold
 */
export async function checkRatingThreshold(providerId: string, threshold: number = 3.0): Promise<boolean> {
  try {
    const ratingData = await calculateProviderRating(providerId);
    return ratingData.averageRating < threshold;
  } catch (error) {
    console.error("Error checking rating threshold:", error);
    return false;
  }
}

/**
 * Send rating alert to provider
 */
export async function sendRatingAlert(providerId: string): Promise<void> {
  try {
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
      select: { id: true, name: true, email: true, averageRating: true }
    });

    if (!provider) return;

    await sendEmail({
      to: provider.email,
      subject: 'Rating Alert - Action Required',
      template: 'rating-alert',
      data: {
        providerName: provider.name,
        currentRating: provider.averageRating,
        improvementTips: [
          'Respond to customer messages quickly',
          'Provide detailed service descriptions',
          'Be available during peak hours',
          'Follow up after service completion'
        ]
      }
    });

    // Create in-app alert
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: 'ALERT',
        title: 'Rating Alert',
        message: `Your rating has dropped below 3.0. Consider improving your service quality.`,
        priority: 'HIGH'
      }
    });

  } catch (error) {
    console.error("Error sending rating alert:", error);
  }
}
