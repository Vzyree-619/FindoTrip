import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// GET: conversations or messages
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "conversations"; // conversations | messages
  const peerId = url.searchParams.get("peerId");
  const take = parseInt(url.searchParams.get("take") || "50", 10);

  try {
    if (mode === "messages") {
      if (!peerId) return json({ error: "peerId required" }, { status: 400 });
      
      // Find conversation with this peer
      const conversation = await prisma.conversation.findFirst({
        where: {
          participants: { has: userId },
          participants: { has: peerId },
          isActive: true
        },
        include: {
          messages: {
            include: {
              sender: { select: { id: true, name: true, role: true, avatar: true } }
            },
            orderBy: { createdAt: "asc" },
            take: Math.min(take, 200)
          }
        }
      });
      
      const items = conversation?.messages || [];
      return json({ items });
    }

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { has: userId },
        isActive: true
      },
      include: {
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true, avatar: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { lastMessageAt: "desc" },
      take: Math.min(Math.max(take, 1), 50)
    });

    const items = conversations.map(conv => ({
      id: conv.id,
      participants: conv.participants,
      lastMessage: conv.messages[0],
      updatedAt: conv.lastMessageAt
    }));

    return json({ items });
  } catch (error) {
    console.error("Error in messages API:", error);
    return json({ items: [] });
  }
}

// POST: send or mark read
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  try {
    if (intent === "send") {
      const receiverId = form.get("receiverId") as string;
      const content = (form.get("content") as string) || "";
      const attachmentsRaw = form.get("attachments") as string | null;
      let attachments: string[] | undefined;
      if (attachmentsRaw) {
        try { attachments = JSON.parse(attachmentsRaw); } catch {}
      }

      if (!receiverId || !content) return json({ error: "receiverId and content required" }, { status: 400 });

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          participants: { has: userId },
          participants: { has: receiverId },
          isActive: true
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participants: [userId, receiverId],
            participantRoles: ["CUSTOMER", "CUSTOMER"], // Default roles
            type: "CUSTOMER_PROVIDER",
            isActive: true,
            unreadCount: {},
            lastReadAt: {}
          }
        });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          content,
          senderId: userId,
          senderRole: "CUSTOMER",
          conversationId: conversation.id,
          attachments: attachments || []
        }
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
          messageCount: { increment: 1 }
        }
      });

      return json({ success: true, message });
    }

    if (intent === "mark-read") {
      const peerId = form.get("peerId") as string | undefined;
      if (peerId) {
        // Find conversation and mark messages as read
        const conversation = await prisma.conversation.findFirst({
          where: {
            participants: { has: userId },
            participants: { has: peerId },
            isActive: true
          }
        });

        if (conversation) {
          await prisma.message.updateMany({
            where: {
              conversationId: conversation.id,
              senderId: peerId,
              readBy: { not: { has: userId } }
            },
            data: {
              readBy: { push: userId }
            }
          });
        }
      }
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in messages action:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
