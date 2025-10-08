import React, { useEffect, useRef } from "react";
import { clsx } from "./utils";

export type ChatBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function ChatBottomSheet({ isOpen, onClose, children, className }: ChatBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          "relative w-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl",
          "transform transition-transform duration-300 ease-out",
          "animate-[slideUp_300ms_ease-out]",
          className
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {children}
      </div>
    </div>
  );
}

export default ChatBottomSheet;
