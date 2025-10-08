import React from "react";
import { MessageCircle } from "lucide-react";
import ChatNotificationBadge from "./ChatNotificationBadge";
import { clsx } from "./utils";
import type { UserRole } from "./types";

export type ChatButtonProps = {
  targetUserId: string;
  targetUserRole: UserRole | string;
  serviceId?: string;
  bookingId?: string;
  variant?: "floating" | "inline";
  context?: "property" | "booking" | "admin" | "default";
  unreadCount?: number;
  onOpen?: () => void;
  className?: string;
};

export function ChatButton({
  targetUserId,
  targetUserRole,
  serviceId,
  bookingId,
  variant = "floating",
  context = "default",
  unreadCount = 0,
  onOpen,
  className,
}: ChatButtonProps) {
  const handleClick = async () => {
    // Fallback: ensure conversation exists
    try {
      await fetch('/api/chat/conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, type: 'CUSTOMER_PROVIDER', relatedServiceId: serviceId, relatedBookingId: bookingId })
      });
    } catch {}
    onOpen?.();
  };

  const styles = {
    base:
      "relative inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01502E]",
    floating:
      "fixed bottom-6 right-6 w-14 h-14 bg-[#01502E] text-white shadow-lg hover:bg-[#013d23]",
    inline:
      "px-3 py-2 bg-[#01502E] text-white hover:bg-[#013d23] rounded-md",
  } as const;

  const contextRing =
    context === "property"
      ? "ring-[#10b981]"
      : context === "booking"
      ? "ring-[#2563eb]"
      : context === "admin"
      ? "ring-[#ef4444]"
      : "ring-[#01502E]";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(styles.base, variant === "floating" ? styles.floating : styles.inline, className)}
      aria-label="Open chat"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="sr-only">Open chat</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1">
          <ChatNotificationBadge count={unreadCount} />
        </span>
      )}
    </button>
  );
}

export default ChatButton;
