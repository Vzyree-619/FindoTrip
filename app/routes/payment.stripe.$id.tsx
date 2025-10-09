import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const bookingId = params.id!;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') as 'property'|'vehicle'|'tour' | null;
  if (!type) throw new Response('Invalid type', { status: 400 });

  // Simulate Stripe intent success for demo
  const booking = await (type === 'property' ? prisma.propertyBooking : type === 'vehicle' ? prisma.vehicleBooking : prisma.tourBooking).findUnique({ where: { id: bookingId } as any });
  if (!booking || booking.userId !== userId) throw new Response('Unauthorized', { status: 403 });

  await prisma.payment.updateMany({ where: { bookingId, bookingType: type, status: 'PENDING' }, data: { status: 'COMPLETED', paymentGateway: 'stripe', gatewayResponse: { ok: true } } });
  await (type === 'property' ? prisma.propertyBooking : type === 'vehicle' ? prisma.vehicleBooking : prisma.tourBooking).update({ where: { id: bookingId } as any, data: { status: 'CONFIRMED', paymentStatus: 'COMPLETED' } as any });

  return redirect(`/book/confirmation/${bookingId}?type=${type}`);
}

export default function StripeRedirect() { return null; }

