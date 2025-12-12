import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { getPresence, setOnline } from "~/lib/chat/presence.server";

// GET /api/chat.presence?userIds=a,b,c
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  // touch current user as online on any presence poll
  try { setOnline(userId); } catch {}

  const url = new URL(request.url);
  const ids = (url.searchParams.get("userIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) return json({ presence: [] });
  const presence = getPresence(ids);
  return json({ presence });
}
