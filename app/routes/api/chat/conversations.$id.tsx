import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  getConversationById,
  canUserAccessConversation,
  type ConversationDetails
} from "~/lib/chat.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface ConversationResponse {
  success: boolean;
  data?: ConversationDetails;
  error?: string;
}

// ========================================
// GET /api/chat/conversations/:id
// ========================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const conversationId = params.id;
    
    if (!conversationId) {
      return json(
        { success: false, error: "Conversation ID required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-conversation',
      100, // 100 requests per minute
      60 * 1000 // 60 seconds in milliseconds
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const before = url.searchParams.get("before");

    // Get conversation with messages
    const conversation = await getConversationById(conversationId, userId);

    const response: ConversationResponse = {
      success: true,
      data: conversation
    };

    return json(response);
  } catch (error) {
    console.error("Error in conversation loader:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    return json(
      { success: false, error: "Failed to get conversation" },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE /api/chat/conversations/:id
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const conversationId = params.id;
    
    if (!conversationId) {
      return json(
        { success: false, error: "Conversation ID required" },
        { status: 400 }
      );
    }

    if (request.method !== "DELETE") {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-delete',
      20, // 20 deletions per hour
      60 * 60 * 1000 // 1 hour in milliseconds
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Verify user has access to conversation
    const canAccess = await canUserAccessConversation(userId, conversationId);
    if (!canAccess) {
      return json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Soft hide conversation for this user
    const convo = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { hiddenBy: true, participants: true } });
    if (!convo || !convo.participants.includes(userId)) {
      return json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const updatedHidden = Array.from(new Set([...(convo.hiddenBy || []), userId]));
    await prisma.conversation.update({ where: { id: conversationId }, data: { hiddenBy: updatedHidden } });

    return json({ success: true, data: { message: "Conversation hidden successfully" } });
  } catch (error) {
    console.error("Error in conversation action:", error);
    return json(
      { success: false, error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
