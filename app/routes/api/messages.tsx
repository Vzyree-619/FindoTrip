import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { listConversations, listMessages, sendMessage, markMessagesRead } from "~/lib/messaging.server";

// GET: conversations or messages
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "conversations"; // conversations | messages
  const peerId = url.searchParams.get("peerId");
  const take = parseInt(url.searchParams.get("take") || "50", 10);

  if (mode === "messages") {
    if (!peerId) return json({ error: "peerId required" }, { status: 400 });
    const items = await listMessages(userId, peerId, take);
    return json({ items });
  }

  const items = await listConversations(userId, Math.min(Math.max(take, 1), 50));
  return json({ items });
}

// POST: send or mark read
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "send") {
    const receiverId = form.get("receiverId") as string;
    const content = (form.get("content") as string) || "";
    const bookingId = form.get("bookingId") as string | null;
    const bookingType = form.get("bookingType") as any;
    const attachmentsRaw = form.get("attachments") as string | null; // JSON array of URLs
    let attachments: string[] | undefined;
    if (attachmentsRaw) {
      try { attachments = JSON.parse(attachmentsRaw); } catch {}
    }

    if (!receiverId || !content) return json({ error: "receiverId and content required" }, { status: 400 });

    const msg = await sendMessage({ senderId: userId, receiverId, content, bookingId: bookingId ?? undefined, bookingType, attachments });
    return json({ success: true, message: msg });
  }

  if (intent === "mark-read") {
    const peerId = form.get("peerId") as string | undefined;
    const res = await markMessagesRead(userId, peerId);
    return json(res);
  }

  return json({ error: "Invalid action" }, { status: 400 });
}
