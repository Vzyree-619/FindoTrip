import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { listUserNotifications, markNotificationsRead } from "~/lib/notifications.server";

// GET: list notifications
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const take = parseInt(url.searchParams.get("take") || "50", 10);
  const items = await listUserNotifications(userId, Math.min(Math.max(take, 1), 200));
  return json({ items });
}

// POST: mark read
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "mark-read") {
    const idsRaw = form.get("ids") as string | null; // JSON array
    const all = form.get("all") === "true";
    let ids: string[] | undefined;
    if (idsRaw) {
      try { ids = JSON.parse(idsRaw); } catch { ids = undefined; }
    }
    const result = await markNotificationsRead(userId, ids, all);
    return json(result);
  }

  return json({ error: "Invalid action" }, { status: 400 });
}
