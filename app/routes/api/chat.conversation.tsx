import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// GET /api/chat.conversation?conversationId=<userA:userB> | targetUserId=...
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const conversationKey = url.searchParams.get("conversationId");
  const targetUserId = url.searchParams.get("targetUserId");

  try {
    let peerId: string | null = null;
    if (conversationKey && conversationKey.includes(":")) {
      const [a, b] = conversationKey.split(":");
      if (a !== userId && b !== userId) return json({ error: "Forbidden" }, { status: 403 });
      peerId = a === userId ? b : a;
    } else if (targetUserId) {
      peerId = targetUserId;
    } else {
      return json({ error: "Missing conversationId or targetUserId" }, { status: 400 });
    }

    // Load recent 50 messages between user and peer (oldest first)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId!, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // Participants
    const users = await prisma.user.findMany({
      where: { id: { in: [userId, peerId!] } },
      select: { id: true, name: true, role: true },
    });

    const convKey = [userId, peerId!].sort().join(":");

    return json({
      conversation: {
        id: convKey,
        participants: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
        updatedAt: messages[messages.length - 1]?.createdAt || new Date(0),
        lastMessage: messages[messages.length - 1] || null,
        unreadCount: {},
      },
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: convKey,
        senderId: m.senderId,
        content: m.content,
        type: "text",
        attachments: m.attachments as any,
        createdAt: m.createdAt,
        status: m.read ? (m.receiverId === userId ? "read" : "sent") : "sent",
      })),
    });
  } catch (e) {
    console.error("chat.conversation loader error", e);
    return json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
