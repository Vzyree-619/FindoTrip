import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, MessageCircle } from "lucide-react";
import type { Conversation, Message, FetchConversationResult } from "./types";
import { clsx } from "./utils";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import AttachmentPreview from "./AttachmentPreview";
import { useTheme } from "~/contexts/ThemeContext";

export type ChatInterfaceProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
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

  // Real-time chat events would be handled here in a production app
  // For now, we'll use a simple implementation without SSE

  const load = async () => {
    console.log('ChatInterface load called with:', { conversationId, targetUserId });
    // Default fetch via API if not provided
    const defaultFetch = async ({ conversationId, targetUserId }: { conversationId?: string; targetUserId?: string }): Promise<FetchConversationResult> => {
      if (conversationId) {
        console.log('Fetching conversation with ID:', conversationId);
        // Use the chat conversation API with conversationId
        const res = await fetch(`/api/chat.conversation?conversationId=${conversationId}`);
        const json = await res.json();
        console.log('Conversation API response:', json);
        return { 
          conversation: json.conversation, 
          messages: json.messages || [] 
        } as FetchConversationResult;
      } else if (targetUserId) {
        console.log('Fetching conversation with targetUserId:', targetUserId);
        // Use the chat conversation API with targetUserId
        const res = await fetch(`/api/chat.conversation?targetUserId=${targetUserId}`);
        const json = await res.json();
        console.log('Conversation API response:', json);
        return { 
          conversation: json.conversation, 
          messages: json.messages || [] 
        } as FetchConversationResult;
      }
      return { conversation: null, messages: [] };
    };
    setLoading(true);
    try {
      const res = await (fetchConversation || defaultFetch)({ conversationId, targetUserId });
      console.log('Load result:', res);
      setConversation(res.conversation);
      setMessages(res.messages || []);
      if (initialMessage && res.conversation?.id) {
        try {
          const sendFn =
            onSendMessage ||
            (async ({ targetUserId, text }: { targetUserId?: string; text: string; files?: File[] }) => {
              const formData = new FormData();
              formData.append('text', text);
              if (targetUserId) formData.append('targetUserId', targetUserId);
              
              const res = await fetch('/chat-send', {
                method: 'POST',
                body: formData,
              });
              const json = await res.json();
              return json?.data as Message;
            });
          const sent = await sendFn({ targetUserId, text: initialMessage, files: [] });
          if (sent) setMessages((prev) => [...prev, sent]);
        } catch {}
      }
      setTimeout(scrollToBottom, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const res = await fetch(`/chat-messages-${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      
      if (res.ok) {
        const updatedMessage = await res.json();
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, content: newContent, isEdited: true, editedAt: new Date() }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone = false) => {
    try {
      const res = await fetch(`/chat-messages-${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteForEveryone })
      });
      
      if (res.ok) {
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
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
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
      await fetch("/api/chat.typing", {
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

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId && (isOpen || variant === 'inline')) {
      load();
    }
  }, [conversationId]);

  const onSend = async (text: string, files?: File[]) => {
    const defaultSend = async ({ targetUserId, text, files }: { targetUserId?: string; text: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append('text', text);
      if (targetUserId) formData.append('targetUserId', targetUserId);
      if (files) files.forEach(f => formData.append('files', f));
      
      const res = await fetch('/api/chat.send', { 
        method: 'POST', 
        body: formData 
      });
      const json = await res.json();
      return json?.data as Message;
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
    setMessages((prev) => [...prev, temp]);
    scrollToBottomSmooth();
    try {
      const result = await (onSendMessage || defaultSend)({ targetUserId, text, files });
      if (result) {
        setMessages((prev) => prev.map((m) => (m.id === temp.id ? result : m)));
      } else {
        setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "sent" } : m)));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "failed" } : m)));
    }
    setValue("");
    setAttachments([]);
  };

  const onScrollTop = async () => {
    const el = listRef.current;
    if (!el || el.scrollTop > 50 || !onLoadMore || !conversation?.id) return;
    const oldest = messages[0];
    const defaultLoadMore = async ({ conversationId, before }: { conversationId: string; before?: string }) => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=50&before=${before}`);
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

  return (
    <div
      className={clsx(
        variant === 'modal'
          ? "fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30"
          : "w-full h-full",
        className
      )}
      role="dialog"
      aria-modal={variant === 'modal' ? "true" : undefined}
    >
      <div
        className={clsx(
          variant === 'modal'
            ? "w-full sm:w-[720px] h-[80vh] sm:h-[600px] bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-lg flex flex-col overflow-hidden animate-[slideIn_160ms_ease-out]"
            : "h-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm flex flex-col overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#01502E] to-[#013d23] text-white">
          <div className="flex items-center gap-3">
            {(() => {
              // Find the other participant (not the current user)
              const otherParticipant = conversation?.participants?.find(p => p.id !== currentUserId) || conversation?.participants?.[0];
              return (
                <>
                  <img src={otherParticipant?.avatar || "/avatar.png"} className="w-8 h-8 rounded-full border-2 border-white/20" alt="avatar" />
                  <div>
                    <div className="font-semibold text-white">{otherParticipant?.name || "Chat"}</div>
                    {otherParticipant?.role && ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'].includes(otherParticipant.role) && (
                      <div className="text-xs text-white/90 font-medium">
                        {otherParticipant.role === 'PROPERTY_OWNER' ? 'Property Owner' : 
                         otherParticipant.role === 'VEHICLE_OWNER' ? 'Vehicle Owner' : 
                         otherParticipant.role === 'TOUR_GUIDE' ? 'Tour Guide' : ''}
                      </div>
                    )}
                    <div className="text-xs text-white/70">{isTyping ? "typing…" : otherParticipant?.online ? "online" : "offline"}</div>
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
        <div ref={listRef} onScroll={onScrollTop} className={`flex-1 overflow-y-auto p-3 space-y-2 min-h-0 ${
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
        <div className="border-t">
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
