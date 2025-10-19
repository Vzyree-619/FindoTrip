import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";
import { createAndDispatchNotification } from "~/lib/notifications.server";
import { getOrCreateConversation } from "~/lib/chat.server";
import type { UserRole, MessageType } from "@prisma/client";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const conversationId = (form.get("conversationId") as string) || undefined;
  const targetUserId = (form.get("targetUserId") as string) || undefined;
  const text = (form.get("text") as string) || "";

  if (!text.trim() && !form.getAll("files").length) {
    return json({ error: "Message content is required" }, { status: 400 });
  }

  try {
    // Determine peer (receiver)
    let peerId = targetUserId;
    if (!peerId && conversationId?.includes(":")) {
      const [a, b] = conversationId.split(":");
      peerId = a === userId ? b : a;
    }
    if (!peerId) return json({ error: "targetUserId is required" }, { status: 400 });

    // Get or create conversation
    const conversation = await getOrCreateConversation(
      userId,
      peerId,
      "CUSTOMER_PROVIDER" as any,
      undefined,
      undefined
    );

    // Get user info
    const me = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { role: true, name: true, avatar: true } 
    });
    const them = await prisma.user.findUnique({ 
      where: { id: peerId }, 
      select: { role: true, name: true } 
    });

    // Attachments handling
    const files = form.getAll("files") as File[];
    const attachments = files.map((f) => ({
      url: `/uploads/${(f as any).name}`,
      name: (f as any).name,
      type: (f as any).type || 'file',
      size: (f as any).size || 0
    }));

    // Create message using new Message model
    const msg = await prisma.message.create({
      data: {
        content: text,
        type: "TEXT" as MessageType,
        senderId: userId,
        senderRole: (me?.role as UserRole) || "CUSTOMER",
        conversationId: conversation.id,
        attachments: attachments,
        isRead: false,
        readBy: [],
        readAt: {},
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } }
      }
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageId: msg.id,
        unreadCount: {
          ...conversation.unreadCount,
          [peerId]: ((conversation.unreadCount as any)?.[peerId] || 0) + 1
        }
      }
    });

    // Wire message for clients
    const wireMessage = {
      id: msg.id,
      conversationId: conversation.id,
      senderId: msg.senderId,
      content: msg.content,
      type: "text",
      attachments: attachments,
      createdAt: msg.createdAt,
      status: "sent" as const,
      senderName: me?.name,
      senderAvatar: me?.avatar,
    };

    // Publish SSE to both participants
    for (const pid of [userId, peerId]) {
      publishToUser(pid, "message", {
        type: "chat_message",
        conversationId: conversation.id,
        message: wireMessage,
      });
    }

    // Create & dispatch notification for receiver
    try {
      const preview = text.trim().slice(0, 140) || (attachments.length ? "Sent an attachment" : "New message");
      const title = `New message from ${me?.name || "a user"}`;
      await createAndDispatchNotification({
        userId: peerId,
        userRole: (them?.role as UserRole) || "CUSTOMER",
        type: "MESSAGE_RECEIVED" as any,
        title,
        message: preview,
        actionUrl: `/dashboard/messages?conversationId=${conversation.id}`,
        data: { conversationId: conversation.id, messageId: msg.id, senderId: userId, preview },
        priority: "NORMAL",
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }

    return json({ ok: true, data: wireMessage });
  } catch (e) {
    console.error("chat.send error", e);
    return json({ error: "Failed to send message" }, { status: 500 });
  }
}
