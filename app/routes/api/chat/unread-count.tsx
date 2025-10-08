import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { getUnreadCount, type UnreadCount } from "~/lib/chat.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface UnreadCountResponse {
  success: boolean;
  data?: UnreadCount;
  error?: string;
}

// ========================================
// GET /api/chat/unread-count
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      
      'chat-unread',
      100, // 100 requests per minute
      60 * 1000
    });
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get unread count
    const unreadCount = await getUnreadCount(userId);

    const response: UnreadCountResponse = {
      success: true,
      data: unreadCount
    };

    return json(response);
  } catch (error) {
    console.error("Error in unread count loader:", error);
    return json(
      { success: false, error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
