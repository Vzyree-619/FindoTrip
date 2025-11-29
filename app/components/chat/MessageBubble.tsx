import React, { useState, useEffect, useRef } from "react";
import { Check, CheckCheck, MoreVertical, Edit2, Trash2, X, Save } from "lucide-react";
import { formatTimestamp, clsx } from "./utils";
import { useTheme } from "~/contexts/ThemeContext";
import type { Message } from "./types";
import MessageModal from "./MessageModal";

export function MessageBubble({
  message,
  isSender,
  showAvatar,
  showTimestamp,
  avatarUrl,
  onEdit,
  onDelete,
  onReply,
  currentUserId,
  isAdmin = false,
  senderName,
}: {
  message: Message;
  isSender: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  avatarUrl?: string;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onDelete?: (messageId: string, deleteForEveryone?: boolean) => Promise<void>;
  onReply?: (m: Message) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  senderName?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content && onEdit) {
      try {
        await onEdit(message.id, editContent.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  const handleDelete = async (deleteForEveryone = false) => {
    if (onDelete) {
      try {
        setIsDeleting(true);
        await onDelete(message.id, deleteForEveryone);
        setShowActions(false);
      } catch (error) {
        console.error('Failed to delete message:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const canEdit = isSender && !message.isDeleted && message.type === "text";
  const canDelete = isSender || isAdmin;
  const canDeleteForEveryone = isAdmin;

  const statusIcon = message.status === "read" ? (
    <CheckCheck className="w-4 h-4 text-[#01502E]" />
  ) : message.status === "delivered" ? (
    <CheckCheck className="w-4 h-4 text-gray-400" />
  ) : message.status === "sent" ? (
    <Check className="w-4 h-4 text-gray-400" />
  ) : null;

  const handleMessageClick = () => {
    if (!isEditing && !message.isDeleted) {
      setShowModal(true);
    }
  };

  const content = (
    <div 
      className={clsx(
        "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow cursor-pointer hover:opacity-90 transition-opacity",
        isSender 
          ? "bg-[#01502E] text-white self-end" 
          : resolvedTheme === 'dark' 
            ? "bg-gray-800 text-gray-100 border border-gray-700" 
            : "bg-white text-gray-900 border border-gray-200"
      )}
      onClick={handleMessageClick}
      title="Click to view message details"
    >
      {message.isDeleted ? (
        <div className="italic opacity-60">
          {message.deletedBy === currentUserId ? "You deleted this message" : "This message was deleted"}
        </div>
      ) : isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 rounded border bg-white text-gray-900 resize-none"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEdit();
              } else if (e.key === 'Escape') {
                setIsEditing(false);
                setEditContent(message.content);
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={!editContent.trim() || editContent === message.content}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : message.type === "text" ? (
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
      
      {message.isEdited && !message.isDeleted && (
        <div className={clsx("text-[10px] opacity-60 mt-1", isSender ? "text-white" : "text-gray-500")}>
          edited
        </div>
      )}
      
      {showTimestamp && (
        <div className={clsx("mt-1 text-[11px] opacity-70 flex items-center gap-1", isSender ? "text-white" : "text-gray-500")}
             title={message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}>
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
        <img 
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'User')}&background=01502E&color=fff&size=128`} 
          alt="avatar" 
          className="w-6 h-6 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'User')}&background=01502E&color=fff&size=128`;
          }}
        />
      )}
      {content}
      {(isSender || isAdmin) && !message.isDeleted && (
        <div className="relative" ref={actionsRef}>
          <button 
            className="p-1 opacity-60 hover:opacity-100" 
            aria-label="Message actions"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
              {canEdit && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              
              {canDelete && (
                <>
                  <button
                    onClick={() => handleDelete(false)}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete for me"}
                  </button>
                  
                  {canDeleteForEveryone && (
                    <button
                      onClick={() => handleDelete(true)}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeleting ? "Deleting..." : "Delete for everyone"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Message Modal */}
      <MessageModal
        message={message}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        senderName={senderName}
        senderAvatar={avatarUrl}
      />
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
