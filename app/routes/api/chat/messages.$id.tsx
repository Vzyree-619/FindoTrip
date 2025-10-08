import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  editMessage,
  deleteMessage,
  type MessageWithSender
} from "~/lib/chat.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";
import DOMPurify from "isomorphic-dompurify";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface EditMessageRequest {
  content: string;
}

interface MessageResponse {
  success: boolean;
  data?: MessageWithSender;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  data?: { message: string };
  error?: string;
}

// ========================================
// PATCH /api/chat/messages/:id (Edit)
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

    const method = request.method;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-message',
      100,
      60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    if (method === "PATCH") {
      // Edit message
      const body = await request.json() as EditMessageRequest;
      
      // Validation
      if (!body.content || body.content.trim().length === 0) {
        return json(
          { success: false, error: "Message content is required" },
          { status: 400 }
        );
      }

      if (body.content.length > 5000) {
        return json(
          { success: false, error: "Message too long (max 5000 characters)" },
          { status: 400 }
        );
      }

      // Sanitize content
      const sanitizedContent = DOMPurify.sanitize(body.content.trim());

      // Check if message can be edited (within 15 minutes)
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { 
          senderId: true, 
          createdAt: true,
          isDeleted: true
        }
      });

      if (!message) {
        return json(
          { success: false, error: "Message not found" },
          { status: 404 }
        );
      }

      if (message.senderId !== userId) {
        return json(
          { success: false, error: "You can only edit your own messages" },
          { status: 403 }
        );
      }

      if (message.isDeleted) {
        return json(
          { success: false, error: "Cannot edit deleted message" },
          { status: 400 }
        );
      }

      // Check if message is within edit time limit (15 minutes)
      const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      
      if (messageAge > editTimeLimit) {
        return json(
          { success: false, error: "Message can only be edited within 15 minutes" },
          { status: 400 }
        );
      }

      // Edit message
      const updatedMessage = await editMessage(messageId, userId, sanitizedContent);

      const response: MessageResponse = {
        success: true,
        data: updatedMessage
      };

      return json(response);
    } 
    else if (method === "DELETE") {
      // Delete message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { 
          senderId: true,
          isDeleted: true
        }
      });

      if (!message) {
        return json(
          { success: false, error: "Message not found" },
          { status: 404 }
        );
      }

      if (message.senderId !== userId) {
        return json(
          { success: false, error: "You can only delete your own messages" },
          { status: 403 }
        );
      }

      if (message.isDeleted) {
        return json(
          { success: false, error: "Message already deleted" },
          { status: 400 }
        );
      }

      // Delete message
      const success = await deleteMessage(messageId, userId, false); // Soft delete

      const response: DeleteResponse = {
        success,
        data: { message: "Message deleted successfully" }
      };

      return json(response);
    }
    else {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    console.error("Error in message action:", error);
    return json(
      { success: false, error: "Failed to process message" },
      { status: 500 }
    );
  }
}
