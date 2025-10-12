import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import ChatContainer from "~/components/chat/ChatContainer";
import { MessageCircle, Users, Settings } from "lucide-react";
import { ThemeProvider, updateGlobalTheme } from "~/contexts/ThemeContext";
import { ThemeToggle } from "~/components/chat/ThemeToggle";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, avatar: true, chatSettings: true }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

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
        updatedAt: conv.lastMessageAt,
        unreadCount
      };
    })
  );

  // Parse chat settings
  const chatSettings = user.chatSettings ? JSON.parse(user.chatSettings) : {
    theme: 'light',
    fontSize: 'medium',
    soundEnabled: true,
    notificationsEnabled: true,
    showOnlineStatus: true,
    showReadReceipts: true,
    showTypingIndicators: true,
    autoDownloadMedia: false,
    messagePreview: true,
    darkMode: false
  };

  return json({
    user,
    conversations: processedConversations,
    chatSettings
  });
}

export default function MessagesDashboard() {
  const { user, conversations, chatSettings } = useLoaderData<typeof loader>();

  return (
    <ThemeProvider initialTheme={chatSettings?.theme || 'light'}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-[#01502E]" />
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-gray-600">
            Chat with customers, service providers, and support team
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <ChatContainer 
            currentUserId={user.id}
            theme={chatSettings?.theme || 'light'}
            className="h-[70vh] min-h-[500px] max-h-[800px]"
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
            <a 
              href="/dashboard/settings/chat"
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors inline-block text-center"
            >
              Settings
            </a>
          </div>
        </div>
        </div>
      </div>
    </ThemeProvider>
  );
}