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
    const cancellationReason = formData.get("cancellationReason") as string;

    if (!bookingId) {
      return json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        accommodation: true, 
        user: true,
        payments: true,
      },
    });

    if (!booking) {
      return json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status === "CANCELLED") {
      return json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    // Check cancellation policy (24 hours before check-in)
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundPercentage = 0;

    if (hoursUntilCheckIn > 48) {
      // Full refund if cancelled more than 48 hours before
      refundPercentage = 100;
      refundAmount = booking.totalPrice;
    } else if (hoursUntilCheckIn > 24) {
      // 50% refund if cancelled 24-48 hours before
      refundPercentage = 50;
      refundAmount = booking.totalPrice * 0.5;
    } else {
      // No refund if cancelled less than 24 hours before
      refundPercentage = 0;
      refundAmount = 0;
    }

    // Update booking status
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: "CANCELLED",
        cancelledAt: new Date(),
        specialRequests: cancellationReason ? 
          `${booking.specialRequests || ""}\n\nCancellation Reason: ${cancellationReason}`.trim() :
          booking.specialRequests,
      },
    });

    // Create refund payment record if applicable
    let refundPayment = null;
    if (refundAmount > 0 && booking.payments.length > 0) {
      const originalPayment = booking.payments[0];
      refundPayment = await prisma.payment.create({
        data: {
          bookingId,
          amount: -refundAmount, // Negative amount for refund
          currency: "PKR",
          method: originalPayment.method,
          status: "PENDING",
          transactionId: `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        },
      });
    }

    // TODO: Send cancellation confirmation email
    // await sendBookingCancellationEmail(cancelledBooking, refundAmount, refundPercentage);

    return json({ 
      success: true, 
      booking: {
        id: cancelledBooking.id,
        bookingNumber: cancelledBooking.bookingNumber,
        status: cancelledBooking.status,
        refundAmount,
        refundPercentage,
        refundPaymentId: refundPayment?.id,
      }
    });

  } catch (error) {
    console.error("Booking cancellation error:", error);
    return json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
