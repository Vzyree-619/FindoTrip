import { useEffect, useState } from "react";

export type PresenceInfo = {
  userId: string;
  online: boolean;
  lastSeen: Date | null;
};

export function usePresence(userIds: string[], pollInterval = 15000) {
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userIds?.length) {
      setPresence([]);
      return;
    }

    const fetchPresence = async () => {
      try {
        setLoading(true);
        const url = new URL("/api/chat.presence", window.location.origin);
        url.searchParams.set("userIds", userIds.join(","));
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setPresence(data.presence || []);
        }
      } catch {
        // ignore errors
      } finally {
        setLoading(false);
      }
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, pollInterval);
    return () => clearInterval(interval);
  }, [userIds.join(","), pollInterval]);

  return { presence, loading };
}
