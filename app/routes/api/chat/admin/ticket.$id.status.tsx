import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface UpdateStatusRequest {
  status: 'IN_PROGRESS' | 'RESOLVED' | 'WAITING' | 'ESCALATED';
  resolution?: string;
  internalNotes?: string;
}

interface StatusUpdateResponse {
  success: boolean;
  data?: {
    conversation: {
      id: string;
      status: string;
      updatedAt: Date;
    };
  };
  error?: string;
}

// ========================================
// PATCH /api/chat/admin/ticket/:id/status
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const ticketId = params.id;
    
    if (!ticketId) {
      return json(
        { success: false, error: "Ticket ID required" },
        { status: 400 }
      );
    }

    if (request.method !== "PATCH") {
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

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      `chat-admin-status-${userId}`,
      50, // 50 status updates per minute
      60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json() as UpdateStatusRequest;
    
    // Validation
    if (!body.status) {
      return json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ['IN_PROGRESS', 'RESOLVED', 'WAITING', 'ESCALATED'];
    if (!validStatuses.includes(body.status)) {
      return json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        status: true,
        title: true,
        provider: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!ticket) {
      return json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Update ticket status
    const updateData: any = {
      status: body.status,
      updatedAt: new Date()
    };

    if (body.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
      if (body.resolution) {
        updateData.resolution = body.resolution;
      }
    }

    if (body.internalNotes) {
      updateData.internalNotes = body.internalNotes;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_TICKET_STATUS",
        resourceType: "SUPPORT_TICKET",
        resourceId: ticketId,
        details: {
          oldStatus: ticket.status,
          newStatus: body.status,
          resolution: body.resolution,
          ticketTitle: ticket.title,
          providerName: ticket.provider.name
        },
        severity: "INFO"
      }
    });

    const response: StatusUpdateResponse = {
      success: true,
      data: {
        conversation: {
          id: updatedTicket.id,
          status: updatedTicket.status,
          updatedAt: updatedTicket.updatedAt
        }
      }
    };

    return json(response);
  } catch (error) {
    console.error("Error in ticket status update action:", error);
    return json(
      { success: false, error: "Failed to update ticket status" },
      { status: 500 }
    );
  }
}
