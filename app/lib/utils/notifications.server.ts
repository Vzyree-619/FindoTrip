import { prisma } from "~/lib/db/db.server";
import { NotificationType, UserRole } from "@prisma/client";

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  userRole: UserRole;
  actionUrl?: string;
  data?: any;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

/**
 * Create a notification for a user
 */
export async function createNotification(notificationData: NotificationData): Promise<void> {
  await prisma.notification.create({
    data: {
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      userId: notificationData.userId,
      userRole: notificationData.userRole,
      actionUrl: notificationData.actionUrl,
      data: notificationData.data,
      priority: notificationData.priority || "NORMAL",
    },
  });
}

/**
 * Create multiple notifications at once
 */
export async function createNotifications(notifications: NotificationData[]): Promise<void> {
  await prisma.notification.createMany({
    data: notifications.map(notification => ({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      userRole: notification.userRole,
      actionUrl: notification.actionUrl,
      data: notification.data,
      priority: notification.priority || "NORMAL",
    })),
  });
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
) {
  const where: any = { userId };
  if (unreadOnly) where.read = false;

  return await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Booking-related notification functions
 */

/**
 * Notify customer about booking confirmation
 */
export async function notifyBookingConfirmation(
  customerId: string,
  bookingNumber: string,
  serviceName: string,
  bookingType: "property" | "vehicle" | "tour",
  bookingId: string
): Promise<void> {
  await createNotification({
    type: "BOOKING_CONFIRMED",
    title: "Booking Confirmed!",
    message: `Your ${bookingType} booking for ${serviceName} has been confirmed. Booking number: ${bookingNumber}`,
    userId: customerId,
    userRole: "CUSTOMER",
    actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
    },
    priority: "HIGH",
  });
}

/**
 * Notify provider about new booking
 */
export async function notifyProviderNewBooking(
  providerId: string,
  providerRole: UserRole,
  bookingNumber: string,
  serviceName: string,
  bookingType: "property" | "vehicle" | "tour",
  bookingId: string,
  customerName: string
): Promise<void> {
  await createNotification({
    type: "BOOKING_CONFIRMED",
    title: "New Booking Received!",
    message: `You have received a new ${bookingType} booking from ${customerName}. Booking number: ${bookingNumber}`,
    userId: providerId,
    userRole: providerRole,
    actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
      customerName,
    },
    priority: "HIGH",
  });
}

/**
 * Notify about booking cancellation
 */
export async function notifyBookingCancellation(
  userId: string,
  userRole: UserRole,
  bookingNumber: string,
  serviceName: string,
  bookingType: "property" | "vehicle" | "tour",
  bookingId: string,
  reason?: string
): Promise<void> {
  const message = reason 
    ? `Your ${bookingType} booking for ${serviceName} has been cancelled. Reason: ${reason}`
    : `Your ${bookingType} booking for ${serviceName} has been cancelled.`;

  await createNotification({
    type: "BOOKING_CANCELLED",
    title: "Booking Cancelled",
    message,
    userId,
    userRole,
    actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
      reason,
    },
    priority: "NORMAL",
  });
}

/**
 * Notify about payment received
 */
export async function notifyPaymentReceived(
  providerId: string,
  providerRole: UserRole,
  bookingNumber: string,
  serviceName: string,
  bookingType: "property" | "vehicle" | "tour",
  amount: number,
  currency: string,
  bookingId: string
): Promise<void> {
  await createNotification({
    type: "PAYMENT_RECEIVED",
    title: "Payment Received!",
    message: `Payment of ${currency} ${amount.toFixed(2)} has been received for your ${bookingType} booking: ${serviceName}`,
    userId: providerId,
    userRole: providerRole,
    actionUrl: `/dashboard/bookings/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
      amount,
      currency,
    },
    priority: "HIGH",
  });
}

/**
 * Notify about payment failure
 */
export async function notifyPaymentFailed(
  customerId: string,
  bookingNumber: string,
  serviceName: string,
  bookingType: "property" | "vehicle" | "tour",
  bookingId: string,
  reason?: string
): Promise<void> {
  const message = reason
    ? `Payment failed for your ${bookingType} booking: ${serviceName}. Reason: ${reason}`
    : `Payment failed for your ${bookingType} booking: ${serviceName}. Please try again.`;

  await createNotification({
    type: "PAYMENT_FAILED",
    title: "Payment Failed",
    message,
    userId: customerId,
    userRole: "CUSTOMER",
    actionUrl: `/book/payment/${bookingId}?type=${bookingType}`,
    data: {
      bookingId,
      bookingType,
      bookingNumber,
      serviceName,
      reason,
    },
    priority: "URGENT",
  });
}

/**
 * Notify about new review
 */
export async function notifyNewReview(
  providerId: string,
  providerRole: UserRole,
  serviceName: string,
  serviceType: "property" | "vehicle" | "tour",
  rating: number,
  reviewerName: string,
  reviewId: string
): Promise<void> {
  await createNotification({
    type: "REVIEW_RECEIVED",
    title: "New Review Received!",
    message: `${reviewerName} left a ${rating}-star review for your ${serviceType}: ${serviceName}`,
    userId: providerId,
    userRole: providerRole,
    actionUrl: `/dashboard/reviews/${reviewId}`,
    data: {
      serviceName,
      serviceType,
      rating,
      reviewerName,
      reviewId,
    },
    priority: "NORMAL",
  });
}

/**
 * Notify about listing approval
 */
export async function notifyListingApproval(
  providerId: string,
  providerRole: UserRole,
  serviceName: string,
  serviceType: "property" | "vehicle" | "tour",
  serviceId: string,
  approved: boolean
): Promise<void> {
  const title = approved ? "Listing Approved!" : "Listing Rejected";
  const message = approved
    ? `Your ${serviceType} listing "${serviceName}" has been approved and is now live.`
    : `Your ${serviceType} listing "${serviceName}" has been rejected. Please check the feedback and resubmit.`;

  await createNotification({
    type: approved ? "LISTING_APPROVED" : "LISTING_REJECTED",
    title,
    message,
    userId: providerId,
    userRole: providerRole,
    actionUrl: `/dashboard/listings/${serviceId}?type=${serviceType}`,
    data: {
      serviceName,
      serviceType,
      serviceId,
      approved,
    },
    priority: approved ? "HIGH" : "NORMAL",
  });
}

/**
 * Notify about profile verification
 */
export async function notifyProfileVerification(
  userId: string,
  userRole: UserRole,
  verified: boolean
): Promise<void> {
  const title = verified ? "Profile Verified!" : "Profile Verification Required";
  const message = verified
    ? "Your profile has been verified. You can now access all features."
    : "Your profile verification is required to access certain features. Please submit the required documents.";

  await createNotification({
    type: "PROFILE_VERIFIED",
    title,
    message,
    userId,
    userRole,
    actionUrl: "/dashboard/profile",
    data: {
      verified,
    },
    priority: verified ? "NORMAL" : "HIGH",
  });
}

/**
 * Notify about new message
 */
export async function notifyNewMessage(
  receiverId: string,
  receiverRole: UserRole,
  senderName: string,
  messagePreview: string,
  messageId: string,
  bookingId?: string,
  bookingType?: string
): Promise<void> {
  await createNotification({
    type: "MESSAGE_RECEIVED",
    title: `New message from ${senderName}`,
    message: messagePreview,
    userId: receiverId,
    userRole: receiverRole,
    actionUrl: bookingId ? `/messages/${messageId}?booking=${bookingId}&type=${bookingType}` : `/messages/${messageId}`,
    data: {
      senderName,
      messageId,
      bookingId,
      bookingType,
    },
    priority: "NORMAL",
  });
}

/**
 * Notify about system announcement
 */
export async function notifySystemAnnouncement(
  userIds: string[],
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  const notifications = userIds.map(userId => ({
    type: "SYSTEM_ANNOUNCEMENT" as NotificationType,
    title,
    message,
    userId,
    userRole: "CUSTOMER" as UserRole, // Default role, should be updated based on actual user roles
    actionUrl,
    priority: "NORMAL" as const,
  }));

  await createNotifications(notifications);
}

/**
 * Clean up old notifications (for maintenance)
 */
export async function cleanupOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      read: true,
    },
  });

  return result.count;
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string) {
  const total = await prisma.notification.count({
    where: { userId },
  });

  const unread = await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });

  const byType = await prisma.notification.groupBy({
    by: ["type"],
    where: { userId },
    _count: {
      type: true,
    },
  });

  return {
    total,
    unread,
    byType: byType.map(item => ({
      type: item.type,
      count: item._count.type,
    })),
  };
}

/**
 * Create both customer and provider notifications for a new booking
 */
export async function createBookingNotifications(
  bookingId: string,
  bookingType: "property" | "vehicle" | "tour",
  customerId: string,
  providerId: string,
  bookingNumber: string,
  serviceName: string
): Promise<void> {
  await notifyBookingConfirmation(
    customerId,
    bookingNumber,
    serviceName,
    bookingType,
    bookingId
  );

  const providerRole: UserRole =
    bookingType === "property"
      ? "PROPERTY_OWNER"
      : bookingType === "vehicle"
      ? "VEHICLE_OWNER"
      : "TOUR_GUIDE";

  await notifyProviderNewBooking(
    providerId,
    providerRole,
    bookingNumber,
    serviceName,
    bookingType,
    bookingId,
    "Customer"
  );
}
