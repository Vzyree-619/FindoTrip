import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Count unread support messages for the user
  const unreadCount = await prisma.supportMessage.count({
    where: {
      ticket: {
        providerId: userId,
      },
      isRead: false,
      senderId: { not: userId },
    },
  });

  return json({ unreadCount });
}
