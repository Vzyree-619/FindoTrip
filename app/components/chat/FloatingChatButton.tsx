import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatInterface } from "./ChatInterface";

interface FloatingChatButtonProps {
  currentUserId: string;
  className?: string;
}

export function FloatingChatButton({ currentUserId, className }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Simple unread count - in a real app, this would come from a proper notification system
  useEffect(() => {
    // For now, we'll set a simple unread count
    // In a real implementation, this would be fetched from the server
    setUnreadCount(0);
  }, []);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#01502E] text-white rounded-full shadow-lg hover:bg-[#013d23] transition-all duration-200 flex items-center justify-center z-50 ${className}`}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Interface Modal */}
      <ChatInterface
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentUserId={currentUserId}
        variant="modal"
        fetchConversation={async ({ conversationId, targetUserId }) => {
          const url = new URL("/api/chat.conversation", window.location.origin);
          if (conversationId) url.searchParams.set("conversationId", conversationId);
          if (targetUserId) url.searchParams.set("targetUserId", targetUserId);
          
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error("Failed to fetch conversation");
          return response.json();
        }}
        onSendMessage={async ({ conversationId, targetUserId, text, files }) => {
          const form = new FormData();
          if (conversationId) form.append("conversationId", conversationId);
          if (targetUserId) form.append("targetUserId", targetUserId);
          form.append("text", text);
          files?.forEach(f => form.append("files", f));
          const response = await fetch("/api/chat.send", { method: "POST", body: form });
          if (!response.ok) throw new Error("Failed to send message");
          const json = await response.json();
          return json.data;
        }}
        onLoadMore={async ({ conversationId, before }) => {
          const url = new URL(`/api/chat/conversations/${conversationId}/messages`, window.location.origin);
          if (before) url.searchParams.set("before", before);
          
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error("Failed to load messages");
          const data = await response.json();
          return data.data?.messages || [];
        }}
      />
    </>
  );
}

export default FloatingChatButton;
