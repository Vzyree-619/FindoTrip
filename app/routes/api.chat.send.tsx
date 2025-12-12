import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";
import { createAndDispatchNotification } from "~/lib/notifications.server";
import { getOrCreateConversation } from "~/lib/chat.server";
import type { UserRole, MessageType } from "@prisma/client";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const form = await request.formData();
    const conversationId = (form.get("conversationId") as string) || undefined;
    const targetUserId = (form.get("targetUserId") as string) || undefined;
    const text = (form.get("text") as string) || "";

    console.log('🔵 [API /chat/send] Request:', { userId, conversationId, targetUserId, textLength: text.length });

    if (!text.trim() && !form.getAll("files").length) {
      console.log('❌ [API /chat/send] No message content');
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

    console.log('🟢 [API /chat/send] Message sent successfully:', { messageId: msg.id, conversationId: conversation.id });
    return json({ ok: true, data: wireMessage });
  } catch (e) {
    console.error("❌ [API /chat/send] Error:", e);
    console.error("❌ [API /chat/send] Error details:", {
      message: (e as Error).message,
      stack: (e as Error).stack?.split('\n').slice(0, 3).join('\n')
    });
    return json({ error: "Failed to send message", details: (e as Error).message }, { status: 500 });
  }
  } catch (outerError) {
    console.error("❌ [API /chat/send] Outer error:", outerError);
    return json({ error: "Server error", details: (outerError as Error).message }, { status: 500 });
  }
}
