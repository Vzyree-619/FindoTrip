import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { validateSchema, createBookingSchema } from "~/lib/validations/validation.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    
    const bookingData = {
      accommodationId: formData.get("accommodationId") as string,
      checkIn: new Date(formData.get("checkIn") as string),
      checkOut: new Date(formData.get("checkOut") as string),
      guests: parseInt(formData.get("guests") as string),
      totalPrice: parseFloat(formData.get("totalPrice") as string),
      specialRequests: formData.get("specialRequests") as string || undefined,
    };

    // Validate booking data
    const validation = validateSchema(createBookingSchema, bookingData);
    if (!validation.success) {
      return json({ error: "Invalid booking data", errors: validation.errors }, { status: 400 });
    }

    // Check accommodation availability
    const accommodation = await prisma.accommodation.findUnique({
      where: { id: bookingData.accommodationId },
    });

    if (!accommodation) {
      return json({ error: "Accommodation not found" }, { status: 404 });
    }

    if (!accommodation.available) {
      return json({ error: "Accommodation is not available" }, { status: 400 });
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        accommodationId: bookingData.accommodationId,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            checkIn: { lte: bookingData.checkOut },
            checkOut: { gte: bookingData.checkIn },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return json({ error: "Accommodation is not available for selected dates" }, { status: 400 });
    }

    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId,
        accommodationId: bookingData.accommodationId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        totalPrice: bookingData.totalPrice,
        specialRequests: bookingData.specialRequests,
        status: "PENDING",
      },
      include: {
        accommodation: true,
        user: true,
      },
    });

    return json({ 
      success: true, 
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
      }
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    return json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// Handle GET requests (not allowed)
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
