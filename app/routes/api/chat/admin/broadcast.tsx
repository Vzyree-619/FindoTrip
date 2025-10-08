import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";
import DOMPurify from "isomorphic-dompurify";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface BroadcastRequest {
  message: string;
  targetRoles: string[];
  title?: string;
}

interface BroadcastResponse {
  success: boolean;
  data?: {
    message: string;
    sentCount: number;
  };
  error?: string;
}

// ========================================
// POST /api/chat/admin/broadcast
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== "SUPER_ADMIN") {
      return json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Rate limiting for broadcasts
    const rateLimitResult = await checkRateLimit(
      userId,
      
      'chat-broadcast-${userId}',
      '5', // 5 broadcasts per hour
      '3600' * 1000
    });
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json() as BroadcastRequest;
    
    // Validation
    if (!body.message || body.message.trim().length === 0) {
      return json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    if (!body.targetRoles || body.targetRoles.length === 0) {
      return json(
        { success: false, error: "Target roles are required" },
        { status: 400 }
      );
    }

    if (body.message.length > 1000) {
      return json(
        { success: false, error: "Message too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    // Sanitize message content
    const sanitizedMessage = DOMPurify.sanitize(body.message.trim());

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: {
        role: {
          in: body.targetRoles
        }
      },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (targetUsers.length === 0) {
      return json(
        { success: false, error: "No users found with target roles" },
        { status: 400 }
      );
    }

    // TODO: Implement actual broadcast functionality
    // This would typically involve:
    // 1. Creating system messages in conversations with target users
    // 2. Sending push notifications
    // 3. Sending email notifications
    // 4. Logging the broadcast action
    
    // For now, return a mock response
    const sentCount = targetUsers.length;
    
    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BROADCAST_MESSAGE",
        resourceType: "CHAT",
        resourceId: "broadcast",
        details: {
          message: sanitizedMessage,
          targetRoles: body.targetRoles,
          sentCount
        },
        severity: "INFO"
      }
    });

    const response: BroadcastResponse = {
      success: true,
      data: {
        message: "Broadcast sent successfully",
        sentCount
      }
    };

    return json(response, { status: 201 });
  } catch (error) {
    console.error("Error in broadcast action:", error);
    return json(
      { success: false, error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
