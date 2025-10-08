import { prisma } from "~/lib/db/db.server";
import { 
  SupportTicketStatus, 
  SupportTicketPriority, 
  SupportTicketCategory, 
  MessageType,
  UserRole,
  NotificationType 
} from "@prisma/client";

export interface SupportTicketData {
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority?: SupportTicketPriority;
  relatedServiceId?: string;
  relatedServiceType?: string;
  providerId: string;
}

export interface SupportMessageData {
  content: string;
  type?: MessageType;
  attachments?: string[];
  templateId?: string;
  systemData?: any;
}

export interface SupportAnalytics {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  avgSatisfaction: number;
  totalRatings: number;
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(data: SupportTicketData): Promise<any> {
  const ticketNumber = `ST${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || SupportTicketPriority.NORMAL,
      status: SupportTicketStatus.NEW,
      providerId: data.providerId,
      relatedServiceId: data.relatedServiceId,
      relatedServiceType: data.relatedServiceType,
    },
    include: {
      provider: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Create initial system message
  await prisma.supportMessage.create({
    data: {
      content: `Support ticket created: ${data.title}`,
      type: MessageType.SYSTEM,
      ticketId: ticket.id,
      senderId: data.providerId,
      systemData: {
        action: "ticket_created",
        category: data.category,
        priority: data.priority || SupportTicketPriority.NORMAL,
      },
    },
  });

  // Create notification for admin
  await prisma.notification.create({
    data: {
      type: NotificationType.SUPPORT_TICKET_CREATED,
      title: "New Support Ticket",
      message: `New support ticket from ${ticket.provider.name}: ${data.title}`,
      userId: data.providerId, // This should be admin ID in real implementation
      userRole: UserRole.SUPER_ADMIN,
      actionUrl: `/admin/support/${ticket.id}`,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        providerName: ticket.provider.name,
        category: data.category,
        priority: data.priority || SupportTicketPriority.NORMAL,
      },
    },
  });

  return ticket;
}

/**
 * Add message to support ticket
 */
export async function addSupportMessage(
  ticketId: string,
  senderId: string,
  data: SupportMessageData
): Promise<any> {
  const message = await prisma.supportMessage.create({
    data: {
      content: data.content,
      type: data.type || MessageType.TEXT,
      attachments: data.attachments || [],
      ticketId,
      senderId,
      templateId: data.templateId,
      systemData: data.systemData,
    },
    include: {
      sender: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      template: {
        select: {
          name: true,
          title: true,
        },
      },
    },
  });

  // Update ticket last message time
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      lastMessageAt: new Date(),
    },
  });

  // Create notification for the other party
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      provider: true,
      assignedTo: true,
    },
  });

  if (ticket) {
    const isFromProvider = senderId === ticket.providerId;
    const recipientId = isFromProvider ? ticket.assignedToId : ticket.providerId;
    const recipientRole = isFromProvider ? UserRole.SUPER_ADMIN : ticket.provider.role;

    if (recipientId) {
      await prisma.notification.create({
        data: {
          type: NotificationType.SUPPORT_MESSAGE_RECEIVED,
          title: "New Support Message",
          message: `New message in support ticket: ${ticket.title}`,
          userId: recipientId,
          userRole: recipientRole,
          actionUrl: `/admin/support/${ticketId}`,
          data: {
            ticketId,
            ticketNumber: ticket.ticketNumber,
            senderName: message.sender.name,
            messagePreview: data.content.substring(0, 100),
          },
        },
      });
    }
  }

  return message;
}

/**
 * Update support ticket status
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
  updatedBy: string,
  resolution?: string
): Promise<any> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === SupportTicketStatus.RESOLVED) {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = updatedBy;
    updateData.resolution = resolution;
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      provider: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Create system message for status change
  await prisma.supportMessage.create({
    data: {
      content: `Ticket status changed to: ${status}`,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: updatedBy,
      systemData: {
        action: "status_changed",
        newStatus: status,
        resolution,
      },
    },
  });

  // Create notification for provider
  await prisma.notification.create({
    data: {
      type: NotificationType.SUPPORT_TICKET_UPDATED,
      title: "Support Ticket Updated",
      message: `Your support ticket status has been updated to: ${status}`,
      userId: ticket.providerId,
      userRole: ticket.provider.role,
      actionUrl: `/dashboard/support/${ticketId}`,
      data: {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        newStatus: status,
        resolution,
      },
    },
  });

  return ticket;
}

/**
 * Assign support ticket to admin
 */
export async function assignSupportTicket(
  ticketId: string,
  adminId: string,
  assignedBy: string
): Promise<any> {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToId: adminId,
      status: SupportTicketStatus.IN_PROGRESS,
    },
    include: {
      provider: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Create system message for assignment
  await prisma.supportMessage.create({
    data: {
      content: `Ticket assigned to: ${ticket.assignedTo?.name}`,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: assignedBy,
      systemData: {
        action: "ticket_assigned",
        assignedTo: ticket.assignedTo?.name,
      },
    },
  });

  return ticket;
}

/**
 * Escalate support ticket
 */
export async function escalateSupportTicket(
  ticketId: string,
  escalatedBy: string,
  reason?: string
): Promise<any> {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      escalated: true,
      escalatedAt: new Date(),
      escalatedBy,
      priority: SupportTicketPriority.URGENT,
    },
    include: {
      provider: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Create system message for escalation
  await prisma.supportMessage.create({
    data: {
      content: `Ticket escalated to urgent priority${reason ? `: ${reason}` : ""}`,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: escalatedBy,
      systemData: {
        action: "ticket_escalated",
        reason,
      },
    },
  });

  // Create notification for senior admin
  await prisma.notification.create({
    data: {
      type: NotificationType.SUPPORT_TICKET_UPDATED,
      title: "Support Ticket Escalated",
      message: `Support ticket escalated: ${ticket.title}`,
      userId: escalatedBy, // This should be senior admin ID
      userRole: UserRole.SUPER_ADMIN,
      actionUrl: `/admin/support/${ticketId}`,
      data: {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        providerName: ticket.provider.name,
        reason,
      },
    },
  });

  return ticket;
}

/**
 * Rate support ticket resolution
 */
export async function rateSupportTicket(
  ticketId: string,
  rating: number,
  feedback?: string
): Promise<any> {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      satisfactionRating: rating,
    },
  });

  // Create system message for rating
  await prisma.supportMessage.create({
    data: {
      content: `Support ticket rated: ${rating}/5 stars${feedback ? ` - ${feedback}` : ""}`,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: ticket.providerId,
      systemData: {
        action: "ticket_rated",
        rating,
        feedback,
      },
    },
  });

  return ticket;
}

/**
 * Get support tickets for provider
 */
export async function getProviderSupportTickets(
  providerId: string,
  status?: SupportTicketStatus,
  limit: number = 50
) {
  const where: any = { providerId };
  if (status) where.status = status;

  return await prisma.supportTicket.findMany({
    where,
    include: {
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    take: limit,
  });
}

/**
 * Get support tickets for admin
 */
export async function getAdminSupportTickets(
  filters: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    priority?: SupportTicketPriority;
    assignedTo?: string;
    providerRole?: UserRole;
  } = {},
  limit: number = 50
) {
  const where: any = {};
  
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedTo) where.assignedToId = filters.assignedTo;
  if (filters.providerRole) {
    where.provider = {
      role: filters.providerRole,
    };
  }

  return await prisma.supportTicket.findMany({
    where,
    include: {
      provider: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    take: limit,
  });
}

/**
 * Get support ticket details
 */
export async function getSupportTicketDetails(ticketId: string) {
  return await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      provider: {
        select: {
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
          template: {
            select: {
              name: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

/**
 * Get support analytics
 */
export async function getSupportAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<SupportAnalytics> {
  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      messages: true,
    },
  });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === SupportTicketStatus.RESOLVED).length;
  
  // Calculate average response time (simplified)
  const avgResponseTime = 0; // This would need more complex calculation
  
  // Calculate average resolution time
  const resolvedTicketsWithTime = tickets.filter(t => 
    t.status === SupportTicketStatus.RESOLVED && t.resolvedAt
  );
  const avgResolutionTime = resolvedTicketsWithTime.length > 0 
    ? resolvedTicketsWithTime.reduce((sum, ticket) => {
        const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
        return sum + resolutionTime;
      }, 0) / resolvedTicketsWithTime.length / (1000 * 60) // Convert to minutes
    : 0;

  // Tickets by category
  const ticketsByCategory = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tickets by priority
  const ticketsByPriority = tickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Average satisfaction
  const ratedTickets = tickets.filter(t => t.satisfactionRating !== null);
  const avgSatisfaction = ratedTickets.length > 0
    ? ratedTickets.reduce((sum, ticket) => sum + (ticket.satisfactionRating || 0), 0) / ratedTickets.length
    : 0;

  return {
    totalTickets,
    resolvedTickets,
    avgResponseTime,
    avgResolutionTime,
    ticketsByCategory,
    ticketsByPriority,
    avgSatisfaction,
    totalRatings: ratedTickets.length,
  };
}

/**
 * Mark support message as read
 */
export async function markSupportMessageAsRead(messageId: string): Promise<void> {
  await prisma.supportMessage.update({
    where: { id: messageId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Get unread support message count for user
 */
export async function getUnreadSupportMessageCount(userId: string): Promise<number> {
  return await prisma.supportMessage.count({
    where: {
      ticket: {
        OR: [
          { providerId: userId },
          { assignedToId: userId },
        ],
      },
      isRead: false,
      senderId: { not: userId },
    },
  });
}
