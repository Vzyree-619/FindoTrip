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
    const es = new EventSource("/api/chat.stream");
    esRef.current = es;

    const onNotif = (ev: MessageEvent) => {
      try { onNotification(JSON.parse(ev.data)); } catch {}
    };
    const onMsg = (ev: MessageEvent) => {
      try { onMessage?.(JSON.parse(ev.data)); } catch {}
    };

    es.addEventListener("notification", onNotif as any);
    es.addEventListener("message", onMsg as any);

    return () => {
      try {
        es.removeEventListener("notification", onNotif as any);
        es.removeEventListener("message", onMsg as any);
        es.close();
      } catch {}
    };
  }, [onNotification, onMessage]);
}
