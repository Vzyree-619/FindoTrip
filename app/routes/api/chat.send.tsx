import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";
import { createAndDispatchNotification } from "~/lib/notifications.server";
import type { UserRole } from "@prisma/client";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const conversationKey = (form.get("conversationId") as string) || undefined; // optional synthetic key
  const targetUserId = (form.get("targetUserId") as string) || undefined;
  const text = (form.get("text") as string) || "";

  if (!text.trim() && !form.getAll("files").length) {
    return json({ error: "Message content is required" }, { status: 400 });
  }

  try {
    // Determine peer (receiver)
    let peerId = targetUserId;
    if (!peerId && conversationKey?.includes(":")) {
      const [a, b] = conversationKey.split(":");
      peerId = a === userId ? b : a;
    }
    if (!peerId) return json({ error: "targetUserId is required" }, { status: 400 });

    // Roles
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
    const them = await prisma.user.findUnique({ where: { id: peerId }, select: { role: true } });
    const senderRole = (me?.role as UserRole) || ("CUSTOMER" as UserRole);
    const receiverRole = (them?.role as UserRole) || ("CUSTOMER" as UserRole);

    // Attachments placeholder (store filenames only)
    const files = form.getAll("files") as File[];
    const attachmentNames = files.map((f) => (f as any).name).filter(Boolean);

    // Create message using existing Message model (sender/receiver)
    const msg = await prisma.message.create({
      data: {
        subject: null,
        content: text,
        senderId: userId,
        receiverId: peerId,
        senderRole,
        receiverRole,
        attachments: attachmentNames,
      },
      select: { id: true, content: true, senderId: true, createdAt: true },
    });

    const convKey = [userId, peerId].sort().join(":");

    // Wire message for clients
    const wireMessage = {
      id: msg.id,
      conversationId: convKey,
      senderId: msg.senderId,
      content: msg.content,
      type: "text",
      attachments: attachmentNames,
      createdAt: msg.createdAt,
      status: "sent" as const,
    };

    // Publish SSE to both participants
    for (const pid of [userId, peerId]) {
      publishToUser(pid, "message", {
        type: "chat_message",
        conversationId: convKey,
        message: wireMessage,
      });
    }

    // Create & dispatch notification for receiver
    try {
      const preview = text.trim().slice(0, 140) || (attachmentNames.length ? "Sent an attachment" : "New message");
      const title = `New message from ${me?.name || "a user"}`;
      await createAndDispatchNotification({
        userId: peerId,
        userRole: receiverRole,
        type: "MESSAGE_RECEIVED" as any,
        title,
        message: preview,
        actionUrl: `/dashboard?openChat=1&conversationId=${convKey}`,
        data: { conversationId: convKey, messageId: msg.id, senderId: userId, preview },
        priority: "NORMAL",
      });
    } catch {}

    return json({ ok: true, message: wireMessage });
  } catch (e) {
    console.error("chat.send error", e);
    return json({ error: "Failed to send message" }, { status: 500 });
  }
}
