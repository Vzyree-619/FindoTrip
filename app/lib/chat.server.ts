import { prisma } from "~/lib/db/db.server";
import { UserRole } from "@prisma/client";

// Define enums locally until Prisma generates them
export enum ConversationType {
  CUSTOMER_PROVIDER = "CUSTOMER_PROVIDER",
  PROVIDER_ADMIN = "PROVIDER_ADMIN", 
  CUSTOMER_ADMIN = "CUSTOMER_ADMIN",
  GROUP_CHAT = "GROUP_CHAT",
  SUPPORT_TICKET = "SUPPORT_TICKET"
}

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  FILE = "FILE",
  SYSTEM = "SYSTEM",
  NOTIFICATION = "NOTIFICATION",
  REPLY = "REPLY"
}

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

export interface ConversationParticipant {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isOnline?: boolean;
  lastActiveAt?: Date;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title?: string;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
    type: MessageType;
  };
  lastMessageAt: Date;
  unreadCount: number;
  participants: ConversationParticipant[];
  isActive: boolean;
  isPinned: boolean;
  relatedBookingId?: string;
  relatedServiceId?: string;
  relatedServiceType?: string;
}

export interface MessageWithSender {
  id: string;
  conversationId: string;
  content: string;
  type: MessageType;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  createdAt: Date;
  isRead: boolean;
  readBy: string[];
  readAt: Record<string, Date>;
  isEdited: boolean;
  editedAt?: Date;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  attachments: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
}

export interface ConversationDetails {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  participants: ConversationParticipant[];
  messages: MessageWithSender[];
  isActive: boolean;
  isPinned: boolean;
  unreadCount: number;
  lastMessageAt: Date;
  relatedBookingId?: string;
  relatedServiceId?: string;
  relatedServiceType?: string;
  responseTime?: number;
  customerSatisfaction?: number;
  qualityScore?: number;
}

export interface UnreadCount {
  total: number;
  byConversation: Record<string, number>;
}

export interface SearchResult {
  conversation: ConversationSummary;
  context: {
    messageId: string;
    content: string;
    senderName: string;
    createdAt: Date;
  };
}

export interface ChatPermissions {
  canAccess: boolean;
  reason?: string;
}

// ========================================
// CONVERSATION MANAGEMENT FUNCTIONS
// ========================================

/**
 * Get or create a conversation between two users
 * Note: This function will work once the new chat models are generated
 */
export async function getOrCreateConversation(
  user1Id: string,
  user2Id: string,
  type: ConversationType,
  relatedId?: string,
  relatedType?: string
): Promise<ConversationDetails> {
  try {
    if (!user1Id || !user2Id) throw new Error("Both user IDs are required");
    if (user1Id === user2Id) throw new Error("Cannot create conversation with self");

    const existing = await prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: [user1Id, user2Id] },
        type,
        isActive: true,
      },
      include: {
        messages: {
          include: { sender: { select: { id: true, name: true, role: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (existing) return formatConversationDetails(await hydrateParticipants(existing));

    const [u1, u2] = await Promise.all([
      prisma.user.findUnique({ where: { id: user1Id }, select: { id: true, name: true, role: true, avatar: true, lastActiveAt: true } }),
      prisma.user.findUnique({ where: { id: user2Id }, select: { id: true, name: true, role: true, avatar: true, lastActiveAt: true } }),
    ]);
    if (!u1 || !u2) throw new Error("User not found");

    const convo = await prisma.conversation.create({
      data: {
        participants: [user1Id, user2Id],
        participantRoles: [u1.role, u2.role],
        type,
        relatedBookingId: relatedType === "booking" ? relatedId : undefined,
        relatedBookingType: relatedType === "booking" ? undefined : undefined,
        relatedServiceId: relatedType && relatedType !== "booking" ? relatedId : undefined,
        relatedServiceType: relatedType && relatedType !== "booking" ? relatedType : undefined,
        unreadCount: {},
        lastReadAt: {},
        hiddenBy: [],
      },
      include: {
        messages: {
          include: { sender: { select: { id: true, name: true, role: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return formatConversationDetails(await hydrateParticipants(convo));
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    throw new Error("Failed to get or create conversation");
  }
}

/**
 * Get all conversations for a user
 * Note: This function will work once the new chat models are generated
 */
export async function getUserConversations(
  userId: string,
  role?: UserRole,
  type?: ConversationType,
  limit: number = 50,
  offset: number = 0
): Promise<ConversationSummary[]> {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { has: userId },
        ...(type ? { type } : {}),
        hiddenBy: { hasNot: userId },
      },
      include: {
        messages: {
          include: { sender: { select: { id: true, name: true, role: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ lastMessageAt: "desc" }],
      skip: offset,
      take: limit,
    });

    const summaries = await Promise.all(
      conversations.map(async (c) => formatConversationSummary(await hydrateParticipants(c), userId))
    );
    return summaries;
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    throw new Error("Failed to get user conversations");
  }
}

/**
 * Get conversation by ID with full details
 * Note: This function will work once the new chat models are generated
 */
export async function getConversationById(
  conversationId: string,
  requestingUserId: string
): Promise<ConversationDetails> {
  try {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true, avatar: true } },
            replyTo: { include: { sender: { select: { id: true, name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!convo) throw new Error("Conversation not found");
    if (!convo.participants.includes(requestingUserId)) throw new Error("Access denied");
    if (convo.hiddenBy?.includes(requestingUserId)) throw new Error("Conversation not found");
    return formatConversationDetails(await hydrateParticipants(convo));
  } catch (error) {
    console.error("Error in getConversationById:", error);
    throw new Error("Failed to get conversation details");
  }
}

// ========================================
// MESSAGE OPERATIONS
// ========================================

/**
 * Send a message to a conversation
 * Note: This function will work once the new chat models are generated
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachments?: Array<{ url: string; name: string; type: string; size: number }>,
  replyToId?: string,
  type: MessageType = MessageType.TEXT
): Promise<MessageWithSender> {
  try {
    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!convo) throw new Error("Conversation not found");
    if (!convo.participants.includes(senderId)) throw new Error("Sender not in conversation");

    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { role: true } });
    const created = await prisma.message.create({
      data: {
        content,
        type,
        senderId,
        senderRole: (sender?.role as any) || undefined,
        conversationId,
        replyToId: replyToId || undefined,
        attachments: (attachments || []) as any,
        isRead: false,
        readBy: [],
        readAt: {},
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
        replyTo: { include: { sender: { select: { id: true, name: true } } } },
      },
    });

    // Update conversation metadata and unread counts
    const updatedUnread = { ...(convo.unreadCount as any) };
    for (const pid of convo.participants) {
      if (pid !== senderId) updatedUnread[pid] = (updatedUnread[pid] || 0) + 1;
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: created.id,
        lastMessageAt: created.createdAt,
        messageCount: (convo.messageCount || 0) + 1,
        unreadCount: updatedUnread,
        hiddenBy: { set: (convo.hiddenBy || []).filter((id: string) => id !== senderId) },
      },
    });

    // Create notifications for other participants
    const recipients = convo.participants.filter((p) => p !== senderId);
    if (recipients.length) {
      await prisma.chatNotification.createMany({
        data: recipients.map((uid) => ({
          userId: uid,
          conversationId,
          messageId: created.id,
          title: "New message",
          body: created.content.slice(0, 140),
          type: "message",
          priority: "NORMAL",
          isRead: false,
        })),
      });
      await prisma.user.updateMany({ where: { id: { in: recipients } }, data: { hasUnreadMessages: true } });
    }

    return formatMessageWithSender(created);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw new Error("Failed to send message");
  }
}

/**
 * Mark messages as read in a conversation
 * Note: This function will work once the new chat models are generated
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<number> {
  try {
    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!convo) throw new Error("Conversation not found");
    if (!convo.participants.includes(userId)) throw new Error("Access denied");

    const result = await prisma.message.updateMany({
      where: { conversationId, readBy: { hasNot: userId } },
      data: {
        readBy: { push: userId },
        readAt: { set: { ...(convo.lastReadAt as any), [userId]: new Date() } as any },
      },
    });

    const updatedUnread = { ...(convo.unreadCount as any) };
    updatedUnread[userId] = 0;
    await prisma.conversation.update({ where: { id: conversationId }, data: { unreadCount: updatedUnread } });
    return result.count || 0;
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    throw new Error("Failed to mark messages as read");
  }
}

// Alias to satisfy API spec naming
export async function markAsRead(conversationId: string, userId: string) {
  return markMessagesAsRead(conversationId, userId);
}

// Fetch messages with pagination and auto-mark as read
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit: number,
  before?: string
): Promise<MessageWithSender[]> {
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) throw new Error("Conversation not found");
  if (!convo.participants.includes(userId)) throw new Error("Access denied");

  const where: any = { conversationId };
  if (before) {
    // Fetch messages created before the 'before' message
    const pivot = await prisma.message.findUnique({ where: { id: before }, select: { createdAt: true } });
    if (pivot) where.createdAt = { lt: pivot.createdAt } as any;
  }

  const msgs = await prisma.message.findMany({
    where,
    include: { sender: { select: { id: true, name: true, role: true } }, replyTo: { include: { sender: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit || 50, 1), 200),
  });

  // Auto-mark any messages not read by user
  const unreadIds = msgs.filter((m) => !(m.readBy || []).includes(userId)).map((m) => m.id);
  if (unreadIds.length) {
    await prisma.message.updateMany({ where: { id: { in: unreadIds } }, data: { readBy: { push: userId }, readAt: { set: { ...(convo.lastReadAt as any), [userId]: new Date() } as any } } });
    const updatedUnread = { ...(convo.unreadCount as any) };
    updatedUnread[userId] = Math.max(0, (updatedUnread[userId] || 0) - unreadIds.length);
    await prisma.conversation.update({ where: { id: conversationId }, data: { unreadCount: updatedUnread } });
  }

  return msgs.map(formatMessageWithSender).reverse();
}

export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { hiddenBy: true, participants: true } });
  if (!convo) throw new Error("Conversation not found");
  if (!convo.participants.includes(userId)) throw new Error("Access denied");
  const updatedHidden = Array.from(new Set([...(convo.hiddenBy || []), userId]));
  await prisma.conversation.update({ where: { id: conversationId }, data: { hiddenBy: updatedHidden } });
  return true;
}

/**
 * Delete a message
 * Note: This function will work once the new chat models are generated
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  hardDelete: boolean = false
): Promise<boolean> {
  try {
    const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true, conversationId: true, isDeleted: true } });
    if (!msg) throw new Error("Message not found");
    if (msg.senderId !== userId) throw new Error("Not allowed");
    if (msg.isDeleted) return true;

    if (hardDelete) {
      await prisma.message.delete({ where: { id: messageId } });
    } else {
      await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } });
    }
    return true;
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    throw new Error("Failed to delete message");
  }
}

/**
 * Edit a message
 * Note: This function will work once the new chat models are generated
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
): Promise<MessageWithSender> {
  try {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: { select: { id: true, name: true, role: true } }, replyTo: { include: { sender: { select: { id: true, name: true } } } } },
    });
    if (!msg) throw new Error("Message not found");
    if (msg.senderId !== userId) throw new Error("Not allowed");
    if (msg.isDeleted) throw new Error("Cannot edit deleted message");

    const edited = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
        editHistory: { push: { content: msg.content, editedAt: msg.editedAt || msg.createdAt } as any },
      },
      include: { sender: { select: { id: true, name: true, role: true } }, replyTo: { include: { sender: { select: { id: true, name: true } } } } },
    });
    return formatMessageWithSender(edited);
  } catch (error) {
    console.error("Error in editMessage:", error);
    throw new Error("Failed to edit message");
  }
}

// ========================================
// REAL-TIME HELPERS
// ========================================

/**
 * Get unread count for a user
 * Note: This function will work once the new chat models are generated
 */
export async function getUnreadCount(userId: string): Promise<UnreadCount> {
  try {
    const convos = await prisma.conversation.findMany({ where: { participants: { has: userId } }, select: { id: true, unreadCount: true } });
    const byConversation: Record<string, number> = {};
    let total = 0;
    for (const c of convos) {
      const count = (c.unreadCount as any)?.[userId] || 0;
      byConversation[c.id] = count;
      total += count;
    }
    return { total, byConversation };
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    throw new Error("Failed to get unread count");
  }
}

/**
 * Search conversations
 * Note: This function will work once the new chat models are generated
 */
export async function searchConversations(
  userId: string,
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  try {
    // TODO: Implement once new models are generated
    // This is a placeholder implementation
    throw new Error("Chat models not yet generated. Run 'npx prisma generate' after schema update.");
  } catch (error) {
    console.error("Error in searchConversations:", error);
    throw new Error("Failed to search conversations");
  }
}

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Check if user can access conversation
 * Note: This function will work once the new chat models are generated
 */
export async function canUserAccessConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const c = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { participants: true, hiddenBy: true } });
    if (!c) return false;
    if (c.hiddenBy?.includes(userId)) return false;
    return c.participants.includes(userId);
  } catch (error) {
    console.error("Error in canUserAccessConversation:", error);
    return false;
  }
}

// Helper to replace participants string[] with user objects used by formatters
async function hydrateParticipants(conversation: any) {
  const users = await prisma.user.findMany({
    where: { id: { in: conversation.participants } },
    select: { id: true, name: true, role: true, avatar: true, lastActiveAt: true },
  });
  
  // Add online status based on lastActiveAt
  const usersWithOnlineStatus = users.map(user => ({
    ...user,
    online: user.lastActiveAt ? 
      new Date().getTime() - new Date(user.lastActiveAt).getTime() < 5 * 60 * 1000 : false
  }));
  
  return { ...conversation, participants: usersWithOnlineStatus };
}

/**
 * Validate chat permissions between users
 */
export async function validateChatPermissions(
  userId: string,
  userRole: UserRole,
  targetUserId: string,
  targetRole: UserRole
): Promise<ChatPermissions> {
  try {
    // Super Admin can chat with everyone
    if (userRole === UserRole.SUPER_ADMIN) {
      return { canAccess: true };
    }

    // Customer permissions
    if (userRole === UserRole.CUSTOMER) {
      const allowedRoles = [
        UserRole.PROPERTY_OWNER,
        UserRole.VEHICLE_OWNER,
        UserRole.TOUR_GUIDE,
        UserRole.SUPER_ADMIN
      ];
      
      if (allowedRoles.includes(targetRole)) {
        return { canAccess: true };
      }
      
      return {
        canAccess: false,
        reason: "Customers can only chat with service providers and admins"
      };
    }

    // Provider permissions
    if ([UserRole.PROPERTY_OWNER, UserRole.VEHICLE_OWNER, UserRole.TOUR_GUIDE].includes(userRole)) {
      const allowedRoles = [UserRole.CUSTOMER, UserRole.SUPER_ADMIN];
      
      if (allowedRoles.includes(targetRole)) {
        return { canAccess: true };
      }
      
      return {
        canAccess: false,
        reason: "Providers can only chat with customers and admins"
      };
    }

    return {
      canAccess: false,
      reason: "Invalid user role"
    };
  } catch (error) {
    console.error("Error in validateChatPermissions:", error);
    return {
      canAccess: false,
      reason: "Failed to validate permissions"
    };
  }
}

// ========================================
// NOTIFICATION INTEGRATION
// ========================================

/**
 * Send chat notification
 * Note: This function will work once the new chat models are generated
 */
export async function sendChatNotification(
  conversationId: string,
  messageId: string,
  recipientIds: string[]
): Promise<void> {
  try {
    // TODO: Implement once new models are generated
    // This is a placeholder implementation
    throw new Error("Chat models not yet generated. Run 'npx prisma generate' after schema update.");
  } catch (error) {
    console.error("Error in sendChatNotification:", error);
    throw new Error("Failed to send chat notification");
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatConversationSummary(conversation: any, userId: string): ConversationSummary {
  const otherParticipants = conversation.participants
    .filter((p: any) => p.id !== userId)
    .map((participant: any) => ({
      id: participant.id,
      name: participant.name || 'Unknown',
      role: participant.role || 'CUSTOMER',
      avatar: participant.avatar,
      isOnline: participant.online || false,
      lastActiveAt: participant.lastActiveAt
    }));

  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    lastMessage: conversation.messages[0] ? {
      id: conversation.messages[0].id,
      content: conversation.messages[0].content,
      senderId: conversation.messages[0].senderId,
      senderName: conversation.messages[0].sender.name,
      createdAt: conversation.messages[0].createdAt,
      type: conversation.messages[0].type
    } : undefined,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount[userId] || 0,
    participants: otherParticipants,
    isActive: conversation.isActive,
    isPinned: conversation.isPinned,
    relatedBookingId: conversation.relatedBookingId,
    relatedServiceId: conversation.relatedServiceId,
    relatedServiceType: conversation.relatedServiceType
  };
}

function formatConversationDetails(conversation: any): ConversationDetails {
  const participants = conversation.participants.map((participant: any) => ({
    id: participant.id,
    name: participant.name,
    role: participant.role,
    avatar: participant.avatar,
    isOnline: participant.lastActiveAt ? 
      new Date().getTime() - new Date(participant.lastActiveAt).getTime() < 5 * 60 * 1000 : false,
    lastActiveAt: participant.lastActiveAt
  }));

  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    description: conversation.description,
    participants,
    messages: conversation.messages.map(formatMessageWithSender),
    isActive: conversation.isActive,
    isPinned: conversation.isPinned,
    unreadCount: Object.values(conversation.unreadCount).reduce((sum: number, count: any) => sum + count, 0),
    lastMessageAt: conversation.lastMessageAt,
    relatedBookingId: conversation.relatedBookingId,
    relatedServiceId: conversation.relatedServiceId,
    relatedServiceType: conversation.relatedServiceType,
    responseTime: conversation.responseTime,
    customerSatisfaction: conversation.customerSatisfaction,
    qualityScore: conversation.qualityScore
  };
}

function formatMessageWithSender(message: any): MessageWithSender {
  return {
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    type: message.type,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderRole: message.sender.role,
    createdAt: message.createdAt,
    isRead: message.isRead,
    readBy: message.readBy,
    readAt: message.readAt,
    isEdited: message.isEdited,
    editedAt: message.editedAt,
    replyToId: message.replyToId,
    replyTo: message.replyTo ? {
      id: message.replyTo.id,
      content: message.replyTo.content,
      senderName: message.replyTo.sender.name
    } : undefined,
    attachments: message.attachments || []
  };
}

// ========================================
// IMPLEMENTATION NOTES
// ========================================

/*
IMPLEMENTATION STEPS:

1. Run 'npx prisma generate' to generate the new models
2. Update the database with 'npx prisma db push' or create a migration
3. Replace all placeholder implementations with actual Prisma queries
4. Test all functions with real data

EXAMPLE IMPLEMENTATION FOR getOrCreateConversation:

export async function getOrCreateConversation(
  user1Id: string,
  user2Id: string,
  type: ConversationType,
  relatedId?: string,
  relatedType?: string
): Promise<ConversationDetails> {
  try {
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          hasEvery: [user1Id, user2Id]
        },
        type,
        isActive: true
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        }
      }
    });

    if (existingConversation) {
      return formatConversationDetails(existingConversation);
    }

    // Get user details for participants
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user1Id },
        select: { id: true, name: true, role: true, avatar: true }
      }),
      prisma.user.findUnique({
        where: { id: user2Id },
        select: { id: true, name: true, role: true, avatar: true }
      })
    ]);

    if (!user1 || !user2) {
      throw new Error("One or both users not found");
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: [user1Id, user2Id],
        participantRoles: [user1.role, user2.role],
        type,
        relatedBookingId: relatedId,
        relatedBookingType: relatedType,
        unreadCount: {},
        lastReadAt: {}
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return formatConversationDetails(newConversation);
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    throw new Error("Failed to get or create conversation");
  }
}
*/
