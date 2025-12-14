import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { formatConversationDetails, hydrateParticipants } from "~/lib/chat.server";

/**
 * Public API to fetch conversation by ID
 * Allows visitors to load their conversation without authentication
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const conversationId = params.id;
    
    if (!conversationId) {
      return json(
        { success: false, error: "Conversation ID required" },
        { status: 400 }
      );
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          where: { isDeleted: { not: true } },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 100, // Load last 100 messages
        },
      },
    });

    if (!conversation) {
      return json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Format conversation with hydrated participants
    const formatted = await formatConversationDetails(await hydrateParticipants(conversation));

    // Format messages for frontend
    const formattedMessages = formatted.messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      content: msg.content,
      type: msg.type.toLowerCase() as "text" | "image" | "file" | "system",
      createdAt: msg.createdAt,
      isRead: msg.isRead,
      attachments: msg.attachments || [],
    }));

    return json({
      success: true,
      conversationId: formatted.id,
      messages: formattedMessages,
      participants: formatted.participants,
    });
  } catch (error) {
    console.error("Error fetching public conversation:", error);
    return json(
      { success: false, error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

