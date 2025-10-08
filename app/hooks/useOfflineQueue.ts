import { useEffect, useState } from "react";

export type QueuedMessage = {
  id: string;
  conversationId: string;
  targetUserId: string;
  text: string;
  files?: File[];
  timestamp: number;
  retries: number;
};

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chat-queue");
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("chat-queue", JSON.stringify(queue));
    } catch {}
  }, [queue]);

  const addToQueue = (message: Omit<QueuedMessage, "id" | "timestamp" | "retries">) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    
    setQueue(prev => [...prev, queuedMessage]);
    return queuedMessage.id;
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(msg => msg.id !== id));
  };

  const processQueue = async (
    sendFunction: (args: {
      conversationId?: string;
      targetUserId?: string;
      text: string;
      files?: File[];
    }) => Promise<any>
  ) => {
    if (!isOnline || isProcessing || queue.length === 0) return;

    setIsProcessing(true);

    for (const message of queue) {
      try {
        await sendFunction({
          conversationId: message.conversationId,
          targetUserId: message.targetUserId,
          text: message.text,
          files: message.files,
        });
        
        // Success - remove from queue
        removeFromQueue(message.id);
      } catch (error) {
        // Failure - increment retries
        if (message.retries < 3) {
          setQueue(prev => 
            prev.map(msg => 
              msg.id === message.id 
                ? { ...msg, retries: msg.retries + 1 }
                : msg
            )
          );
        } else {
          // Max retries reached - remove from queue
          removeFromQueue(message.id);
        }
      }
    }

    setIsProcessing(false);
  };

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      // Will be processed by the component using this hook
    }
  }, [isOnline, queue.length]);

  return {
    queue,
    isOnline,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
  };
}
