import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { clsx } from "./utils";
import type { Attachment } from "./types";
import AttachmentPreview from "./AttachmentPreview";

export function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  onTyping,
  disabled,
  maxLength,
  placeholder = "Type a message",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string, files?: File[]) => void;
  onAttach?: (files: File[]) => void;
  onTyping?: (typing: boolean) => void;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    autoResize();
  }, [value]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !onTyping) return;
    const handle = setTimeout(() => onTyping(false), 1200);
    return () => clearTimeout(handle);
  }, [value]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        const messageText = value.trim();
        const messageFiles = [...files];
        // Clear files immediately
        setFiles([]);
        // onSend will handle clearing the input value
        onSend(messageText, messageFiles);
      }
    }
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    if (!f.length) return;
    setFiles(f);
    onAttach?.(f);
  };

  const previews = useMemo<Attachment[]>(() =>
    files.map((file) => ({
      type: file.type.startsWith("image") ? "image" : "file",
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      mimeType: file.type,
    })),
  [files]);

  const removeAttachment = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    onChange(value + emoji);
    setIsEmojiOpen(false);
  };

  return (
    <div className="border-t bg-white dark:bg-gray-800 p-2" aria-label="Chat input area">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={onPickFiles} />
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onTyping?.(true);
              onChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={1}
            className={clsx(
              "w-full resize-none rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
              "focus:outline-none focus:ring-2 focus:ring-[#01502E] px-3 py-2 text-sm"
            )}
            aria-label="Type a message"
          />
          {isEmojiOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow p-2 grid grid-cols-8 gap-1">
              {"😀😃😄😁😆😅😂😊😍😘😜🤗👍🙏👏🔥🎉✨🥳😎🤩".split("")
                .filter(Boolean)
                .map((e, i) => (
                  <button key={i} className="text-xl" onClick={() => addEmoji(e)} aria-label={`emoji ${e}`}>
                    {e}
                  </button>
                ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsEmojiOpen((s) => !s)}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Emoji picker"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={() => {
            if (value.trim()) {
              const messageText = value.trim();
              const messageFiles = [...files];
              setFiles([]);
              onSend(messageText, messageFiles);
            }
          }}
          className={clsx(
            "inline-flex items-center gap-1 bg-[#01502E] text-white px-3 py-2 rounded-lg",
            disabled || !value.trim() ? "opacity-60 cursor-not-allowed" : "hover:bg-[#013d23]"
          )}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      {files.length > 0 && (
        <AttachmentPreview files={previews} onRemove={removeAttachment} className="mt-2" />
      )}
      {maxLength && (
        <div className="text-right text-xs text-gray-500 mt-1">{value.length}/{maxLength}</div>
      )}
    </div>
  );
}

export default ChatInput;
