// In-memory presence tracking with TTL. Suitable for single-instance.

declare global {
  // eslint-disable-next-line no-var
  var __presence__: Map<string, number> | undefined;
}

const presence: Map<string, number> = (globalThis.__presence__ ||= new Map());
const ONLINE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function now() { return Date.now(); }

export function setOnline(userId: string) {
  presence.set(userId, now());
}

export function setOffline(userId: string) {
  presence.delete(userId);
}

export function touch(userId: string) {
  presence.set(userId, now());
}

export function isOnline(userId: string) {
  const ts = presence.get(userId);
  if (!ts) return false;
  return now() - ts < ONLINE_TTL_MS;
}

export function lastSeen(userId: string) {
  const ts = presence.get(userId);
  return ts ? new Date(ts) : null;
}

export function getPresence(userIds: string[]) {
  const t = now();
  return userIds.map((id) => ({
    userId: id,
    online: presence.has(id) && t - (presence.get(id) as number) < ONLINE_TTL_MS,
    lastSeen: presence.has(id) ? new Date(presence.get(id) as number) : null,
  }));
}
