import React, { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
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
    // Default fetch via API if not provided
    const defaultFetch = async ({ conversationId, targetUserId }: { conversationId?: string; targetUserId?: string }): Promise<FetchConversationResult> => {
      let cid = conversationId;
      if (!cid && targetUserId) {
        const res = await fetch('/api/chat/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId, type: 'CUSTOMER_PROVIDER' }) });
        const json = await res.json();
        cid = json?.data?.id;
      }
      const convRes = await fetch(`/api/chat/conversations/${cid}`);
      const convJson = await convRes.json();
      const conversation = convJson?.data;
      const msgsRes = await fetch(`/api/chat/conversations/${cid}/messages?limit=50`);
      const msgsJson = await msgsRes.json();
      const messages = msgsJson?.data?.messages || [];
      return { conversation, messages } as FetchConversationResult;
    };
    setLoading(true);
    try {
      const res = await (fetchConversation || defaultFetch)({ conversationId, targetUserId });
      setConversation(res.conversation);
      setMessages(res.messages || []);
      if (initialMessage && res.conversation?.id) {
        try {
          const sendFn =
            onSendMessage ||
            (async ({ conversationId, text }: { conversationId?: string; text: string; files?: File[] }) => {
              const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text }),
              });
              const json = await res.json();
              return json?.data as Message;
            });
          const sent = await sendFn({ conversationId: res.conversation.id, text: initialMessage, files: [] });
          if (sent) setMessages((prev) => [...prev, sent]);
        } catch {}
      }
      setTimeout(scrollToBottom, 0);
    } finally {
      setLoading(false);
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

  const onSend = async (text: string, files?: File[]) => {
    const defaultSend = async ({ conversationId, text, files }: { conversationId?: string; text: string; files?: File[] }) => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
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
    const result = await (onSendMessage || defaultSend)({ conversationId: conversation?.id, targetUserId, text, files });
    if (result) {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? result : m)));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "sent" } : m)));
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
            ? "w-full sm:w-[720px] h-[80vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-lg flex flex-col overflow-hidden animate-[slideIn_160ms_ease-out]"
            : "h-full bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#01502E] to-[#013d23] text-white">
          <div className="flex items-center gap-3">
            <img src={conversation?.participants?.[0]?.avatar || "/avatar.png"} className="w-8 h-8 rounded-full border-2 border-white/20" alt="avatar" />
            <div>
              <div className="font-semibold text-white">{conversation?.participants?.[0]?.name || "Chat"}</div>
              <div className="text-xs text-white/70">{isTyping ? "typing…" : conversation?.participants?.[0]?.online ? "online" : "offline"}</div>
            </div>
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
            <div className="h-full flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chat…
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">Say hello 👋</div>
          ) : (
            messages.map((m, idx) => (
              <MessageBubble
                key={m.id}
                message={m}
                isSender={m.senderId === currentUserId}
                showAvatar={m.senderId !== currentUserId && messages[idx - 1]?.senderId !== m.senderId}
                showTimestamp={idx === messages.length - 1 || messages[idx + 1]?.senderId !== m.senderId}
                avatarUrl={conversation?.participants?.find((p) => p.id === m.senderId)?.avatar}
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
