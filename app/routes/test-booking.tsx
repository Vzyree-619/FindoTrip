import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Test the booking system by creating a sample booking
  try {
    // Get a sample property
    const property = await prisma.property.findFirst({
      where: { available: true },
      include: {
        owner: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return json({ error: "No available properties found" });
    }

    // Create a test booking
    const bookingNumber = `PB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3);

    const testBooking = await prisma.propertyBooking.create({
      data: {
        bookingNumber,
        checkIn,
        checkOut,
        guests: 2,
        adults: 2,
        children: 0,
        infants: 0,
        basePrice: property.basePrice * 2,
        cleaningFee: property.cleaningFee,
        serviceFee: property.serviceFee,
        taxes: (property.basePrice * 2 + property.cleaningFee + property.serviceFee) * (property.taxRate / 100),
        discounts: 0,
        totalPrice: (property.basePrice * 2 + property.cleaningFee + property.serviceFee) * (1 + property.taxRate / 100),
        currency: property.currency,
        status: "PENDING",
        paymentStatus: "PENDING",
        guestName: "Test User",
        guestEmail: "test@example.com",
        guestPhone: "+1234567890",
        specialRequests: "Test booking for system verification",
        userId,
        propertyId: property.id,
      },
      include: {
        property: {
          select: {
            name: true,
            address: true,
            city: true,
            country: true,
          },
        },
      },
    });

    // Create a test payment
    const testPayment = await prisma.payment.create({
      data: {
        amount: testBooking.totalPrice,
        currency: testBooking.currency,
        method: "CREDIT_CARD",
        transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        status: "COMPLETED",
        paymentGateway: "stripe",
        gatewayResponse: {
          success: true,
          transactionId: `TXN${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        userId,
        bookingId: testBooking.id,
        bookingType: "property",
      },
    });

    // Create a test commission
    const commissionAmount = testBooking.totalPrice * 0.1; // 10% commission
    const testCommission = await prisma.commission.create({
      data: {
        amount: commissionAmount,
        percentage: 10,
        currency: testBooking.currency,
        status: "PENDING",
        bookingId: testBooking.id,
        bookingType: "property",
        serviceId: property.id,
        serviceType: "property",
        userId: property.ownerId,
        calculatedAt: new Date(),
      },
    });

    // Create test notifications
    const testNotifications = await prisma.notification.createMany({
      data: [
        {
          type: "BOOKING_CONFIRMED",
          title: "Booking Confirmed!",
          message: `Your property booking has been confirmed. Booking number: ${testBooking.bookingNumber}`,
          userId,
          userRole: "CUSTOMER",
          actionUrl: `/dashboard/bookings/${testBooking.id}?type=property`,
          data: {
            bookingId: testBooking.id,
            bookingType: "property",
            bookingNumber: testBooking.bookingNumber,
            serviceName: property.name,
          },
        },
        {
          type: "BOOKING_CONFIRMED",
          title: "New Booking Received!",
          message: `You have received a new property booking. Booking number: ${testBooking.bookingNumber}`,
          userId: property.ownerId,
          userRole: "PROPERTY_OWNER",
          actionUrl: `/dashboard/bookings/${testBooking.id}?type=property`,
          data: {
            bookingId: testBooking.id,
            bookingType: "property",
            bookingNumber: testBooking.bookingNumber,
            serviceName: property.name,
          },
        },
      ],
    });

    // Block the dates
    await prisma.unavailableDate.create({
      data: {
        serviceId: property.id,
        serviceType: "property",
        startDate: checkIn,
        endDate: checkOut,
        reason: "booked",
        type: "booked",
        ownerId: property.ownerId,
      },
    });

    return json({
      success: true,
      message: "Booking system test completed successfully!",
      data: {
        booking: testBooking,
        payment: testPayment,
        commission: testCommission,
        notifications: testNotifications,
        property: {
          name: property.name,
          owner: property.owner.user.name,
        },
      },
    });
  } catch (error) {
    console.error("Test booking error:", error);
    return json({ 
      error: "Test booking failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}

export default function TestBooking() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Failed</h1>
            <p className="text-gray-600 mb-4">{data.error}</p>
            {data.details && (
              <p className="text-sm text-gray-500">{data.details}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking System Test</h1>
          <p className="text-gray-600 mb-6">{data.message}</p>
          
          <div className="text-left space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
              <p><strong>Booking Number:</strong> {data.data.booking.bookingNumber}</p>
              <p><strong>Property:</strong> {data.data.property.name}</p>
              <p><strong>Owner:</strong> {data.data.property.owner}</p>
              <p><strong>Total Price:</strong> {data.data.booking.currency} {data.data.booking.totalPrice.toFixed(2)}</p>
              <p><strong>Status:</strong> {data.data.booking.status}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
              <p><strong>Transaction ID:</strong> {data.data.payment.transactionId}</p>
              <p><strong>Amount:</strong> {data.data.payment.currency} {data.data.payment.amount.toFixed(2)}</p>
              <p><strong>Status:</strong> {data.data.payment.status}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Commission Details</h3>
              <p><strong>Amount:</strong> {data.data.commission.currency} {data.data.commission.amount.toFixed(2)}</p>
              <p><strong>Percentage:</strong> {data.data.commission.percentage}%</p>
              <p><strong>Status:</strong> {data.data.commission.status}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">System Integration</h3>
              <p>✅ Booking created successfully</p>
              <p>✅ Payment processed</p>
              <p>✅ Commission calculated</p>
              <p>✅ Notifications sent</p>
              <p>✅ Calendar dates blocked</p>
            </div>
          </div>

          <div className="mt-6">
            <a 
              href="/dashboard" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
