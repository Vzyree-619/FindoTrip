/*
  Simple Server-Sent Events (SSE) hub with per-user channels.
  Usage:
    - streamNotifications(userId): returns a Response with SSE stream
    - publishToUser(userId, event, data): pushes a named event
*/

const encoder = new TextEncoder();

type Client = {
  userId: string;
  send: (event: string, data: any) => void;
  close: () => void;
};

declare global {
  // eslint-disable-next-line no-var
  var __sse_clients__: Map<string, Set<Client>> | undefined;
}

const clients: Map<string, Set<Client>> = (globalThis.__sse_clients__ ||= new Map());

export function publishToUser(userId: string, event: string, data: any) {
  const set = clients.get(userId);
  if (!set) return;
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  for (const client of set) {
    try {
      client.send(event, payload);
    } catch (e) {
      // best-effort
    }
  }
}

export function streamNotifications(userId: string): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: any) => {
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        const chunk = `event: ${event}\n` + `data: ${payload}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };
      const close = () => {
        try { controller.close(); } catch {}
      };

      const client: Client = { userId, send, close };
      let set = clients.get(userId);
      if (!set) {
        set = new Set();
        clients.set(userId, set);
      }
      set.add(client);

      // initial welcome
      send("connected", { ok: true });

      const interval = setInterval(() => {
        // keep-alive every 25s
        try { controller.enqueue(encoder.encode(`:\n\n`)); } catch {}
      }, 25000);

      return () => {
        clearInterval(interval);
        const s = clients.get(userId);
        if (s) {
          s.delete(client);
          if (s.size === 0) clients.delete(userId);
        }
      };
    },
    cancel() {
      // handled by returned cleanup
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
