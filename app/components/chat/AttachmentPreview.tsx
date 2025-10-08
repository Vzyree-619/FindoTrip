import React from "react";
import { X, FileIcon, Image as ImageIcon } from "lucide-react";
import { bytesToSize, clsx } from "./utils";
import type { Attachment } from "./types";

export function AttachmentPreview({
  files,
  onRemove,
  className,
}: {
  files: Attachment[];
  onRemove?: (index: number) => void;
  className?: string;
}) {
  if (!files?.length) return null;
  return (
    <div className={clsx("mt-2 grid grid-cols-3 gap-2", className)}>
      {files.map((file, idx) => (
        <div key={idx} className="relative group border rounded-lg p-2 bg-white dark:bg-gray-800">
          {file.type === "image" ? (
            <div className="aspect-video overflow-hidden rounded">
              <img src={file.url} alt={file.name || "attachment"} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileIcon className="w-5 h-5 text-gray-500" />
              <span className="truncate text-sm">{file.name || "file"}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span className="truncate">{file.name}</span>
            <span>{bytesToSize(file.size)}</span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 border rounded-full p-1 shadow hover:bg-gray-50"
              aria-label="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default AttachmentPreview;
