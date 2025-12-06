import React, { useEffect, useMemo, useState, useRef } from "react";
import { ConversationList } from "./ConversationList";
import { ChatInterface } from "./ChatInterface";
import { ThemeProvider } from "~/contexts/ThemeContext";
import { useNotificationsStream } from "~/hooks/useNotificationsStream";
import type { Conversation, Message } from "./types";

type ChatContainerProps = {
  className?: string;
  currentUserId?: string;
  theme?: 'light' | 'dark' | 'auto';
  initialPeerId?: string;
  initialConversations?: Conversation[]; // Accept conversations from loader
};

export default function ChatContainer({ className, currentUserId: currentUserIdProp, theme = 'light', initialPeerId, initialConversations }: ChatContainerProps) {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(currentUserIdProp);

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
        participants: c.participants?.map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          avatar: p.avatar, 
          role: p.role,
          online: p.isOnline || p.online || false // Use isOnline from API or fallback to online
        })) || [],
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
      } else if (mapped.length === 0) {
        // Show chat interface even when no conversations (for login prompt)
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

  // Initialize with loader data if provided, otherwise fetch
  // This will update when loader data changes (after revalidation)
  useEffect(() => {
    if (initialConversations && initialConversations.length > 0) {
      // Use initial conversations from loader
      const mapped: Conversation[] = initialConversations.map((c: any) => ({
        id: c.id,
        participants: Array.isArray(c.participants) ? c.participants.map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          avatar: p.avatar, 
          role: p.role,
          online: p.online || false
        })) : [],
        lastMessage: c.lastMessage ? {
          id: c.lastMessage.id,
          conversationId: c.id,
          senderId: c.lastMessage.senderId,
          senderName: c.lastMessage.senderName,
          content: c.lastMessage.content,
          type: "text",
          attachments: [],
          createdAt: c.lastMessage.createdAt,
        } : undefined,
        unreadCount: c.unreadCount || 0,
        updatedAt: c.updatedAt,
      }));
      setConversations(mapped);
      if (mapped.length && !selectedId) {
        setSelectedId(mapped[0].id);
        setOpen(true);
      }
    } else if (initialConversations === undefined) {
      // No initial data provided, fetch from API
      loadConversations();
    }
    // Update when initialConversations changes (e.g., after revalidation)
  }, [initialConversations]);

  // Listen for real-time messages to update conversation list
  useNotificationsStream(
    () => {}, // onNotification - not used here
    (msg) => {
      try {
        if (msg?.type === "chat_message" && msg?.conversationId && msg?.message) {
          const message = msg.message;
          // Update conversation list with new message
          setConversations((prev) => {
            const existing = prev.find(c => c.id === msg.conversationId);
            if (existing) {
              // Update existing conversation
              const updated = prev.map(c => 
                c.id === msg.conversationId
                  ? {
                      ...c,
                      lastMessage: {
                        id: message.id,
                        conversationId: msg.conversationId,
                        senderId: message.senderId,
                        senderName: message.senderName || 'Unknown',
                        content: message.content,
                        type: message.type || 'text',
                        attachments: message.attachments || [],
                        createdAt: message.createdAt,
                      },
                      updatedAt: message.createdAt,
                      unreadCount: message.senderId !== currentUserId 
                        ? (c.unreadCount || 0) + 1 
                        : c.unreadCount,
                    }
                  : c
              );
              // Re-sort by updatedAt
              return updated.sort((a, b) => {
                const dateA = new Date(a.updatedAt || 0).getTime();
                const dateB = new Date(b.updatedAt || 0).getTime();
                return dateB - dateA;
              });
            } else {
              // New conversation - reload list to get full details
              loadConversations();
              return prev;
            }
          });
        }
      } catch (error) {
        console.error('Error handling real-time message:', error);
      }
    }
  );

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
      <div className={`${className} h-full flex flex-col overflow-hidden w-full max-w-full box-border`}>
        <div className="flex-1 flex flex-col lg:flex-row gap-1.5 sm:gap-2 min-h-0 overflow-hidden w-full max-w-full min-w-0 box-border">
          <div className="lg:w-[260px] xl:w-[300px] border rounded-md overflow-hidden flex flex-col min-h-0 max-h-full w-full min-w-0 flex-shrink-0 box-border">
            <ConversationList
              conversations={conversations}
              loading={loading}
              onSelect={(id) => {
                console.log('Conversation selected:', id);
                setSelectedId(id);
                setOpen(true);
              }}
              onSearch={() => {}}
              className="flex-1 min-h-0"
              currentUserId={currentUserId}
            />
          </div>
          <div className="lg:flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-full min-w-0">
            <ChatInterface
              isOpen={open}
              onClose={() => setOpen(false)}
              conversationId={selectedId ?? undefined}
              currentUserId={currentUserId}
              variant="inline"
              className="flex-1"
              onSendMessage={async ({ text, files }) => {
                const cid = selectedId;
                if (!cid) return;
                try {
                  const payload: any = { content: text };
                  if (files?.length) {
                    payload.attachments = files.map(f => ({ url: `/uploads/${(f as any).name}`, name: (f as any).name, type: (f as any).type || 'file', size: (f as any).size || 0 }));
                  }
                  const res = await fetch(`/api/chat/conversations/${cid}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('Failed to send message:', errorData);
                    throw new Error(errorData.error || 'Failed to send message');
                  }
                  
                  const json = await res.json();
                  const m = json?.data as any;
                  if (!m) {
                    console.error('No message data in response:', json);
                    return undefined;
                  }
                  
                  // Normalize message for UI
                  const msg: Message = {
                    id: m.id,
                    conversationId: cid,
                    senderId: m.senderId,
                    senderName: m.senderName || m.sender?.name || 'Unknown',
                    senderAvatar: m.senderAvatar || m.sender?.avatar || null,
                    content: m.content,
                    type: (m.type || 'text').toString().toLowerCase(),
                    attachments: Array.isArray(m.attachments) ? m.attachments : [],
                    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt || new Date().toISOString()),
                    status: 'sent',
                  };
                  
                  // Update conversation list with new last message and re-sort
                  setConversations((prev) => {
                    const updated = prev.map((c) => 
                      c.id === msg.conversationId 
                        ? { 
                            ...c, 
                            lastMessage: msg, 
                            updatedAt: msg.createdAt 
                          } 
                        : c
                    );
                    // Re-sort by updatedAt to move updated conversation to top
                    return updated.sort((a, b) => {
                      const dateA = new Date(a.updatedAt || 0).getTime();
                      const dateB = new Date(b.updatedAt || 0).getTime();
                      return dateB - dateA;
                    });
                  });
                  
                  // Trigger page revalidation to refresh conversation list from server
                  if (typeof window !== 'undefined' && (window as any).__remixRevalidator) {
                    (window as any).__remixRevalidator.revalidate();
                  }
                  
                  // Also reload conversations from API as fallback
                  setTimeout(() => {
                    loadConversations();
                  }, 500);
                  
                  return msg;
                } catch (error) {
                  console.error('Error sending message:', error);
                  throw error;
                }
              }}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
