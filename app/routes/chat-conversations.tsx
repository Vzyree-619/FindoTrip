import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// GET /api/chat.conversations - List all conversations for current user
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  
  // If no user is logged in, return empty data instead of redirecting
  if (!userId) {
    return json({
      success: true,
      data: {
        conversations: [],
        currentUserId: null,
        userId: null
      }
    });
  }

  try {
    // Get conversations where user is a participant
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
      take: 50
    });

    // Process conversations and get participant details
    const processedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get other participants (excluding current user)
        const otherParticipantIds = conv.participants.filter(id => id !== userId);
        
        // Fetch participant details
        const participants = await prisma.user.findMany({
          where: { id: { in: otherParticipantIds } },
          select: { id: true, name: true, role: true, avatar: true }
        });

        // Get unread count for this user
        const unreadCount = conv.unreadCount && typeof conv.unreadCount === 'object' 
          ? (conv.unreadCount as any)[userId] || 0 
          : 0;

        return {
          id: conv.id,
          participants,
          lastMessage: conv.messages[0] ? {
            id: conv.messages[0].id,
            content: conv.messages[0].content,
            senderId: conv.messages[0].senderId,
            senderName: conv.messages[0].sender.name,
            createdAt: conv.messages[0].createdAt
          } : undefined,
          lastMessageAt: conv.lastMessageAt,
          updatedAt: conv.lastMessageAt,
          unreadCount
        };
      })
    );

    return json({ 
      success: true,
      data: { 
        conversations: processedConversations, 
        currentUserId: userId,
        userId: userId
      } 
    });
  } catch (e) {
    console.error("chat.conversations loader error", e);
    return json({ 
      success: false,
      data: { 
        conversations: [], 
        currentUserId: userId,
        userId: userId 
      },
      error: "Failed to load conversations"
    }, { status: 500 });
  }
}
