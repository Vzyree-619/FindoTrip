import React from "react";
import { clsx } from "./utils";

export function ChatNotificationBadge({ count, className, onClick }: { count?: number; className?: string; onClick?: () => void }) {
  if (!count || count <= 0) return null;
  return (
    <span
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold shadow",
        "transition-transform duration-200 ease-out",
        "animate-[pop_150ms_ease-out]",
        className
      )}
      aria-label={`${count} unread messages`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default ChatNotificationBadge;
