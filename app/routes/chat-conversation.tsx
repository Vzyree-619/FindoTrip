import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { getOrCreateConversation } from "~/lib/chat.server";

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

    // Get or create conversation using the new system
    const conversation = await getOrCreateConversation(
      userId,
      peerId!,
      "CUSTOMER_PROVIDER" as any,
      undefined,
      undefined
    );

    // Fetch messages for this conversation
    const messages = await prisma.message.findMany({
      where: { 
        conversationId: conversation.id,
        isDeleted: false
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Participants with online status
    const users = await prisma.user.findMany({
      where: { id: { in: [userId, peerId!] } },
      select: { id: true, name: true, role: true, avatar: true, lastActiveAt: true },
    });

    // Calculate online status based on lastActiveAt
    const usersWithOnlineStatus = users.map(user => ({
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      online: user.lastActiveAt ? 
        new Date().getTime() - new Date(user.lastActiveAt).getTime() < 5 * 60 * 1000 : false
    }));

    return json({
      conversation: {
        id: conversation.id,
        participants: usersWithOnlineStatus,
        updatedAt: conversation.lastMessageAt || conversation.createdAt,
        lastMessage: messages[messages.length - 1] || null,
        unreadCount: conversation.unreadCount || {},
      },
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: conversation.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderAvatar: m.sender.avatar,
        content: m.content,
        type: m.type.toLowerCase(),
        attachments: m.attachments as any,
        createdAt: m.createdAt,
        status: m.isRead ? "read" : "sent",
        isEdited: m.isEdited,
        editedAt: m.editedAt,
        isDeleted: m.isDeleted,
        deletedAt: m.deletedAt,
        deletedBy: m.deletedBy,
      })),
    });
  } catch (e) {
    console.error("chat.conversation loader error", e);
    return json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
