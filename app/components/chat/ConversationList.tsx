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
  currentUserId,
}: {
  conversations: Conversation[];
  loading?: boolean;
  onSelect?: (id: string) => void;
  onSearch?: (q: string) => void;
  className?: string;
  currentUserId?: string;
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
    <div className={clsx("h-full flex flex-col min-h-0 w-full max-w-full", className)}>
      <div className="p-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 flex-shrink-0 w-full max-w-full">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1 w-full max-w-full">
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search conversations"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y min-h-0 w-full max-w-full">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">No conversations</div>
        ) : (
          filtered
            .slice()
            .sort((a, b) => {
              const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return dateB - dateA;
            })
            .map((conv) => {
              // Find the other participant (not the current user)
              const p = conv.participants?.find(participant => participant.id !== currentUserId) || conv.participants?.[0];
              const isServiceProvider = p?.role && ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'].includes(p.role);
              const serviceType = p?.role === 'PROPERTY_OWNER' ? 'Property Owner' : 
                                p?.role === 'VEHICLE_OWNER' ? 'Vehicle Owner' : 
                                p?.role === 'TOUR_GUIDE' ? 'Tour Guide' : null;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect?.(conv.id)}
                  className="w-full max-w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700"
                >
                  <div className="flex items-center gap-3 w-full max-w-full min-w-0">
                    <img src={p?.avatar || "/avatar.png"} alt="avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0 max-w-full">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="truncate font-medium text-gray-900 dark:text-gray-100 min-w-0 flex-1">{p?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">{formatTimeAgo(conv.updatedAt || new Date())}</div>
                      </div>
                      {isServiceProvider && serviceType && (
                        <div className="text-xs text-[#01502E] font-medium mb-1 truncate">
                          {serviceType}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage?.content || "No messages yet"}</div>
                    </div>
                    {conv.unreadCount ? (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#01502E] text-white flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    ) : p?.online ? (
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
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
