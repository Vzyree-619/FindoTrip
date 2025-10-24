import React, { useEffect } from "react";
import { X, User, Clock, Check, CheckCheck } from "lucide-react";
import { formatTimestamp } from "./utils";
import type { Message } from "./types";

export function MessageModal({
  message,
  isOpen,
  onClose,
  senderName,
  senderAvatar,
}: {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
  senderName?: string;
  senderAvatar?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statusIcon = message.status === "read" ? (
    <CheckCheck className="w-4 h-4 text-green-500" />
  ) : message.status === "delivered" ? (
    <CheckCheck className="w-4 h-4 text-gray-400" />
  ) : message.status === "sent" ? (
    <Check className="w-4 h-4 text-gray-400" />
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <img 
              src={senderAvatar || "/avatar.png"} 
              alt="avatar" 
              className="w-10 h-10 rounded-full object-cover" 
            />
            <div>
              <h3 className="font-semibold text-gray-900">{senderName || "Unknown"}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(message.createdAt)}</span>
                {statusIcon}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {message.isDeleted ? (
            <div className="text-center py-8 text-gray-500 italic">
              This message was deleted
            </div>
          ) : message.type === "text" ? (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap break-words text-gray-900">
                {message.content}
              </p>
            </div>
          ) : message.type === "image" ? (
            <div className="text-center">
              <img 
                src={message.attachments?.[0]?.url} 
                alt={message.content || "image"} 
                className="max-w-full max-h-96 object-contain mx-auto rounded-lg shadow-sm" 
              />
              {message.content && (
                <p className="mt-4 text-gray-600 italic">{message.content}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <div className="text-4xl mb-2">📎</div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {message.attachments?.[0]?.name || "Attachment"}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  {message.content || "No description"}
                </p>
                <a 
                  href={message.attachments?.[0]?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#01502E] text-white px-4 py-2 rounded-lg hover:bg-[#013d23] transition-colors"
                >
                  Download File
                </a>
              </div>
            </div>
          )}

          {message.isEdited && !message.isDeleted && (
            <div className="mt-4 text-xs text-gray-500 italic">
              Edited
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Message ID: {message.id.slice(0, 8)}...</span>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              {statusIcon}
              <span className="capitalize">{message.status || 'sent'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageModal;
