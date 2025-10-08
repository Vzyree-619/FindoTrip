import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface OnlineStatusResponse {
  success: boolean;
  data?: {
    isOnline: boolean;
    lastSeen: Date;
  };
  error?: string;
}

// ========================================
// GET /api/chat/online-status/:userId
// ========================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const requestingUserId = await requireUserId(request);
    const targetUserId = params.userId;
    
    if (!targetUserId) {
      return json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      
      'chat-status-${requestingUserId}',
      '100', // 100 requests per minute
      '60' * 1000
    });
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get user's last active time
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        lastActiveAt: true,
        // Note: lastActiveAt field needs to be added to User model
        // For now, we'll use a placeholder
      }
    });

    if (!user) {
      return json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Determine if user is online (active within last 5 minutes)
    const now = new Date();
    const lastActiveAt = user.lastActiveAt || new Date(0); // Fallback to epoch if null
    const timeDiff = now.getTime() - lastActiveAt.getTime();
    const isOnline = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds

    const response: OnlineStatusResponse = {
      success: true,
      data: {
        isOnline,
        lastSeen: lastActiveAt
      }
    };

    return json(response);
  } catch (error) {
    console.error("Error in online status loader:", error);
    return json(
      { success: false, error: "Failed to get online status" },
      { status: 500 }
    );
  }
}
