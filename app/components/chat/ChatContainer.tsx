import React, { useEffect, useMemo, useState } from "react";
import { ConversationList } from "./ConversationList";
import { ChatInterface } from "./ChatInterface";
import { ThemeProvider } from "~/contexts/ThemeContext";
import type { Conversation, Message } from "./types";

type ChatContainerProps = {
  className?: string;
  currentUserId?: string;
  theme?: 'light' | 'dark' | 'auto';
  initialPeerId?: string;
};

export default function ChatContainer({ className, currentUserId: currentUserIdProp, theme = 'light', initialPeerId }: ChatContainerProps) {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  async function loadConversations() {
    setLoading(true);
    try {
        const res = await fetch(`/api/chat/conversations?limit=50`);
      const json = await res.json();
      
      if (!json.success) {
        console.warn("Chat conversations API failed:", json.error);
        // Show empty state instead of crashing
        setConversations([]);
        return;
      }
      
      const items = (json?.data?.conversations || []) as any[];
      setCurrentUserId(currentUserIdProp || json?.data?.currentUserId || json?.data?.userId);
      const mapped: Conversation[] = items.map((c: any) => ({
        id: c.id,
        participants: c.participants?.map((p: any) => ({ id: p.id, name: p.name, avatar: p.avatar, role: p.role })) || [],
        lastMessage: c.lastMessage
          ? {
              id: c.lastMessage.id,
              conversationId: c.id,
              senderId: c.lastMessage.senderId,
              senderName: c.lastMessage.senderName,
              content: c.lastMessage.content,
              type: "text",
              attachments: [],
              createdAt: c.lastMessage.createdAt,
            }
          : undefined,
        unreadCount: c.unreadCount || 0,
        updatedAt: c.lastMessageAt,
      }));
      setConversations(mapped);
      if (mapped.length && !selectedId) {
        setSelectedId(mapped[0].id);
        setOpen(true);
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
      // Show empty state instead of crashing
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-open conversation if initialPeerId is provided
  useEffect(() => {
    if (initialPeerId && conversations.length > 0) {
      // Find conversation with this peer
      const conversation = conversations.find(conv => 
        conv.participants.some(p => p.id === initialPeerId)
      );
      if (conversation) {
        setSelectedId(conversation.id);
        setOpen(true);
      }
    }
  }, [initialPeerId, conversations]);

  const selectedConversation = useMemo(() => conversations.find((c) => c.id === selectedId) || null, [conversations, selectedId]);

  return (
    <ThemeProvider initialTheme={theme}>
      <div className={`${className} h-full flex flex-col`}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          <div className="md:col-span-1 border rounded-md overflow-hidden flex flex-col">
            <ConversationList
              conversations={conversations}
              loading={loading}
              onSelect={(id) => {
                setSelectedId(id);
                setOpen(true);
              }}
              onSearch={() => {}}
              className="flex-1"
            />
          </div>
          <div className="md:col-span-2 flex flex-col min-h-0">
            <ChatInterface
              isOpen={open}
              onClose={() => setOpen(false)}
              conversationId={selectedId ?? undefined}
              currentUserId={currentUserId}
              variant="inline"
              className="flex-1"
              onSendMessage={async ({ conversationId, text }) => {
                const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: text }),
                });
                const json = await res.json();
                const msg = json?.data as Message;
                // update list preview
                setConversations((prev) =>
                  prev.map((c) => (c.id === conversationId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt } : c))
                );
                return msg;
              }}
              onLoadMore={async ({ conversationId, before }) => {
                const res = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=50&before=${before}`);
                const json = await res.json();
                return (json?.data?.messages || []) as Message[];
              }}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
