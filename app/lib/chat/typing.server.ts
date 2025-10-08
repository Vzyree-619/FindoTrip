// Simple in-memory typing indicator store with TTL per conversation per user.
// Suitable for development and single-instance deployments.

type TypingState = Map<string /*conversationId*/, Map<string /*userId*/, number /*expiry ms*/>>;

declare global {
  // eslint-disable-next-line no-var
  var __chat_typing__: TypingState | undefined;
}

const typingState: TypingState = (globalThis.__chat_typing__ ||= new Map());
const TYPING_TTL_MS = 5000; // 5 seconds

function now() {
  return Date.now();
}

function prune(convId?: string) {
  const pruneConv = (cid: string, map: Map<string, number>) => {
    const t = now();
    for (const [uid, exp] of map) {
      if (exp <= t) map.delete(uid);
    }
    if (map.size === 0) typingState.delete(cid);
  };

  if (convId) {
    const m = typingState.get(convId);
    if (m) pruneConv(convId, m);
    return;
  }
  for (const [cid, m] of typingState) pruneConv(cid, m);
}

export function setTyping(userId: string, conversationId: string, isTyping: boolean) {
  prune(conversationId);
  let conv = typingState.get(conversationId);
  if (!conv) {
    conv = new Map();
    typingState.set(conversationId, conv);
  }
  if (isTyping) {
    conv.set(userId, now() + TYPING_TTL_MS);
  } else {
    conv.delete(userId);
  }
}

export function getTyping(conversationId: string) {
  prune(conversationId);
  const conv = typingState.get(conversationId);
  if (!conv) return [] as string[];
  const t = now();
  const list: string[] = [];
  for (const [uid, exp] of conv) {
    if (exp > t) list.push(uid);
  }
  return list;
}
