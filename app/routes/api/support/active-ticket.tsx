import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Get the most recent active ticket for the user
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      providerId: userId,
      status: { in: ["NEW", "IN_PROGRESS", "WAITING"] },
    },
    include: {
      provider: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  });

  return json({ activeTicket: ticket });
}
