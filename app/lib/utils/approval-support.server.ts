import { prisma } from "~/lib/db/db.server";
import { 
  SupportTicketCategory, 
  SupportTicketPriority, 
  SupportTicketStatus,
  MessageType,
  NotificationType,
  UserRole
} from "@prisma/client";

/**
 * Create support ticket when provider submits for approval
 */
export async function createApprovalSupportTicket(
  providerId: string,
  serviceType: "property" | "vehicle" | "tour",
  serviceId: string,
  serviceName: string,
  submissionData?: any
) {
  const ticketNumber = `ST${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      title: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Approval Request: ${serviceName}`,
      description: `Provider has submitted ${serviceName} for approval. Please review the submission and provide feedback.`,
      category: SupportTicketCategory.APPROVAL_QUESTIONS,
      priority: SupportTicketPriority.HIGH,
      status: SupportTicketStatus.NEW,
      providerId,
      relatedServiceId: serviceId,
      relatedServiceType: serviceType,
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
      content: `📋 **Approval Request Submitted**\n\nProvider ${ticket.provider.name} has submitted "${serviceName}" for approval.\n\nService Type: ${serviceType}\nService ID: ${serviceId}\n\nPlease review the submission and provide feedback.`,
      type: MessageType.SYSTEM,
      ticketId: ticket.id,
      senderId: providerId,
      systemData: {
        action: "approval_submitted",
        serviceType,
        serviceId,
        serviceName,
        submissionData,
      },
    },
  });

  // Create notification for admin
  await prisma.notification.create({
    data: {
      type: NotificationType.SUPPORT_TICKET_CREATED,
      title: "New Approval Request",
      message: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} approval request from ${ticket.provider.name}`,
      userId: providerId, // This should be admin ID in real implementation
      userRole: UserRole.SUPER_ADMIN,
      actionUrl: `/admin/support/${ticket.id}`,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        providerName: ticket.provider.name,
        serviceType,
        serviceId,
        serviceName,
      },
    },
  });

  return ticket;
}

/**
 * Handle approval decision in support ticket
 */
export async function handleApprovalDecision(
  ticketId: string,
  decision: "approved" | "rejected",
  adminId: string,
  feedback?: string,
  requiredDocuments?: string[]
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      provider: true,
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Create system message for decision
  const decisionMessage = decision === "approved" 
    ? `✅ **Approval Granted**\n\nYour ${ticket.relatedServiceType} has been approved! 🎉\n\n${feedback ? `**Feedback:** ${feedback}` : ""}`
    : `❌ **Approval Rejected**\n\nYour ${ticket.relatedServiceType} submission has been rejected.\n\n${feedback ? `**Reason:** ${feedback}` : ""}${requiredDocuments ? `\n\n**Required Actions:**\n${requiredDocuments.map(doc => `• ${doc}`).join('\n')}` : ""}`;

  await prisma.supportMessage.create({
    data: {
      content: decisionMessage,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: adminId,
      systemData: {
        action: "approval_decision",
        decision,
        feedback,
        requiredDocuments,
      },
    },
  });

  // Update ticket status
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: decision === "approved" ? SupportTicketStatus.RESOLVED : SupportTicketStatus.WAITING,
      resolvedAt: decision === "approved" ? new Date() : null,
      resolvedBy: decision === "approved" ? adminId : null,
      resolution: decision === "approved" ? "Approved" : "Rejected - requires resubmission",
    },
  });

  // Create notification for provider
  await prisma.notification.create({
    data: {
      type: NotificationType.SUPPORT_TICKET_UPDATED,
      title: decision === "approved" ? "Approval Granted!" : "Approval Rejected",
      message: decision === "approved" 
        ? `Your ${ticket.relatedServiceType} has been approved!`
        : `Your ${ticket.relatedServiceType} submission needs attention.`,
      userId: ticket.providerId,
      userRole: ticket.provider.role,
      actionUrl: `/dashboard/support/${ticketId}`,
      data: {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        decision,
        feedback,
      },
    },
  });

  return ticket;
}

/**
 * Request additional documents from provider
 */
export async function requestAdditionalDocuments(
  ticketId: string,
  adminId: string,
  requiredDocuments: string[],
  instructions?: string
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      provider: true,
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const message = `📄 **Additional Documents Required**\n\nPlease provide the following documents:\n\n${requiredDocuments.map(doc => `• ${doc}`).join('\n')}\n\n${instructions ? `**Instructions:** ${instructions}` : ""}\n\nYou can upload these documents in this chat or through your dashboard.`;

  await prisma.supportMessage.create({
    data: {
      content: message,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: adminId,
      systemData: {
        action: "document_request",
        requiredDocuments,
        instructions,
      },
    },
  });

  // Update ticket status
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: SupportTicketStatus.WAITING,
    },
  });

  // Create notification for provider
  await prisma.notification.create({
    data: {
      type: NotificationType.SUPPORT_MESSAGE_RECEIVED,
      title: "Additional Documents Required",
      message: `Please provide additional documents for your ${ticket.relatedServiceType} submission.`,
      userId: ticket.providerId,
      userRole: ticket.provider.role,
      actionUrl: `/dashboard/support/${ticketId}`,
      data: {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        requiredDocuments,
      },
    },
  });

  return ticket;
}

/**
 * Handle document upload in support ticket
 */
export async function handleDocumentUpload(
  ticketId: string,
  providerId: string,
  documentUrls: string[],
  description?: string
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const message = `📎 **Documents Uploaded**\n\n${description || "Additional documents have been uploaded for review."}\n\n**Uploaded Files:**\n${documentUrls.map(url => `• [${url.split('/').pop()}](${url})`).join('\n')}`;

  await prisma.supportMessage.create({
    data: {
      content: message,
      type: MessageType.TEXT,
      ticketId,
      senderId: providerId,
      attachments: documentUrls,
      systemData: {
        action: "document_upload",
        documentUrls,
        description,
      },
    },
  });

  // Update ticket status
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: SupportTicketStatus.IN_PROGRESS,
      lastMessageAt: new Date(),
    },
  });

  return ticket;
}

/**
 * Get approval-related support tickets
 */
export async function getApprovalSupportTickets(
  filters: {
    serviceType?: string;
    status?: SupportTicketStatus;
    providerId?: string;
  } = {}
) {
  const where: any = {
    category: SupportTicketCategory.APPROVAL_QUESTIONS,
  };

  if (filters.serviceType) {
    where.relatedServiceType = filters.serviceType;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.providerId) {
    where.providerId = filters.providerId;
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
  });
}

/**
 * Link approval ticket to actual service approval
 */
export async function linkApprovalToService(
  ticketId: string,
  serviceId: string,
  serviceType: string,
  approvalStatus: "approved" | "rejected"
) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      relatedServiceId: serviceId,
      relatedServiceType: serviceType,
      status: approvalStatus === "approved" ? SupportTicketStatus.RESOLVED : SupportTicketStatus.WAITING,
      resolvedAt: approvalStatus === "approved" ? new Date() : null,
    },
  });

  // Create system message for linking
  await prisma.supportMessage.create({
    data: {
      content: `🔗 **Service Linked**\n\nThis ticket has been linked to the ${serviceType} approval process.\n\n**Service ID:** ${serviceId}\n**Status:** ${approvalStatus}`,
      type: MessageType.SYSTEM,
      ticketId,
      senderId: ticket.providerId,
      systemData: {
        action: "service_linked",
        serviceId,
        serviceType,
        approvalStatus,
      },
    },
  });

  return ticket;
}
