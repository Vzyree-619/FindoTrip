import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { ChatContainer } from "~/components/chat/ChatContainer";
import { MessageCircle } from "lucide-react";

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
      const otherParticipantId = conv.participants.find(id => id !== userId);
      const otherParticipant = otherParticipantId 
        ? await prisma.user.findUnique({
            where: { id: otherParticipantId },
            select: { id: true, name: true, role: true, avatar: true }
          })
        : null;

      return {
        id: conv.id,
        participants: conv.participants,
        otherParticipant,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount[userId] || 0
      };
    })
  );

  return json({
    user,
    conversations: processedConversations
  });
}

export default function CustomerMessages() {
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
            Chat with service providers and support team
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start New Conversation</h3>
            <p className="text-gray-600 text-sm mb-4">
              Contact service providers or support team for assistance.
            </p>
            <button className="text-[#01502E] hover:text-[#013d23] font-medium">
              Browse Services →
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Support</h3>
            <p className="text-gray-600 text-sm mb-4">
              Get help with your bookings, modifications, or cancellations.
            </p>
            <button className="text-[#01502E] hover:text-[#013d23] font-medium">
              View Bookings →
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">General Support</h3>
            <p className="text-gray-600 text-sm mb-4">
              Have questions about our platform or need technical support?
            </p>
            <button className="text-[#01502E] hover:text-[#013d23] font-medium">
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}