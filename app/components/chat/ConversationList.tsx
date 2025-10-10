import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Conversation } from "./types";
import { clsx, formatTimeAgo } from "./utils";

export function ConversationList({
  conversations,
  loading,
  onSelect,
  onSearch,
  className,
}: {
  conversations: Conversation[];
  loading?: boolean;
  onSelect?: (id: string) => void;
  onSearch?: (q: string) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const list = conversations || [];
    if (!q) return list;
    return list.filter((c) =>
      (c.participants?.[0]?.name || "").toLowerCase().includes(q.toLowerCase()) ||
      (c.lastMessage?.content || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [conversations, q]);

  return (
    <div className={clsx("h-full flex flex-col", className)}>
      <div className="p-3 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search conversations"
            className="flex-1 bg-transparent outline-none text-sm py-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No conversations</div>
        ) : (
          filtered
            .slice()
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((conv) => {
              const p = conv.participants?.[0];
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect?.(conv.id)}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <img src={p?.avatar || "/avatar.png"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium">{p?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(conv.updatedAt)}</div>
                      </div>
                      <div className="text-sm text-gray-500 truncate">{conv.lastMessage?.content || "No messages yet"}</div>
                    </div>
                    {conv.unreadCount ? (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#01502E] text-white">
                        {conv.unreadCount}
                      </span>
                    ) : p?.online ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    ) : null}
                  </div>
                </button>
              );
            })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
