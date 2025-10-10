import React from "react";
import { Check, CheckCheck, MoreVertical } from "lucide-react";
import { formatTimestamp, clsx } from "./utils";
import type { Message } from "./types";

export function MessageBubble({
  message,
  isSender,
  showAvatar,
  showTimestamp,
  avatarUrl,
  onEdit,
  onDelete,
  onReply,
}: {
  message: Message;
  isSender: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  avatarUrl?: string;
  onEdit?: (m: Message) => void;
  onDelete?: (m: Message) => void;
  onReply?: (m: Message) => void;
}) {
  const statusIcon = message.status === "read" ? (
    <CheckCheck className="w-4 h-4 text-[#01502E]" />
  ) : message.status === "delivered" ? (
    <CheckCheck className="w-4 h-4 text-gray-400" />
  ) : message.status === "sent" ? (
    <Check className="w-4 h-4 text-gray-400" />
  ) : null;

  const content = (
    <div className={clsx(
      "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow",
      isSender ? "bg-[#01502E] text-white self-end" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    )}>
      {message.type === "text" ? (
        <span className="whitespace-pre-wrap break-words">
          {renderWithLinks(message.content)}
        </span>
      ) : message.type === "image" ? (
        <img src={message.attachments?.[0]?.url} alt={message.content || "image"} className="rounded-lg max-h-64" />
      ) : (
        <a href={message.attachments?.[0]?.url} className="underline" target="_blank" rel="noreferrer">
          {message.attachments?.[0]?.name || message.content || "Attachment"}
        </a>
      )}
      {showTimestamp && (
        <div className={clsx("mt-1 text-[11px] opacity-70 flex items-center gap-1", isSender ? "text-white" : "text-gray-500")}
             title={new Date(message.createdAt).toLocaleString()}>
          <span>{formatTimestamp(message.createdAt)}</span>
          {isSender && statusIcon}
        </div>
      )}
    </div>
  );

  return (
    <div className={clsx("w-full flex items-end gap-2", isSender ? "justify-end" : "justify-start")}
         role="listitem" aria-label={isSender ? "Sent message" : "Received message"}>
      {!isSender && showAvatar && (
        <img src={avatarUrl || "/avatar.png"} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
      )}
      {content}
      {isSender && (
        <div className="relative">
          <button className="p-1 opacity-60 hover:opacity-100" aria-label="Message actions">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function renderWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    part.match(/^https?:\/\//) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="underline break-all">
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export default MessageBubble;
