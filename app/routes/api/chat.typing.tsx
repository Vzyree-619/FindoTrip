import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { getTyping, setTyping } from "~/lib/chat/typing.server";
import { prisma } from "~/lib/db/db.server";
import { publishToUser } from "~/lib/realtime.server";

// GET /api/chat.typing?conversationId=...
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) return json({ error: "conversationId is required" }, { status: 400 });

  try {
    const typingUserIds = getTyping(conversationId).filter((id) => id !== userId);
    return json({ typingUserIds });
  } catch (e) {
    return json({ error: "Failed to get typing state" }, { status: 500 });
  }
}

// POST /api/chat.typing { conversationId, isTyping }
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const body = await request.json().catch(() => ({}));
  const conversationId = body.conversationId as string;
  const isTyping = Boolean(body.isTyping);
  if (!conversationId) return json({ error: "conversationId is required" }, { status: 400 });

  try {
    // Ensure user is a participant
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || !conv.participants?.includes(userId)) return json({ error: "Forbidden" }, { status: 403 });

    setTyping(userId, conversationId, isTyping);

    // Best-effort SSE notify participants (if they listen to typing via SSE)
    for (const pid of conv.participants as string[]) {
      if (!pid || pid === userId) continue;
      publishToUser(pid, "message", {
        type: "typing",
        conversationId,
        senderId: userId,
        typing: isTyping,
      });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: "Failed to set typing state" }, { status: 500 });
  }
}
