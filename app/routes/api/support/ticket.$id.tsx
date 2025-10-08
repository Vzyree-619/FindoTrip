import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const ticketId = params.id;

  if (!ticketId) {
    throw new Response("Ticket ID is required", { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      provider: {
        select: {
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
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
              email: true,
              role: true,
            },
          },
          template: {
            select: {
              name: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!ticket) {
    throw new Response("Ticket not found", { status: 404 });
  }

  // Check if user has access to this ticket
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (ticket.providerId !== userId && user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  return json({ ticket });
}
