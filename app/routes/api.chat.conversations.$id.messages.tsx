import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  sendMessage,
  canUserAccessConversation,
  getConversationMessages,
  MessageType,
  type MessageWithSender
} from "~/lib/chat.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";
import { checkRateLimit } from "~/lib/chat-security.server"; // Use stub until Redis is configured
import DOMPurify from "isomorphic-dompurify";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface SendMessageRequest {
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  replyToId?: string;
  type?: MessageType;
}

interface MessageResponse {
  success: boolean;
  data?: MessageWithSender;
  error?: string;
}

// ========================================
// POST /api/chat/conversations/:id/messages
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const conversationId = params.id;
    
    console.log('🔵 [API] Sending message:', { userId, conversationId });
    
    if (!conversationId) {
      return json(
        { success: false, error: "Conversation ID required" },
        { status: 400 }
      );
    }

    if (request.method !== "POST") {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Rate limiting for messages
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-messages',
      60,
      60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json() as SendMessageRequest;
    
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

    // Sanitize content to prevent XSS
    const sanitizedContent = DOMPurify.sanitize(body.content.trim());

    // Verify user has access to conversation
    const canAccess = await canUserAccessConversation(userId, conversationId);
    if (!canAccess) {
      return json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Validate attachments if provided
    if (body.attachments) {
      for (const attachment of body.attachments) {
        if (attachment.size > 5 * 1024 * 1024) { // 5MB limit
          return json(
            { success: false, error: "File too large (max 5MB)" },
            { status: 400 }
          );
        }
      }
    }

    // Send message
    const message = await sendMessage(
      conversationId,
      userId,
      sanitizedContent,
      body.attachments,
      body.replyToId,
      body.type || MessageType.TEXT
    );
    
    console.log('🟢 [API] Message created:', { 
      id: message.id, 
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content.substring(0, 30)
    });

    // Get sender details for response and broadcast
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, avatar: true }
    });

    // Broadcast via SSE to all participants for real-time updates
    try {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      const participants = conv?.participants || [];
      console.log('🟡 [API] Broadcasting to participants:', participants);
      const wireMessage = {
        id: message.id,
        conversationId,
        senderId: message.senderId,
        content: message.content,
        type: (message.type || MessageType.TEXT).toString().toLowerCase(),
        attachments: message.attachments || [],
        createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : (message.createdAt || new Date().toISOString()),
        status: "sent" as const,
        senderName: message.senderName || sender?.name || "Unknown",
        senderAvatar: sender?.avatar || null,
      };
      // Broadcast to all participants (including sender for UI consistency)
      for (const pid of participants) {
        publishToUser(pid, "message", { type: "chat_message", conversationId, message: wireMessage });
      }
    } catch (err) {
      // non-fatal
      console.error("SSE publish error (chat message)", err);
    }

    // Format response with all required fields
    const responseData = {
      ...message,
      senderName: message.senderName || sender?.name || "Unknown",
      senderAvatar: sender?.avatar || null,
      sender: sender ? {
        id: sender.id,
        name: sender.name,
        role: sender.role,
        avatar: sender.avatar
      } : undefined
    };

    const response: MessageResponse = {
      success: true,
      data: responseData as any
    };

    return json(response, { status: 201 });
  } catch (error) {
    console.error("Error in send message action:", error);
    return json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// GET /api/chat/conversations/:id/messages?limit=50&before=<messageId>
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const conversationId = params.id;
    if (!conversationId) {
      return json({ success: false, error: "Conversation ID required" }, { status: 400 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
    const before = url.searchParams.get("before") || undefined;

    const canAccess = await canUserAccessConversation(userId, conversationId);
    if (!canAccess) return json({ success: false, error: "Access denied" }, { status: 403 });

    const messages = await getConversationMessages(conversationId, userId, limit, before);
    return json<{ success: boolean; data: { messages: MessageWithSender[] } }>({ success: true, data: { messages } });
  } catch (error) {
    console.error("Error loading messages:", error);
    return json({ success: false, error: "Failed to load messages" }, { status: 500 });
  }
}
