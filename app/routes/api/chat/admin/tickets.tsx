import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface TicketResponse {
  success: boolean;
  data?: {
    tickets: Array<{
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
      category: string;
      provider: {
        id: string;
        name: string;
        role: string;
      };
      createdAt: Date;
      lastMessageAt: Date;
      unreadCount: number;
    }>;
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

// ========================================
// GET /api/chat/admin/tickets
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    
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

    const url = new URL(request.url);
    
    // Parse query parameters
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const providerRole = url.searchParams.get("provider");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      `chat-admin-${userId}`,
      100, // 100 requests per minute
      60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Build where clause
    const whereClause: any = {
      type: "SUPPORT_TICKET"
    };

    if (status) {
      whereClause.status = status;
    }

    if (category) {
      whereClause.category = category;
    }

    if (providerRole) {
      whereClause.provider = {
        role: providerRole
      };
    }

    // Get support tickets
    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.supportTicket.count({
      where: whereClause
    });

    // Format response
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      provider: {
        id: ticket.provider.id,
        name: ticket.provider.name,
        role: ticket.provider.role
      },
      assignedTo: ticket.assignedTo ? {
        id: ticket.assignedTo.id,
        name: ticket.assignedTo.name
      } : null,
      createdAt: ticket.createdAt,
      lastMessageAt: ticket.lastMessageAt,
      unreadCount: ticket._count.messages
    }));

    const response: TicketResponse = {
      success: true,
      data: {
        tickets: formattedTickets,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    };

    return json(response);
  } catch (error) {
    console.error("Error in admin tickets loader:", error);
    return json(
      { success: false, error: "Failed to get support tickets" },
      { status: 500 }
    );
  }
}
