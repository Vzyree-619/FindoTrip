import React, { useRef, useState } from "react";
import { Reply, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { clsx } from "./utils";
import type { Message } from "./types";

export type SwipeableMessageBubbleProps = {
  message: Message;
  isSender: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  avatarUrl?: string;
  onReply?: (message: Message) => void;
  onCopy?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
};

export function SwipeableMessageBubble({
  message,
  isSender,
  showAvatar,
  showTimestamp,
  avatarUrl,
  onReply,
  onCopy,
  onDelete,
  onLongPress,
}: SwipeableMessageBubbleProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    longPressTimerRef.current = window.setTimeout(() => {
      setIsLongPressing(true);
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
      onLongPress?.(message);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if moving
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Only allow horizontal swipe if not moving too much vertically
    if (deltaY < 50) {
      // Swipe right to reply (for received messages)
      if (!isSender && deltaX > 0) {
        setSwipeOffset(Math.min(deltaX * 0.3, 60));
      }
      // Swipe left for actions (for sent messages)
      else if (isSender && deltaX < 0) {
        setSwipeOffset(Math.max(deltaX * 0.3, -60));
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (Math.abs(swipeOffset) > 30) {
      if (swipeOffset > 30 && !isSender) {
        // Swipe right to reply
        onReply?.(message);
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      } else if (swipeOffset < -30 && isSender) {
        // Swipe left for actions
        setShowActions(true);
      }
    }

    setSwipeOffset(0);
    setIsLongPressing(false);
    touchStartRef.current = null;
  };

  const handleDoubleClick = () => {
    // Double-tap to react
    if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }
    // TODO: Add reaction logic
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.content);
    onCopy?.(message);
    setShowActions(false);
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDelete = () => {
    onDelete?.(message);
    setShowActions(false);
    if ("vibrate" in navigator) {
      navigator.vibrate(100);
    }
  };

  return (
    <div className="relative">
      {/* Swipe Actions Background */}
      {swipeOffset !== 0 && (
        <div className="absolute inset-0 flex items-center">
          {swipeOffset > 0 && (
            <div className="ml-4 text-[#01502E]">
              <Reply className="w-5 h-5" />
            </div>
          )}
          {swipeOffset < 0 && (
            <div className="ml-auto mr-4 text-gray-500">
              <MoreHorizontal className="w-5 h-5" />
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={clsx(
          "transition-transform duration-200 ease-out",
          isLongPressing && "scale-105"
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <MessageBubble
          message={message}
          isSender={isSender}
          showAvatar={showAvatar}
          showTimestamp={showTimestamp}
          avatarUrl={avatarUrl}
        />
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowActions(false)}>
          <div className="bg-white rounded-lg shadow-xl p-2 m-4">
            <button
              onClick={handleCopy}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-100 rounded-lg"
            >
              <Copy className="w-5 h-5" />
              <span>Copy</span>
            </button>
            {onReply && (
              <button
                onClick={() => {
                  onReply(message);
                  setShowActions(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-100 rounded-lg"
              >
                <Reply className="w-5 h-5" />
                <span>Reply</span>
              </button>
            )}
            {isSender && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-100 rounded-lg text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SwipeableMessageBubble;
