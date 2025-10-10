import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { ChatContainer } from "~/components/chat/ChatContainer";
import { MessageCircle, Users, Settings } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, avatar: true }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Get conversations for this user
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { has: userId }
    },
    include: {
      participants: {
        select: { id: true, name: true, role: true, avatar: true }
      },
      lastMessage: {
        include: {
          sender: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  // Get unread message counts
  const unreadCounts = await prisma.message.groupBy({
    by: ['conversationId'],
    where: {
      conversationId: { in: conversations.map(c => c.id) },
      senderId: { not: userId },
      readBy: { not: { has: userId } }
    },
    _count: { id: true }
  });

  const unreadMap = unreadCounts.reduce((acc, item) => {
    acc[item.conversationId] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  return json({
    user,
    conversations: conversations.map(conv => ({
      id: conv.id,
      participants: conv.participants.filter(p => p.id !== userId),
      lastMessage: conv.lastMessage,
      updatedAt: conv.updatedAt,
      unreadCount: unreadMap[conv.id] || 0
    }))
  });
}

export default function MessagesDashboard() {
  const { user, conversations } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-[#01502E]" />
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          </div>
          <p className="text-gray-600">
            Chat with customers, service providers, and support team
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-sm border">
          <ChatContainer 
            currentUserId={user.id}
            className="h-[600px]"
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Start New Chat</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Start a conversation with any user on the platform
            </p>
            <button className="w-full bg-[#01502E] text-white px-4 py-2 rounded-md hover:bg-[#013d23] transition-colors">
              New Conversation
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Support Chat</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Get help from our support team
            </p>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Contact Support
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Chat Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Manage your chat preferences and notifications
            </p>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}