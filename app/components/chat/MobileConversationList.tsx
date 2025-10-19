import React, { useState } from "react";
import { Search, Plus, Archive, Trash2 } from "lucide-react";
import type { Conversation } from "./types";
import { clsx, formatTimeAgo } from "./utils";
import { usePresence } from "~/hooks/usePresence";

export type MobileConversationListProps = {
  conversations: Conversation[];
  loading?: boolean;
  onSelect?: (id: string) => void;
  onSearch?: (q: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
};

export function MobileConversationList({
  conversations,
  loading,
  onSelect,
  onSearch,
  onArchive,
  onDelete,
  className,
}: MobileConversationListProps) {
  const [q, setQ] = useState("");
  const [swipedItem, setSwipedItem] = useState<string | null>(null);
  
  const userIds = conversations.flatMap(c => c.participants?.map(p => p.id) || []);
  const { presence } = usePresence(userIds);

  const filtered = conversations.filter(c => 
    !q || c.participants?.[0]?.name?.toLowerCase().includes(q.toLowerCase()) ||
    c.lastMessage?.content?.toLowerCase().includes(q.toLowerCase())
  );

  const handleSwipe = (convId: string, direction: 'left' | 'right') => {
    if (direction === 'left') {
      setSwipedItem(convId);
    } else {
      setSwipedItem(null);
    }
  };

  return (
    <div className={clsx("h-full flex flex-col bg-white", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-[#01502E] text-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Messages</h1>
          <button className="p-2 rounded-full hover:bg-white/10">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-white/70" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search conversations"
            className="flex-1 bg-transparent text-white placeholder-white/70 outline-none"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <div>No conversations yet</div>
          </div>
        ) : (
          filtered.map((conv) => {
            const p = conv.participants?.[0];
            const isOnline = presence.find(pr => pr.userId === p?.id)?.online;
            const isSwipped = swipedItem === conv.id;
            
            return (
              <div key={conv.id} className="relative">
                {/* Swipe Actions */}
                {isSwipped && (
                  <div className="absolute right-0 top-0 h-full flex items-center bg-red-500 px-4">
                    <button
                      onClick={() => onArchive?.(conv.id)}
                      className="p-2 text-white mr-2"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete?.(conv.id)}
                      className="p-2 text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                {/* Conversation Item */}
                <button
                  onClick={() => onSelect?.(conv.id)}
                  className={clsx(
                    "w-full text-left p-4 border-b border-gray-100 dark:border-gray-800",
                    "hover:bg-gray-50 active:bg-gray-100",
                    "transition-transform duration-200",
                    isSwipped && "transform -translate-x-24"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={p?.avatar || "/avatar.png"} 
                        alt="avatar" 
                        className="w-12 h-12 rounded-full object-cover" 
                      />
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-medium truncate">{p?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(conv.updatedAt || new Date())}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {conv.lastMessage?.content || "No messages yet"}
                      </div>
                    </div>
                    {conv.unreadCount && conv.unreadCount > 0 && (
                      <div className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MobileConversationList;
