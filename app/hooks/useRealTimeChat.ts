import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type RTMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  attachments?: any[];
  createdAt: string;
  status?: "sending" | "sent" | "delivered" | "read";
};

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export function useRealTimeChat(conversationId?: string) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [messages, setMessages] = useState<RTMessage[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(1000);
  const typingTimerRef = useRef<number | null>(null);

  const fetchInitial = useCallback(async () => {
    if (!conversationId) return;
    try {
      const url = new URL("/api/chat.conversation", window.location.origin);
      url.searchParams.set("conversationId", conversationId);
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = await res.json();
      const arr: RTMessage[] = (data?.messages || []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        type: m.type,
        attachments: m.attachments,
        createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString(),
        status: m.status || "sent",
      }));
      setMessages(arr);
    } catch (e) {
      // ignore
    }
  }, [conversationId]);

  const connect = useCallback(() => {
    if (esRef.current) return;
    setStatus("connecting");
    try {
      const es = new EventSource("/api/chat.stream");
      esRef.current = es;
      es.onopen = () => {
        backoffRef.current = 1000;
        setStatus("connected");
        // Fetch latest messages on reconnect to avoid missed events
        fetchInitial();
      };
      es.onerror = () => {
        setStatus("error");
        es.close();
        esRef.current = null;
        const delay = Math.min(backoffRef.current, 15000);
        window.setTimeout(connect, delay);
        backoffRef.current *= 2;
      };
      const onMsg = (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.type === "chat_message") {
            if (!conversationId || payload.conversationId === conversationId) {
              setMessages((prev) => [
                ...prev,
                {
                  id: payload.message.id,
                  conversationId: payload.conversationId,
                  senderId: payload.message.senderId,
                  content: payload.message.content,
                  type: payload.message.type,
                  attachments: payload.message.attachments,
                  createdAt: payload.message.createdAt,
                  status: "sent",
                },
              ]);
            }
          }
        } catch {}
      };
      es.addEventListener("message", onMsg as any);
    } catch (e) {
      setStatus("error");
    }
  }, [conversationId]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) {
        try { esRef.current.close(); } catch {}
        esRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    if (!conversationId) return;
    // Poll typing users every 2s
    const id = window.setInterval(async () => {
      try {
        const url = new URL("/api/chat.typing", window.location.origin);
        url.searchParams.set("conversationId", conversationId);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setTypingUserIds(data?.typingUserIds || []);
        }
      } catch {}
    }, 2000);
    return () => window.clearInterval(id);
  }, [conversationId]);

  const send = useCallback(
    async (text: string, files?: File[]) => {
      if (!text?.trim()) return;
      const temp: RTMessage = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId || "temp",
        senderId: "me",
        content: text,
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      setMessages((prev) => [...prev, temp]);

      try {
        const form = new FormData();
        if (conversationId) form.append("conversationId", conversationId);
        form.append("text", text);
        // Attachments (optional): not implemented server-side yet; keep placeholder
        if (files?.length) {
          files.forEach((f) => form.append("files", f));
        }
        const res = await fetch("/api/chat.send", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok && data?.message) {
          setMessages((prev) => prev.map((m) => (m.id === temp.id ? data.message : m)));
        } else {
          setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "sent" } : m)));
        }
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "sent" } : m)));
      }
    },
    [conversationId]
  );

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId) return;
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    try {
      await fetch("/api/chat.typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping }),
      });
    } catch {}
    // Schedule stop typing after 3s if no updates
    if (isTyping) {
      typingTimerRef.current = window.setTimeout(() => {
        fetch("/api/chat.typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, isTyping: false }),
        });
      }, 3000) as unknown as number;
    }
  }, [conversationId]);

  return {
    status,
    messages,
    typingUserIds,
    send,
    setTyping,
  } as const;
}
