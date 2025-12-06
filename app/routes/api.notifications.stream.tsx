import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserId } from "~/lib/auth/auth.server";
import { streamNotifications } from "~/lib/realtime.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    return streamNotifications(userId);
  } catch (error) {
    console.error("Error in notifications stream:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
