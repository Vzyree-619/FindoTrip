import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { streamNotifications } from "~/lib/realtime.server";

// Server-Sent Events stream dedicated to chat usage.
// We reuse the global SSE hub (streamNotifications) which delivers
// any events published via publishToUser(userId, eventName, payload).
// Chat producers should use event names like "message" (with type: "chat_message")
// or a dedicated event name like "chat".
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  return streamNotifications(userId);
}
