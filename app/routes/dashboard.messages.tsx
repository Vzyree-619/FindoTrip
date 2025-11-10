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
  const url = new URL(request.url);
  const peerId = url.searchParams.get('peerId');
  
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

      // Add online status (mock for now)
      const participantsWithStatus = participants.map(p => ({
        ...p,
        online: Math.random() > 0.5 // Mock online status
      }));

      // Get unread count for this user
      const unreadCount = conv.unreadCount && typeof conv.unreadCount === 'object' 
        ? (conv.unreadCount as any)[userId] || 0 
        : 0;

      return {
        id: conv.id,
        participants: participantsWithStatus,
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
    chatSettings,
    peerId
  });
}

export default function MessagesDashboard() {
  const { user, conversations, chatSettings, peerId } = useLoaderData<typeof loader>();

  return (
    <ThemeProvider initialTheme={chatSettings?.theme || 'light'}>
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-[#01502E]" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Chat with customers, service providers, and support team
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 h-[calc(100vh-220px)]">
          <ChatContainer 
            currentUserId={user.id}
            theme={chatSettings?.theme || 'light'}
            initialPeerId={peerId}
          />
        </div>

        {/* Quick Actions - responsive layout */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Start New Chat</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Start a conversation with any user on the platform
            </p>
            <button className="w-full bg-[#01502E] text-white px-4 py-2 rounded-md hover:bg-[#013d23] transition-colors">
              New Conversation
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Support Chat</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Get help from our support team
            </p>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Contact Support
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chat Settings</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Manage your chat preferences and notifications
            </p>
            <a href="/dashboard/settings/chat" className="block w-full">
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                Settings
              </button>
            </a>
          </div>
        </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
