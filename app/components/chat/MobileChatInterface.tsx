import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Mic, MoreVertical, Phone, Video } from "lucide-react";
import type { Conversation, Message, FetchConversationResult } from "./types";
import { clsx } from "./utils";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useNotificationsStream } from "~/hooks/useNotificationsStream";
import { useBrowserNotifications } from "~/hooks/useBrowserNotifications";

export type MobileChatInterfaceProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
  currentUserId?: string;
  fetchConversation?: (args: { conversationId?: string; targetUserId?: string }) => Promise<FetchConversationResult>;
  onSendMessage?: (args: { conversationId?: string; targetUserId?: string; text: string; files?: File[] }) => Promise<Message | void>;
  onLoadMore?: (args: { conversationId: string; before?: string }) => Promise<Message[]>;
  className?: string;
};

export function MobileChatInterface({
  isOpen,
  onClose,
  conversationId,
  targetUserId,
  currentUserId,
  fetchConversation,
  onSendMessage,
  onLoadMore,
  className,
}: MobileChatInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { showNotification } = useBrowserNotifications();

  // SSE for real-time updates
  useNotificationsStream(
    (notif) => {
      // Handle notifications
    },
    (msg) => {
      if (msg?.type === "chat_message" && msg.conversationId === conversation?.id && msg.message) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.message.id);
          if (exists) return prev;
          return [...prev, msg.message];
        });
        scrollToBottomSmooth();
        
        // Show notification if not focused
        if (document.visibilityState !== "visible" && msg.message.senderId !== currentUserId) {
          showNotification(`New message from ${conversation?.participants?.[0]?.name}`, {
            body: msg.message.content.slice(0, 100),
            tag: `chat-${conversation?.id}`,
          });
        }
      }
      if (msg?.type === "typing" && msg.conversationId === conversation?.id) {
        setIsTyping(Boolean(msg.typing) && msg.senderId !== currentUserId);
      }
    }
  );

  const load = async () => {
    if (!fetchConversation) return;
    setLoading(true);
    try {
      const res = await fetchConversation({ conversationId, targetUserId });
      setConversation(res.conversation);
      setMessages(res.messages || []);
      setTimeout(scrollToBottom, 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      load();
      // Mark messages as read
      const cid = conversation?.id || conversationId;
      if (cid) {
        fetch("/api/chat.read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: cid }),
        }).catch(() => {});
      }
    }
  }, [isOpen, conversationId, targetUserId]);

  const onSend = async (text: string, files?: File[]) => {
    if (!onSendMessage) return;
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
    
    // Haptic feedback on send
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
    
    const result = await onSendMessage({ conversationId: conversation?.id, targetUserId, text, files });
    if (result) {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? result : m)));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "sent" } : m)));
    }
    setValue("");
  };

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const scrollToBottomSmooth = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const handleVoiceRecord = () => {
    // TODO: Implement voice recording
    setIsRecording(!isRecording);
    if ("vibrate" in navigator) {
      navigator.vibrate(100);
    }
  };

  const handleCameraCapture = () => {
    // TODO: Implement camera capture
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  if (!isOpen) return null;

  // Find the other participant (not the current user)
  const participant = conversation?.participants?.find(p => p.id !== currentUserId) || conversation?.participants?.[0];

  return (
    <div className={clsx("fixed inset-0 z-50 bg-white flex flex-col", className)}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#01502E] text-white shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Back">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={participant?.avatar || "/avatar.png"} 
                className="w-10 h-10 rounded-full object-cover" 
                alt="avatar" 
              />
              {participant?.online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <div className="font-medium text-white">{participant?.name || "Chat"}</div>
              {participant?.role && ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'].includes(participant.role) && (
                <div className="text-xs text-white/90 font-medium">
                  {participant.role === 'PROPERTY_OWNER' ? 'Property Owner' : 
                   participant.role === 'VEHICLE_OWNER' ? 'Vehicle Owner' : 
                   participant.role === 'TOUR_GUIDE' ? 'Tour Guide' : ''}
                </div>
              )}
              <div className="text-xs text-green-100">
                {isTyping ? "typing…" : participant?.online ? "online" : "offline"}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10" aria-label="Voice call">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10" aria-label="Video call">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10" aria-label="More options">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={listRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01502E]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <div className="text-4xl mb-2">👋</div>
            <div>Say hello!</div>
          </div>
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

      {/* Mobile Input Area */}
      <div className="border-t bg-white p-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-end gap-2">
          <button
            onClick={handleCameraCapture}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 rounded-full hover:bg-gray-100"
            aria-label="Camera"
          >
            <Camera className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (value.trim()) onSend(value.trim());
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-full border bg-gray-50 text-gray-900 px-4 py-2 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[#01502E] max-h-32"
              style={{ minHeight: "40px" }}
            />
          </div>

          {value.trim() ? (
            <button
              onClick={() => value.trim() && onSend(value.trim())}
              className="p-2 bg-[#01502E] text-white rounded-full hover:bg-[#013d23] transition-colors"
              aria-label="Send"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button
              onTouchStart={handleVoiceRecord}
              onTouchEnd={handleVoiceRecord}
              onMouseDown={handleVoiceRecord}
              onMouseUp={handleVoiceRecord}
              className={clsx(
                "p-2 rounded-full transition-colors",
                isRecording ? "bg-red-500 text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              )}
              aria-label="Voice message"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileChatInterface;
