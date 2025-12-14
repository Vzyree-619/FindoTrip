import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { getSuperAdmin } from "~/lib/utils/admin.server";
import { publishToUser } from "~/lib/realtime.server";

/**
 * Public API to send messages to an existing conversation
 * Allows visitors to send messages without authentication
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { conversationId, message, guestUserId } = body;

    if (!conversationId || !message || !guestUserId) {
      return json({ error: "Conversation ID, message, and guest user ID are required" }, { status: 400 });
    }

    // Verify conversation exists and guest user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participants: true,
        type: true,
      },
    });

    if (!conversation) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!conversation.participants.includes(guestUserId)) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get guest user info
    const guestUser = await prisma.user.findUnique({
      where: { id: guestUserId },
      select: { id: true, name: true, email: true },
    });

    if (!guestUser) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: guestUser.id,
        content: message,
        type: "TEXT",
        isRead: false,
        readBy: [],
        readAt: {},
        attachments: [],
      },
    });

    // Update conversation metadata
    const adminId = conversation.participants.find((id) => id !== guestUserId);
    if (adminId) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          lastMessage: {
            content: message,
            senderId: guestUser.id,
            senderName: guestUser.name || "Guest",
          },
          unreadCount: {
            ...(conversation.unreadCount as Record<string, number> || {}),
            [adminId]: ((conversation.unreadCount as Record<string, number> || {})[adminId] || 0) + 1,
          },
        },
      });

      // Create notification for admin
      await prisma.notification.create({
        data: {
          userId: adminId,
          type: "MESSAGE_RECEIVED",
          title: "New Message",
          message: `${guestUser.name || "Guest"} sent you a message: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
          userRole: "SUPER_ADMIN",
          metadata: {
            conversationId: conversation.id,
            senderId: guestUser.id,
            senderName: guestUser.name || "Guest",
          },
        },
      });

      // Publish real-time update to admin
      try {
        await publishToUser(adminId, {
          type: "MESSAGE_RECEIVED",
          conversationId: conversation.id,
          message: {
            id: newMessage.id,
            content: message,
            senderId: guestUser.id,
            senderName: guestUser.name || "Guest",
            createdAt: newMessage.createdAt,
          },
        });
      } catch (error) {
        console.error("Error publishing real-time update:", error);
        // Don't fail the request if real-time fails
      }
    }

    return json({
      success: true,
      id: newMessage.id,
      conversationId: conversation.id,
      senderId: guestUser.id,
      senderName: guestUser.name || "Guest",
      content: message,
      type: "TEXT",
      createdAt: newMessage.createdAt,
    });
  } catch (error) {
    console.error("Error sending public message:", error);
    return json({ error: "Failed to send message" }, { status: 500 });
  }
}

