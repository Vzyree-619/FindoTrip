import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { clsx } from "./utils";
import ChatNotificationBadge from "./ChatNotificationBadge";

export type ChatFloatingButtonProps = {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
};

export function ChatFloatingButton({
  unreadCount = 0,
  onClick,
  className,
  position = "bottom-right",
}: ChatFloatingButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6", 
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={clsx(
        "fixed z-50 w-14 h-14 bg-[#01502E] text-white rounded-full shadow-lg",
        "hover:bg-[#013d23] active:scale-95 transition-all duration-200",
        "focus:outline-none focus:ring-4 focus:ring-[#01502E]/30",
        "flex items-center justify-center",
        isPressed && "scale-95",
        positionClasses[position],
        className
      )}
      style={{
        paddingBottom: position.includes("bottom") ? "env(safe-area-inset-bottom)" : undefined,
        paddingTop: position.includes("top") ? "env(safe-area-inset-top)" : undefined,
        paddingRight: position.includes("right") ? "env(safe-area-inset-right)" : undefined,
        paddingLeft: position.includes("left") ? "env(safe-area-inset-left)" : undefined,
      }}
      aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <MessageCircle className="w-7 h-7" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1">
          <ChatNotificationBadge count={unreadCount} />
        </div>
      )}
    </button>
  );
}

export default ChatFloatingButton;
