import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// GET /api/chat.conversations - List all conversations for current user
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  try {
    // Find all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        read: true,
      },
    });

    // Group by conversation (peer user)
    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      const peerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const convKey = [userId, peerId].sort().join(":");

      if (!conversationMap.has(convKey)) {
        // Get peer user info
        const peer = await prisma.user.findUnique({
          where: { id: peerId },
          select: { id: true, name: true, role: true },
        });

        conversationMap.set(convKey, {
          id: convKey,
          participants: [{ id: peerId, name: peer?.name, role: peer?.role }],
          lastMessage: msg,
          updatedAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      // Update last message if this is more recent
      const conv = conversationMap.get(convKey);
      if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
        conv.lastMessage = msg;
        conv.updatedAt = msg.createdAt;
      }

      // Count unread messages (received by current user, not read)
      if (msg.receiverId === userId && !msg.read) {
        conv.unreadCount++;
      }
    }

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return json({ conversations });
  } catch (e) {
    console.error("chat.conversations loader error", e);
    return json({ error: "Failed to load conversations" }, { status: 500 });
  }
}
