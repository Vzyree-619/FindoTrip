import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import PublicChatModal from "./PublicChatModal";

interface PublicChatButtonProps {
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function PublicChatButton({ triggerOpen, onOpenChange }: PublicChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (triggerOpen !== undefined) {
      setIsOpen(triggerOpen);
    }
  }, [triggerOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <>
      {/* Floating Chat Button - only show if not triggered externally */}
      {triggerOpen === undefined && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleOpen}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-[#01502E] hover:bg-[#013d23] text-white"
            size="lg"
            aria-label="Open live chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat Modal */}
      <PublicChatModal
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
}

