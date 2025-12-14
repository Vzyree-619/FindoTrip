import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { getSuperAdmin } from "~/lib/utils/admin.server";
import { ConversationType } from "~/lib/chat.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    // Get super admin
    const admin = await getSuperAdmin();
    if (!admin) {
      return json({ error: "Support team is currently unavailable" }, { status: 503 });
    }

    // Check if guest user exists, or create one
    let guestUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!guestUser) {
      // Create a guest user account
      guestUser = await prisma.user.create({
        data: {
          email,
          name,
          password: "", // No password for guest users
          role: "CUSTOMER",
          verified: false,
          active: true,
        },
        select: { id: true, name: true },
      });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: [guestUser.id, admin.id] },
        type: ConversationType.CUSTOMER_ADMIN,
        isActive: true,
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          participants: [guestUser.id, admin.id],
          participantRoles: ["CUSTOMER", "SUPER_ADMIN"],
          type: ConversationType.CUSTOMER_ADMIN,
          unreadCount: {},
          lastReadAt: {},
          hiddenBy: [],
          isActive: true,
        },
      });
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: guestUser.id,
        content: message,
        type: "TEXT",
        isRead: false,
        readBy: [],
        readAt: {},
        attachments: [],
      },
    });

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessage: {
          content: message,
          senderId: guestUser.id,
          senderName: name,
        },
        unreadCount: {
          ...(conversation.unreadCount as Record<string, number> || {}),
          [admin.id]: ((conversation.unreadCount as Record<string, number> || {})[admin.id] || 0) + 1,
        },
      },
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "MESSAGE_RECEIVED",
        title: "New Message from Visitor",
        message: `${name} sent you a message: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
        userRole: "SUPER_ADMIN",
        metadata: {
          conversationId: conversation.id,
          senderId: guestUser.id,
          senderName: name,
        },
      },
    });

    return json({
      success: true,
      conversationId: conversation.id,
      messageId: newMessage.id,
      guestUserId: guestUser.id,
    });
  } catch (error) {
    console.error("Error creating public chat:", error);
    return json({ error: "Failed to create chat" }, { status: 500 });
  }
}

