import { useEffect, useRef } from "react";

export type NotificationEvent = {
  id?: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: any;
  createdAt?: string;
  priority?: string;
};

export function useNotificationsStream(onNotification: (n: NotificationEvent) => void, onMessage?: (m: any) => void) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Try to establish SSE connection, but don't crash if it fails
    try {
      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      const onNotif = (ev: MessageEvent) => {
        try { onNotification(JSON.parse(ev.data)); } catch {}
      };
      const onMsg = (ev: MessageEvent) => {
        try { onMessage?.(JSON.parse(ev.data)); } catch {}
      };

      es.addEventListener("notification", onNotif as any);
      es.addEventListener("message", onMsg as any);
      es.addEventListener("connected", () => {
        console.log('🟢 SSE connected');
      });
      
      es.onerror = (error) => {
        console.warn('⚠️ SSE connection error (will retry automatically):', error);
      };

      return () => {
        try {
          es.removeEventListener("notification", onNotif as any);
          es.removeEventListener("message", onMsg as any);
          es.close();
        } catch {}
      };
    } catch (error) {
      console.warn('⚠️ Failed to establish SSE connection:', error);
      return () => {};
    }
  }, [onNotification, onMessage]);
}
