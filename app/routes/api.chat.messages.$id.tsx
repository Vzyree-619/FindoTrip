import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  editMessage,
  deleteMessage,
  type MessageWithSender
} from "~/lib/chat.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/chat-security.server";
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
      console.log('🔵 [API /chat/messages/$id] Editing message:', { messageId, userId, contentLength: sanitizedContent.length });
      const updatedMessage = await editMessage(messageId, userId, sanitizedContent);

      const response: MessageResponse = {
        success: true,
        data: updatedMessage
      };

      console.log('🟢 [API /chat/messages/$id] Message edited successfully:', messageId);
      return json(response);
    } 
    else if (method === "DELETE") {
      // Parse request body for deleteForEveryone flag
      let deleteForEveryone = false;
      try {
        const body = await request.json();
        deleteForEveryone = body.deleteForEveryone === true;
      } catch {
        // Body might be empty, that's fine
      }

      // Get message to check permissions
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

      if (message.isDeleted) {
        return json(
          { success: false, error: "Message already deleted" },
          { status: 400 }
        );
      }

      // Check permissions - sender can delete, or admin can delete for everyone
      const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { role: true } 
      });
      const isAdmin = user?.role === 'SUPER_ADMIN';
      const isSender = message.senderId === userId;

      if (!isSender && !isAdmin) {
        return json(
          { success: false, error: "You can only delete your own messages" },
          { status: 403 }
        );
      }

      // Only admins can delete for everyone
      if (deleteForEveryone && !isAdmin) {
        return json(
          { success: false, error: "Only admins can delete messages for everyone" },
          { status: 403 }
        );
      }

      // Delete message
      const success = await deleteMessage(messageId, userId, deleteForEveryone);

      const response: DeleteResponse = {
        success,
        data: { message: "Message deleted successfully" }
      };

      console.log('✅ Message deleted successfully:', messageId, 'forEveryone:', deleteForEveryone);
      return json(response);
    }
    else {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    console.error("❌ [API /chat/messages/$id] Error in message action:", error);
    console.error("❌ [API /chat/messages/$id] Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack?.split('\n').slice(0, 5).join('\n')
    });
    return json(
      { success: false, error: "Failed to process message", details: (error as Error).message },
      { status: 500 }
    );
  }
}
