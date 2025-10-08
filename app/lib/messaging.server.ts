import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";

export interface SendMessageInput {
  senderId: string;
  receiverId: string;
  content: string;
  bookingId?: string;
  bookingType?: "property" | "vehicle" | "tour";
  attachments?: string[];
  threadId?: string; // optional conversation id (ObjectId string)
  replyToId?: string;
}

export async function sendMessage(input: SendMessageInput) {
  const msg = await prisma.message.create({
    data: {
      subject: null,
      content: input.content,
      senderId: input.senderId,
      receiverId: input.receiverId,
      senderRole: undefined as any, // optional if you want to set roles
      receiverRole: undefined as any,
      bookingId: input.bookingId,
      bookingType: input.bookingType,
      threadId: input.threadId,
      replyToId: input.replyToId,
      attachments: input.attachments || [],
    },
  });

  // Real-time push to receiver
  publishToUser(input.receiverId, "message", {
    id: msg.id,
    senderId: input.senderId,
    content: input.content,
    attachments: msg.attachments,
    createdAt: msg["createdAt" as any],
  });

  return msg;
}

export async function listConversations(userId: string, take = 20) {
  // Latest message per peer (simple heuristic, not true threads)
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { "createdAt": "desc" as any },
    take: 200,
  });
  const seen = new Set<string>();
  const conversations: any[] = [];
  for (const m of messages) {
    const peerId = m.senderId === userId ? m.receiverId : m.senderId;
    if (!peerId || seen.has(peerId)) continue;
    seen.add(peerId);
    conversations.push({
      peerId,
      lastMessage: m,
    });
    if (conversations.length >= take) break;
  }
  return conversations;
}

export async function listMessages(userId: string, peerId: string, take = 50) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    },
    orderBy: { "createdAt": "asc" as any },
    take: Math.min(Math.max(take, 1), 200),
  });
  return messages;
}

export async function markMessagesRead(userId: string, peerId?: string) {
  if (peerId) {
    // mark messages sent by peer to user as read
    await prisma.message.updateMany({
      where: {
        senderId: peerId,
        receiverId: userId,
        read: false,
      },
      data: { read: true, readAt: new Date() },
    });
  } else {
    await prisma.message.updateMany({
      where: { receiverId: userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
  return { success: true };
}
