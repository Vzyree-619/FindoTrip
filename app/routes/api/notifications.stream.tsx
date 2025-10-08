import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { streamNotifications } from "~/lib/realtime.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  return streamNotifications(userId);
}
