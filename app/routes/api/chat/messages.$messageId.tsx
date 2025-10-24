import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// GET /api/chat/messages/:messageId - Get message details
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const messageId = params.messageId;

  if (!messageId) {
    return json({ error: "Message ID required" }, { status: 400 });
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
        conversation: {
          include: {
            participants: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });

    if (!message) {
      return json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user has access to this message
    const hasAccess = message.conversation.participants.some(p => p.id === userId);
    if (!hasAccess) {
      return json({ error: "Access denied" }, { status: 403 });
    }

    return json({ message });
  } catch (error) {
    console.error("Error fetching message:", error);
    return json({ error: "Failed to fetch message" }, { status: 500 });
  }
}

// PATCH /api/chat/messages/:messageId - Edit message
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const messageId = params.messageId;

  if (!messageId) {
    return json({ error: "Message ID required" }, { status: 400 });
  }

  if (request.method === "PATCH") {
    try {
      const { content } = await request.json();

      if (!content || content.trim().length === 0) {
        return json({ error: "Message content required" }, { status: 400 });
      }

      // Get the message to check permissions
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true, role: true } }
            }
          }
        }
      });

      if (!message) {
        return json({ error: "Message not found" }, { status: 404 });
      }

      // Check if user can edit this message (only sender or admin)
      const isSender = message.senderId === userId;
      const isAdmin = message.conversation.participants.find(p => p.id === userId)?.role === 'SUPER_ADMIN';
      
      if (!isSender && !isAdmin) {
        return json({ error: "Permission denied" }, { status: 403 });
      }

      // Update the message
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: content.trim(),
          isEdited: true,
          editedAt: new Date(),
          editHistory: {
            push: message.content // Add previous content to edit history
          }
        },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        }
      });

      return json({ message: updatedMessage });
    } catch (error) {
      console.error("Error editing message:", error);
      return json({ error: "Failed to edit message" }, { status: 500 });
    }
  }

  // DELETE /api/chat/messages/:messageId - Delete message
  if (request.method === "DELETE") {
    try {
      const { deleteForEveryone } = await request.json();

      // Get the message to check permissions
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true, role: true } }
            }
          }
        }
      });

      if (!message) {
        return json({ error: "Message not found" }, { status: 404 });
      }

      // Check permissions
      const isSender = message.senderId === userId;
      const isAdmin = message.conversation.participants.find(p => p.id === userId)?.role === 'SUPER_ADMIN';
      
      if (!isSender && !isAdmin) {
        return json({ error: "Permission denied" }, { status: 403 });
      }

      // Only admins can delete for everyone
      if (deleteForEveryone && !isAdmin) {
        return json({ error: "Only admins can delete messages for everyone" }, { status: 403 });
      }

      if (deleteForEveryone) {
        // Delete for everyone - mark as deleted by admin
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId,
            content: "This message was deleted"
          }
        });
        return json({ message: updatedMessage });
      } else {
        // Delete for user only - mark as deleted by user
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId,
            content: "You deleted this message"
          }
        });
        return json({ message: updatedMessage });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      return json({ error: "Failed to delete message" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
