import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    
    const bookingId = formData.get("bookingId") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const paymentAmount = parseFloat(formData.get("paymentAmount") as string);

    if (!bookingId || !paymentMethod || !paymentAmount) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { accommodation: true, user: true },
    });

    if (!booking) {
      return json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return json({ error: "Booking is not in pending status" }, { status: 400 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: paymentAmount,
        currency: "PKR",
        method: paymentMethod as "CARD" | "CASH" | "BANK_TRANSFER",
        status: paymentMethod === "CASH" ? "PENDING" : "COMPLETED",
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      },
    });

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: {
        accommodation: true,
        user: true,
        payments: true,
      },
    });

    // TODO: Send confirmation email here
    // await sendBookingConfirmationEmail(updatedBooking);

    return json({ 
      success: true, 
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        paymentId: payment.id,
      }
    });

  } catch (error) {
    console.error("Booking confirmation error:", error);
    return json({ error: "Failed to confirm booking" }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
