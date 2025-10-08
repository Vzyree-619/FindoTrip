import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";
import { sendEmail } from "~/lib/email/email.server";

export type NotificationPayload = {
  userId: string;
  userRole: any;
  type: any; // NotificationType
  title: string;
  message: string;
  actionUrl?: string;
  data?: any;
  priority?: string; // LOW|NORMAL|HIGH|URGENT
};

export async function createAndDispatchNotification(payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      userRole: payload.userRole,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
      data: payload.data,
      priority: payload.priority || "NORMAL",
    },
  });

  // Publish SSE for real-time updates
  try {
    publishToUser(payload.userId, "notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      data: notification.data,
      createdAt: notification.createdAt,
      priority: notification.priority,
    });
  } catch {}

  // Check user prefs for email/sms/push
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true, name: true, emailNotifications: true } });
  if (user?.emailNotifications && user.email) {
    // Send a simple generic email (specialized templates are elsewhere for bookings/payments)
    try {
      await sendEmail({
        to: user.email,
        subject: payload.title,
        html: `<p>${payload.message}</p>${payload.actionUrl ? `<p><a href="${payload.actionUrl}">Open</a></p>` : ""}`,
      });
    } catch {}
  }

  return notification;
}

export async function markNotificationsRead(userId: string, ids?: string[], all = false) {
  if (all) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true, readAt: new Date() } });
    return { success: true };
  }
  if (!ids || ids.length === 0) return { success: true };
  await prisma.notification.updateMany({ where: { userId, id: { in: ids } }, data: { read: true, readAt: new Date() } });
  return { success: true };
}

export async function listUserNotifications(userId: string, take = 50) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}
