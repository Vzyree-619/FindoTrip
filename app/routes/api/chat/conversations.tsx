import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { getUserId } from "~/lib/auth/auth.server";
import { 
  getUserConversations, 
  getOrCreateConversation, 
  getConversationById,
  validateChatPermissions,
  ConversationType,
  type ConversationSummary,
  type ConversationDetails
} from "~/lib/chat.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface CreateConversationRequest {
  targetUserId: string;
  type: ConversationType;
  relatedServiceId?: string;
  relatedBookingId?: string;
  title?: string;
}

interface ConversationResponse {
  success: boolean;
  data?: ConversationSummary | ConversationDetails;
  error?: string;
}

interface ConversationsListResponse {
  success: boolean;
  data?: {
    conversations: ConversationSummary[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

// ========================================
// GET /api/chat/conversations
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await getUserId(request);
    
    // If no user is logged in, return empty data instead of redirecting
    if (!userId) {
      return json({
        success: true,
        data: {
          conversations: [],
          total: 0,
          hasMore: false
        }
      });
    }
    const url = new URL(request.url);
    
    // Parse query parameters
    const type = url.searchParams.get("type") as ConversationType | null;
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-conversations',
      100, // 100 requests per minute
      60 * 1000 // 60 seconds in milliseconds
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get user role for filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get conversations
    const conversations = await getUserConversations(
      userId,
      user.role,
      type || undefined,
      limit,
      offset
    );

    // Get total count for pagination
    const totalCount = await prisma.conversation.count({
      where: {
        participants: { has: userId },
        ...(type ? { type } : {}),
        hiddenBy: { hasNot: userId },
      },
    });

    const response: ConversationsListResponse = {
      success: true,
      data: {
        conversations,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    };

    return json(response);
  } catch (error) {
    console.error("Error in conversations loader:", error);
    return json(
      { success: false, error: "Failed to get conversations" },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/chat/conversations
// ========================================

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await getUserId(request);
    
    // If no user is logged in, return error
    if (!userId) {
      return json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (request.method !== "POST") {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Rate limiting for conversation creation
    const rateLimitResult = await checkRateLimit(
      userId,
      'chat-create',
      10, // 10 conversations per hour
      60 * 60 * 1000 // 1 hour in milliseconds
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json() as CreateConversationRequest;
    
    // Validation
    if (!body.targetUserId || !body.type) {
      return json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user and target user details
    const [user, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true }
      }),
      prisma.user.findUnique({
        where: { id: body.targetUserId },
        select: { id: true, name: true, role: true }
      })
    ]);

    if (!user || !targetUser) {
      return json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Validate chat permissions
    const permissions = await validateChatPermissions(
      userId,
      user.role,
      body.targetUserId,
      targetUser.role
    );

    if (!permissions.canAccess) {
      return json(
        { success: false, error: permissions.reason },
        { status: 403 }
      );
    }

    // Create conversation
    const conversation = await getOrCreateConversation(
      userId,
      body.targetUserId,
      body.type,
      body.relatedBookingId,
      body.relatedServiceId
    );

    const response: ConversationResponse = {
      success: true,
      data: conversation
    };

    return json(response, { status: 201 });
  } catch (error) {
    console.error("Error in conversations action:", error);
    return json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
