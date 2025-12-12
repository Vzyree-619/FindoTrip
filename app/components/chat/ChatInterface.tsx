import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, MessageCircle } from "lucide-react";
import type { Conversation, Message, FetchConversationResult } from "./types";
import { clsx } from "./utils";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import AttachmentPreview from "./AttachmentPreview";
import { useTheme } from "~/contexts/ThemeContext";
import { useNotificationsStream } from "~/hooks/useNotificationsStream";

export type ChatInterfaceProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserAvatar?: string;
  initialMessage?: string;
  currentUserId?: string;
  fetchConversation?: (args: { conversationId?: string; targetUserId?: string }) => Promise<FetchConversationResult>;
  onSendMessage?: (args: { conversationId?: string; targetUserId?: string; text: string; files?: File[] }) => Promise<Message | void>;
  onLoadMore?: (args: { conversationId: string; before?: string }) => Promise<Message[]>;
  className?: string;
  variant?: 'modal' | 'inline';
};

export function ChatInterface({
  isOpen,
  onClose,
  conversationId,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  initialMessage,
  currentUserId,
  fetchConversation,
  onSendMessage,
  onLoadMore,
  className,
  variant = 'modal',
}: ChatInterfaceProps) {
  // If no currentUserId, show login prompt
  if (!currentUserId) {
    return (
      <div className={clsx(
        "fixed inset-0 z-50 bg-black/50 flex items-center justify-center",
        !isOpen && "hidden"
      )}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Login Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to be logged in to start a conversation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <a
                href="/login"
                className="flex-1 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] text-center"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const stopTypingTimerRef = useRef<number | null>(null);

  // Wire up SSE for real-time chat updates (messages + typing)
  useNotificationsStream(
    () => {},
    (msg) => {
      try {
        const cid = conversation?.id || conversationId;
        if (!cid || !msg) return;
        if (msg.type === "chat_message" && msg.conversationId === cid && msg.message) {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === msg.message.id);
            return exists ? prev : [...prev, msg.message];
          });
          scrollToBottomSmooth();
        }
        if (msg.type === "typing" && msg.conversationId === cid) {
          setIsTyping(Boolean(msg.typing) && msg.senderId !== currentUserId);
        }
      } catch {}
    }
  );

  const load = async () => {
    console.log('🔵 ChatInterface load called with:', { conversationId, targetUserId });
    // Default fetch via API if not provided
    const defaultFetch = async ({ conversationId, targetUserId }: { conversationId?: string; targetUserId?: string }): Promise<FetchConversationResult> => {
      if (conversationId) {
        console.log('🔵 Fetching conversation with ID:', conversationId);
        // Use the chat conversation API with conversationId
        const res = await fetch(`/api/chat/conversations/${conversationId}`);
        if (!res.ok) {
          console.error('🔴 Failed to fetch conversation:', res.status, res.statusText);
          throw new Error('Failed to fetch conversation');
        }
        const json = await res.json();
        console.log('🟢 Conversation API response:', {
          conversationId: json.data?.id,
          participants: json.data?.participants,
          messageCount: json.data?.messages?.length
        });
        return { 
          conversation: json.data ? {
            id: json.data.id,
            participants: json.data.participants || [],
            updatedAt: json.data.lastMessageAt,
            lastMessage: json.data.messages?.[json.data.messages.length - 1],
            unreadCount: 0
          } : undefined, 
          messages: json.data?.messages || [] 
        } as FetchConversationResult;
      } else if (targetUserId) {
        console.log('🔵 Fetching conversation with targetUserId:', targetUserId);
        // Use the chat conversation API with targetUserId - create or get conversation
        const res = await fetch(`/api/chat/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUserId,
            type: 'CUSTOMER_PROVIDER'
          })
        });
        if (!res.ok) {
          console.error('🔴 Failed to create/get conversation:', res.status, res.statusText);
          throw new Error('Failed to create/get conversation');
        }
        const json = await res.json();
        console.log('🟢 Conversation created/retrieved:', {
          conversationId: json.data?.id,
          participants: json.data?.participants
        });
        // Now fetch the conversation details with messages
        const convId = json.data?.id;
        if (!convId) throw new Error('No conversation ID returned');
        const convRes = await fetch(`/api/chat/conversations/${convId}`);
        const convJson = await convRes.json();
        console.log('🟢 Conversation details response:', {
          conversationId: convJson.data?.id,
          participants: convJson.data?.participants,
          messageCount: convJson.data?.messages?.length
        });
        return {
          conversation: convJson.data ? {
            id: convJson.data.id,
            participants: convJson.data.participants || [],
            updatedAt: convJson.data.lastMessageAt,
            lastMessage: convJson.data.messages?.[convJson.data.messages.length - 1],
            unreadCount: 0
          } : undefined,
          messages: convJson.data?.messages || []
        } as FetchConversationResult;
      }
      
      throw new Error('No conversationId or targetUserId provided');
    };
    setLoading(true);
    try {
      const res = await (fetchConversation || defaultFetch)({ conversationId, targetUserId });
      console.log('🟢 Load result:', {
        hasConversation: !!res.conversation,
        conversationId: res.conversation?.id,
        participantCount: res.conversation?.participants?.length,
        messageCount: res.messages?.length
      });
      
      if (!res.conversation) {
        console.error('🔴 No conversation returned from fetch!');
        setLoading(false);
        return;
      }
      
      setConversation(res.conversation);
      // Merge loaded messages with any optimistic temps to avoid losing them during in-flight load
      setMessages((prev) => {
        const loaded = res.messages || [];
        const temps = prev.filter((m) => typeof m.id === 'string' && m.id.startsWith('temp-'));
        console.log('🟡 Merging messages:', {
          loadedCount: loaded.length,
          tempCount: temps.length,
          loadedIds: loaded.map(m => m.id).slice(0, 3),
          loadedConversationIds: [...new Set(loaded.map(m => m.conversationId))]
        });
        if (!temps.length) return loaded;
        const merged = [...loaded];
        for (const t of temps) {
          if (!merged.find((m) => m.id === t.id)) merged.push(t);
        }
        return merged;
      });
      // Removed auto-send of initialMessage - user should type their own message
      setTimeout(scrollToBottom, 0);
    } catch (error) {
      console.error('🔴 Error loading conversation:', error);
      // Still set loading to false on error
    } finally {
      console.log('🟡 Finished loading, setting loading=false');
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      
      if (res.ok) {
        const response = await res.json();
        if (response.success && response.data) {
          const updatedMessage = response.data;
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { 
                  ...m, 
                  content: updatedMessage.content || newContent, 
                  isEdited: true, 
                  editedAt: updatedMessage.editedAt || new Date() 
                }
              : m
          ));
        } else {
          console.error('Edit failed:', response.error);
          throw new Error(response.error || 'Failed to edit message');
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Edit failed:', res.status, errorData);
        throw new Error(errorData.error || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error; // Re-throw so UI can handle it
    }
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone = false) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteForEveryone })
      });
      
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { 
                  ...m, 
                  isDeleted: true, 
                  deletedAt: new Date(), 
                  deletedBy: currentUserId,
                  content: deleteForEveryone ? "This message was deleted" : "You deleted this message"
                }
              : m
          ));
        } else {
          console.error('Delete failed:', response.error);
          throw new Error(response.error || 'Failed to delete message');
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete failed:', res.status, errorData);
        throw new Error(errorData.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error; // Re-throw so UI can handle it
    }
  };

  const notifyTyping = async (typing: boolean) => {
    const cid = conversation?.id || conversationId;
    if (!cid) return;
    const now = Date.now();
    // Throttle to ~2s when typing starts
    if (typing && now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: cid, isTyping: typing }),
      });
    } catch {}
    // Auto-stop after 5s of inactivity
    if (typing) {
      if (stopTypingTimerRef.current) window.clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = window.setTimeout(() => {
        notifyTyping(false);
      }, 5000) as unknown as number;
    }
  };

  useEffect(() => {
    if (isOpen || variant === 'inline') {
      load();
      // mark messages as read on open
      const cid = conversation?.id || conversationId;
      if (cid) {
        try {
          fetch("/api/chat.read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: cid }),
          });
        } catch {}
      }
      // send typing events every ~2s using outer notifier
      const interval = setInterval(() => notifyTyping(isTyping), 2000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, variant, conversationId, targetUserId]);

  // Listen for conversation reload events
  useEffect(() => {
    const handleReload = (event: CustomEvent) => {
      const { conversationId: reloadId } = event.detail;
      if (reloadId && (reloadId === conversationId || reloadId === conversation?.id)) {
        load();
      }
    };
    
    window.addEventListener('chat:reload-conversation', handleReload as EventListener);
    return () => {
      window.removeEventListener('chat:reload-conversation', handleReload as EventListener);
    };
  }, [conversationId, conversation?.id]);


  const onSend = async (text: string, files?: File[]) => {
    const defaultSend = async ({ text, files, targetUserId: tuid }: { targetUserId?: string; text: string; files?: File[] }) => {
      let cid = conversation?.id || conversationId;
      // If no conversation yet, create or fetch it using targetUserId
      if (!cid && tuid) {
        try {
          const resp = await fetch(`/api/chat/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: tuid, type: 'CUSTOMER_PROVIDER' })
          });
          if (resp.ok) {
            const data = await resp.json();
            cid = data?.data?.id;
            if (cid) {
              setConversation({
                id: cid,
                participants: data.data?.participants || [],
                updatedAt: data.data?.lastMessageAt,
                lastMessage: undefined,
                unreadCount: 0
              });
              setMessages([]);
            }
          }
        } catch (err) {
          console.error('Failed to create conversation:', err);
        }
      }
      if (!cid) return undefined;
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
      
      // Normalize to UI shape
      const normalized: Message = {
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
      return normalized;
    };
    const temp: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversation?.id || conversationId || "temp",
      senderId: currentUserId || "me",
      content: text,
      type: "text",
      attachments: [],
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    // Store message text and files before clearing
    const messageText = text;
    const messageFiles = files;
    
    setMessages((prev) => [...prev, temp]);
    scrollToBottomSmooth();
    
    // Clear input and attachments AFTER adding temp message
    setValue("");
    setAttachments([]);
    
    try {
      const result = await (onSendMessage || defaultSend)({ targetUserId, text: messageText, files: messageFiles });
      if (result) {
        // Replace temp with real message, and remove any duplicates
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== temp.id && m.id !== result.id);
          return [...filtered, result];
        });
        
        // If we got a new conversation ID, update the conversation state
        if (result.conversationId && result.conversationId !== conversation?.id) {
          // Reload the conversation to get full participant data
          setTimeout(() => load(), 100);
        }
      } else {
        setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "sent" } : m)));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "failed" } : m)));
      // Restore message text on error so user can retry
      setValue(messageText);
    }
  };

  const onScrollTop = async () => {
    const el = listRef.current;
    if (!el || el.scrollTop > 50 || !onLoadMore || !conversation?.id) return;
    const oldest = messages[0];
    const defaultLoadMore = async ({ conversationId, before }: { conversationId: string; before?: string }) => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=50&before=${before || ''}`);
      const json = await res.json();
      return (json?.data?.messages || []) as Message[];
    };
    const older = await (onLoadMore || defaultLoadMore)({ conversationId: conversation.id, before: oldest?.id });
    if (older?.length) {
      setMessages((prev) => [...older, ...prev]);
      el.scrollTop = 10; // keep near top
    }
  };

  function scrollToBottom() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
  function scrollToBottomSmooth() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  if (variant === 'modal' && !isOpen) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (variant === 'modal' && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [variant, isOpen]);

  return (
    <div
      className={clsx(
        variant === 'modal'
          ? "fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30 p-4 overflow-y-auto"
          : "w-full h-full min-h-0 overflow-hidden max-w-full box-border",
        className
      )}
      role="dialog"
      aria-modal={variant === 'modal' ? "true" : undefined}
      onClick={variant === 'modal' ? (e) => {
        if (e.target === e.currentTarget) onClose();
      } : undefined}
    >
      <div
        className={clsx(
          variant === 'modal'
            ? "w-full sm:w-[720px] max-w-full h-[90vh] sm:h-[85vh] max-h-[90vh] bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-lg flex flex-col overflow-hidden animate-[slideIn_160ms_ease-out] my-auto"
            : "h-full min-h-0 w-full max-w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm flex flex-col overflow-hidden box-border"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#01502E] to-[#013d23] text-white flex-shrink-0 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {(() => {
              // Find the other participant (not the current user)
              const otherParticipant = conversation?.participants?.find(p => p.id !== currentUserId) || conversation?.participants?.[0];
              const displayName = targetUserName || otherParticipant?.name || "Chat";
              const displayAvatar = targetUserAvatar || otherParticipant?.avatar;
              const displayRole = otherParticipant?.role;
              const isOnline = otherParticipant?.online || otherParticipant?.isOnline;
              
              return (
                <>
                  <img 
                    src={displayAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=01502E&color=fff`} 
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover flex-shrink-0" 
                    alt="avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=01502E&color=fff`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">{displayName}</div>
                    {displayRole && ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'].includes(displayRole) && (
                      <div className="text-xs text-white/90 font-medium truncate">
                        {displayRole === 'PROPERTY_OWNER' ? 'Property Owner' : 
                         displayRole === 'VEHICLE_OWNER' ? 'Vehicle Owner' : 
                         displayRole === 'TOUR_GUIDE' ? 'Tour Guide' : ''}
                      </div>
                    )}
                    {isTyping ? (
                      <div className="text-xs text-white/80 truncate">typing…</div>
                    ) : isOnline ? (
                      <div className="text-xs text-white/80 truncate flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Active
                      </div>
                    ) : null}
                  </div>
                </>
              );
            })()}
          </div>
          {variant === 'modal' && (
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={onClose} aria-label="Close chat">
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={listRef} onScroll={onScrollTop} className={`flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-2 min-h-0 w-full max-w-full box-border ${
          resolvedTheme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
        }`}>
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chat…
            </div>
          ) : !conversationId && !targetUserId ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No conversation selected</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select a conversation from the list to start chatting</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">Say hello 👋</div>
          ) : (
            messages.map((m, idx) => (
              <MessageBubble
                key={m.id}
                message={m}
                isSender={m.senderId === currentUserId}
                showAvatar={m.senderId !== currentUserId && messages[idx - 1]?.senderId !== m.senderId}
                showTimestamp={idx === messages.length - 1 || messages[idx + 1]?.senderId !== m.senderId}
                avatarUrl={conversation?.participants?.find((p) => p.id === m.senderId)?.avatar || m.senderAvatar}
                senderName={conversation?.participants?.find((p) => p.id === m.senderId)?.name || m.senderName}
                currentUserId={currentUserId}
                isAdmin={conversation?.participants?.find((p) => p.id === currentUserId)?.role === 'SUPER_ADMIN'}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
              />
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t flex-shrink-0 w-full max-w-full overflow-x-hidden box-border">
          <ChatInput
            value={value}
            onChange={setValue}
            onSend={onSend}
            onAttach={(f) => setAttachments(f)}
            onTyping={(t) => setIsTyping(t)}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;

