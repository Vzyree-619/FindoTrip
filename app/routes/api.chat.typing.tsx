import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { canUserAccessConversation } from "~/lib/chat.server";
import { checkRateLimit } from "~/lib/chat-security.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface TypingRequest {
  conversationId: string;
  isTyping: boolean;
}

interface TypingResponse {
  success: boolean;
  data?: { message: string };
  error?: string;
}

// ========================================
// POST /api/chat/typing
// ========================================

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);

    if (request.method !== "POST") {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Rate limiting for typing indicators
    const rateLimitResult = await checkRateLimit(
      userId,
      `chat-typing-${userId}`,
      300, // 300 typing events per minute
      60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json() as TypingRequest;
    
    // Validation
    if (!body.conversationId || typeof body.isTyping !== "boolean") {
      return json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify user has access to conversation
    const canAccess = await canUserAccessConversation(userId, body.conversationId);
    if (!canAccess) {
      return json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // TODO: Implement real-time typing indicator broadcasting
    // This would typically involve:
    // 1. Storing typing state in Redis or similar
    // 2. Broadcasting to other conversation participants via WebSocket
    // 3. Setting up automatic cleanup for stale typing indicators
    
    // For now, return success
    const response: TypingResponse = {
      success: true,
      data: { 
        message: body.isTyping ? "Typing indicator sent" : "Typing indicator cleared" 
      }
    };

    return json(response);
  } catch (error) {
    console.error("Error in typing action:", error);
    return json(
      { success: false, error: "Failed to process typing indicator" },
      { status: 500 }
    );
  }
}
