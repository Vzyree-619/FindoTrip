import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";
import { markMessagesAsRead } from "~/lib/chat.server";

// POST /api/chat.read { conversationId: "<conversationId>" }
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const body = await request.json().catch(() => ({}));
  const conversationId = body.conversationId as string | undefined;
  if (!conversationId) return json({ error: "conversationId is required" }, { status: 400 });

  try {
    // Verify the user is a participant in the conversation
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) return json({ error: "Conversation not found" }, { status: 404 });
    if (!conv.participants?.includes(userId)) return json({ error: "Forbidden" }, { status: 403 });

    // Mark messages as read using the new chat system
    const count = await markMessagesAsRead(conversationId, userId);

    // Optionally, mark chat notifications as read for this user
    try {
      await prisma.notification.updateMany({
        where: { userId, type: "CHAT_MESSAGE", read: false },
        data: { read: true, readAt: new Date() },
      });
    } catch {}

    // Broadcast read receipt via SSE to peer
    try {
      // Notify all other participants in the conversation
      for (const pid of (conv.participants || [])) {
        if (!pid || pid === userId) continue;
        publishToUser(pid, "message", {
          type: "read_receipt",
          conversationId,
          senderId: userId,
          readCount: count,
        });
      }
    } catch {}

    return json({ ok: true, readCount: count });
  } catch (e) {
    console.error("chat.read error", e);
    return json({ error: "Failed to mark messages read" }, { status: 500 });
  }
}
