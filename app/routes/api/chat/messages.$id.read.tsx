import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { markMessagesAsRead } from "~/lib/chat.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface ReadResponse {
  success: boolean;
  data?: { count: number };
  error?: string;
}

// ========================================
// POST /api/chat/messages/:id/read
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const messageId = params.id;
    
    if (!messageId) {
      return json(
        { success: false, error: "Message ID required" },
        { status: 400 }
      );
    }

    if (request.method !== "POST") {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-read',
      200,
      60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get message and verify user has access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { 
        conversationId: true,
        senderId: true,
        readBy: true
      }
    });

    if (!message) {
      return json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if user is already in readBy array
    if (message.readBy.includes(userId)) {
      return json(
        { success: true, data: { count: 0 } }
      );
    }

    // Mark message as read
    await prisma.message.update({
      where: { id: messageId },
      data: {
        readBy: {
          push: userId
        },
        readAt: {
          [userId]: new Date()
        }
      }
    });

    // Update conversation unread count
    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      select: { unreadCount: true }
    });

    if (conversation) {
      const updatedUnreadCount = { ...conversation.unreadCount };
      updatedUnreadCount[userId] = Math.max(0, (updatedUnreadCount[userId] || 0) - 1);

      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: { unreadCount: updatedUnreadCount }
      });
    }

    const response: ReadResponse = {
      success: true,
      data: { count: 1 }
    };

    return json(response);
  } catch (error) {
    console.error("Error in mark message read action:", error);
    return json(
      { success: false, error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
