import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";

// POST /api/chat.read { conversationId: "userA:userB" }
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const body = await request.json().catch(() => ({}));
  const conversationId = body.conversationId as string | undefined;
  if (!conversationId) return json({ error: "conversationId is required" }, { status: 400 });

  try {
    const [a, b] = conversationId.split(":");
    if (!a || !b) return json({ error: "Invalid conversationId" }, { status: 400 });
    if (a !== userId && b !== userId) return json({ error: "Forbidden" }, { status: 403 });
    const peerId = a === userId ? b : a;

    // Mark incoming messages as read
    const result = await prisma.message.updateMany({
      where: { senderId: peerId, receiverId: userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    // Optionally, mark chat notifications as read for this user
    try {
      await prisma.notification.updateMany({
        where: { userId, type: "CHAT_MESSAGE", read: false },
        data: { read: true, readAt: new Date() },
      });
    } catch {}

    // Broadcast read receipt via SSE to peer
    try {
      publishToUser(peerId, "message", {
        type: "read_receipt",
        conversationId,
        senderId: userId,
        readCount: result.count,
      });
    } catch {}

    return json({ ok: true, readCount: result.count });
  } catch (e) {
    console.error("chat.read error", e);
    return json({ error: "Failed to mark messages read" }, { status: 500 });
  }
}
