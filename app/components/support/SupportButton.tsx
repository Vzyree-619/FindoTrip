import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { MessageCircle, X } from "lucide-react";
import SupportChat from "./SupportChat";

interface SupportButtonProps {
  userId: string;
  userRole: string;
}

export default function SupportButton({ userId, userRole }: SupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTicket, setActiveTicket] = useState(null);
  
  const fetcher = useFetcher();

  // Only show for providers
  const isProvider = ["PROPERTY_OWNER", "VEHICLE_OWNER", "TOUR_GUIDE"].includes(userRole);
  
  if (!isProvider) return null;

  useEffect(() => {
    // Fetch unread message count
    fetcher.load("/api/support/unread-count");
  }, []);

  useEffect(() => {
    if (fetcher.data?.unreadCount !== undefined) {
      setUnreadCount(fetcher.data.unreadCount);
    }
  }, [fetcher.data]);

  const handleOpenChat = () => {
    // Fetch active ticket or create new one
    fetcher.load("/api/support/active-ticket");
    setIsOpen(true);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setActiveTicket(null);
  };

  const handleTicketCreated = (ticket: any) => {
    setActiveTicket(ticket);
  };

  useEffect(() => {
    if (fetcher.data?.activeTicket) {
      setActiveTicket(fetcher.data.activeTicket);
    }
  }, [fetcher.data]);

  return (
    <>
      {/* Floating Support Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <Button
            onClick={handleOpenChat}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-[#01502E] hover:bg-[#013d23]"
            size="lg"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Support Chat Modal */}
      <SupportChat
        ticket={activeTicket}
        isOpen={isOpen}
        onClose={handleCloseChat}
        onTicketCreated={handleTicketCreated}
      />
    </>
  );
}
