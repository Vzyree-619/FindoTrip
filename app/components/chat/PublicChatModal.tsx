import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageCircle, User, Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useFetcher } from "@remix-run/react";
import type { Message } from "./types";

// Extend Message type for our use case
interface ChatMessage extends Omit<Message, 'type'> {
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  isRead?: boolean;
}

interface PublicChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PublicChatModal({ isOpen, onClose }: PublicChatModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestUserId, setGuestUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation if conversationId exists
  useEffect(() => {
    if (conversationId && isOpen) {
      loadConversation();
    }
  }, [conversationId, isOpen]);

  const loadConversation = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`/api/chat/public/conversation/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          // Format messages for display
          const formattedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderName: msg.senderName || "Support",
            content: msg.content,
            type: msg.type.toUpperCase() as "TEXT" | "IMAGE" | "FILE" | "SYSTEM",
            createdAt: new Date(msg.createdAt),
            isRead: msg.isRead || false,
            attachments: msg.attachments || [],
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    if (!conversationId && (!name.trim() || !email.trim())) {
      alert("Please enter your name and email to start chatting");
      return;
    }

    setIsSubmitting(true);
    const messageText = message;
    setMessage(""); // Clear input immediately

    try {
      if (!conversationId) {
        // Create conversation and send first message
        const response = await fetch("/api/chat/public/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            message: messageText,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setConversationId(data.conversationId);
          // Add the sent message to UI
          const newMessage: Message = {
            id: data.messageId || `temp-${Date.now()}`,
            conversationId: data.conversationId,
            senderId: data.guestUserId || "guest",
            senderName: name.trim(),
            content: messageText,
            type: "TEXT",
            createdAt: new Date(),
            isRead: false,
            attachments: [],
          };
          setMessages([...messages, newMessage]);
        } else {
          alert("Failed to send message. Please try again.");
          setMessage(messageText); // Restore message
        }
      } else {
        // Send message to existing conversation using public endpoint
        const response = await fetch(`/api/chat/public/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: messageText,
            guestUserId: guestUserId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Add the sent message to UI immediately
          const newMessage: ChatMessage = {
            id: data.id || `temp-${Date.now()}`,
            conversationId: conversationId,
            senderId: data.senderId || "guest",
            senderName: name.trim() || "Guest",
            content: messageText,
            type: "TEXT",
            createdAt: new Date(data.createdAt || new Date()),
            isRead: false,
            attachments: [],
          };
          setMessages((prev) => [...prev, newMessage]);
          
          // Reload conversation to get the actual message from server
          setTimeout(() => {
            loadConversation();
          }, 500);
        } else {
          alert("Failed to send message. Please try again.");
          setMessage(messageText); // Restore message
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
      setMessage(messageText); // Restore message
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#01502E] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat Support</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">We're here to help!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!conversationId ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start a conversation with our support team
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderName === name.trim() ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.senderName === name.trim()
                      ? "bg-[#01502E] text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.senderName === name.trim() ? "You" : "Support"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {!conversationId ? (
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-xs">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="message" className="text-xs">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  required
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
                className="w-full bg-[#01502E] hover:bg-[#013d23]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={2}
                className="flex-1 resize-none"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="bg-[#01502E] hover:bg-[#013d23] px-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

