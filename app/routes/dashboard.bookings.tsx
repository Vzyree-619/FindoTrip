import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react";
import { useState } from "react";
import { requireUserId } from "~/lib/auth/auth.server";
import { getUserBookings } from "~/lib/utils/bookings.server";
import { prisma } from "~/lib/db/db.server";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Eye,
  X,
  MessageSquare,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  try {
    // Get all bookings with related data
    const [propertyBookings, vehicleBookings, tourBookings] = await Promise.all([
      prisma.propertyBooking.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicleBooking.findMany({
        where: { userId },
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tourBooking.findMany({
        where: { userId },
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Get all payments for these bookings
    const allBookingIds = [
      ...propertyBookings.map(b => b.id),
      ...vehicleBookings.map(b => b.id),
      ...tourBookings.map(b => b.id),
    ];
    
    const payments = await prisma.payment.findMany({
      where: {
        bookingId: { in: allBookingIds },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine and transform to unified format
    const bookingsWithRelations = [
      ...propertyBookings.map(b => ({
        ...b,
        type: 'property' as const,
        accommodation: b.property,
        accommodationId: b.propertyId,
        payments: payments.filter(p => p.bookingId === b.id && p.bookingType === 'PROPERTY'),
        reviews: [],
      })),
      ...vehicleBookings.map(b => ({
        ...b,
        type: 'vehicle' as const,
        accommodation: null,
        accommodationId: null,
        payments: payments.filter(p => p.bookingId === b.id && p.bookingType === 'VEHICLE'),
        reviews: [],
      })),
      ...tourBookings.map(b => ({
        ...b,
        type: 'tour' as const,
        accommodation: null,
        accommodationId: null,
        payments: payments.filter(p => p.bookingId === b.id && p.bookingType === 'TOUR'),
        reviews: [],
      })),
    ];

    // Categorize bookings
    const now = new Date();
    
    // PENDING bookings - show all pending bookings
    const pending = bookingsWithRelations.filter((booking) => booking.status === "PENDING");
    
    const upcoming = bookingsWithRelations.filter((booking) => {
      if (booking.status !== "CONFIRMED") return false;
      
      // Get the relevant date based on booking type
      let relevantDate: Date;
      if (booking.type === "property" && booking.checkIn) {
        relevantDate = new Date(booking.checkIn);
      } else if (booking.type === "vehicle" && booking.startDate) {
        relevantDate = new Date(booking.startDate);
      } else if (booking.type === "tour" && booking.tourDate) {
        relevantDate = new Date(booking.tourDate);
      } else {
        return false; // No relevant date found
      }
      
      return relevantDate > now;
    });
    
    const past = bookingsWithRelations.filter((booking) => {
      if (booking.status === "COMPLETED") return true;
      if (booking.status !== "CONFIRMED") return false;
      
      // Get the relevant end date based on booking type
      let relevantDate: Date;
      if (booking.type === "property" && booking.checkOut) {
        relevantDate = new Date(booking.checkOut);
      } else if (booking.type === "vehicle" && booking.endDate) {
        relevantDate = new Date(booking.endDate);
      } else if (booking.type === "tour" && booking.tourDate) {
        relevantDate = new Date(booking.tourDate);
      } else {
        return false; // No relevant date found
      }
      
      return relevantDate < now;
    });
    
    const cancelled = bookingsWithRelations.filter((booking) => booking.status === "CANCELLED");

    console.log("Pending bookings:", pending.length);
    console.log("Upcoming bookings:", upcoming.length);
    console.log("Past bookings:", past.length);
    console.log("Cancelled bookings:", cancelled.length);
    console.log("All bookings:", bookingsWithRelations.length);

    return json({
      bookings: {
        pending,
        upcoming,
        past,
        cancelled,
        all: bookingsWithRelations,
      },
    });
  } catch (error) {
    console.error("Error in bookings loader:", error);
    return json({
      bookings: {
        upcoming: [],
        past: [],
        cancelled: [],
        all: [],
      },
      error: "Failed to load bookings"
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const bookingId = formData.get("bookingId") as string;
  const bookingType = formData.get("bookingType") as string;

  if (intent === "cancel") {
    try {
      // TODO: Implement cancellation logic for different booking types
      // For now, return a message that the feature is coming soon
      return json({ 
        error: "Booking cancellation feature is being updated. Please contact support for assistance." 
      }, { status: 501 });

    } catch (error) {
      return json({ error: "Failed to cancel booking" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function MyBookings() {
  const { bookings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [activeTab, setActiveTab] = useState<"pending" | "upcoming" | "past" | "cancelled">("pending");
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);

  const getStatusBadge = (status: string, checkIn: string, checkOut: string) => {
    const now = new Date();
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (status === "CANCELLED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      );
    }

    if (status === "CONFIRMED") {
      if (checkInDate > now) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </span>
        );
      } else if (checkOutDate > now) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      }
    }

    if (status === "COMPLETED" || (status === "CONFIRMED" && checkOutDate < now)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const canCancel = (booking: any) => {
    const now = new Date();
    const checkInDate = new Date(booking.checkIn || booking.startDate || booking.tourDate);
    return booking.status === "CONFIRMED" && checkInDate > now;
  };

  const canReview = (booking: any) => {
    const now = new Date();
    const checkOutDate = new Date(booking.checkOut || booking.endDate || booking.tourDate);
    return (
      (booking.status === "COMPLETED" || 
       (booking.status === "CONFIRMED" && checkOutDate < now)) &&
      (!booking.reviews || booking.reviews.length === 0)
    );
  };

  const renderBookingCard = (booking: any) => {
    // Get service name based on booking type
    const serviceName = booking.type === 'property' 
      ? booking.property?.name || 'Property'
      : booking.type === 'vehicle'
      ? `${booking.vehicle?.brand || ''} ${booking.vehicle?.model || ''} ${booking.vehicle?.year || ''}`.trim() || 'Vehicle'
      : booking.tour?.title || 'Tour';
    
    const serviceLocation = booking.type === 'property'
      ? `${booking.property?.city || ''}, ${booking.property?.country || ''}`.trim()
      : booking.type === 'vehicle'
      ? booking.pickupLocation || 'Location TBD'
      : `${booking.tour?.city || ''}, ${booking.tour?.country || ''}`.trim();
    
    const serviceImage = booking.type === 'property'
      ? booking.property?.images?.[0]
      : booking.type === 'vehicle'
      ? booking.vehicle?.images?.[0]
      : booking.tour?.images?.[0];

    return (
    <div key={booking.id} className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {serviceName}
              </h3>
              {getStatusBadge(booking.status, booking.checkIn || booking.startDate || booking.tourDate, booking.checkOut || booking.endDate || booking.tourDate)}
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {serviceLocation}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{booking.type === 'property' ? 'Check-in' : booking.type === 'vehicle' ? 'Pickup' : 'Date'}</div>
                  <div>{new Date(booking.checkIn || booking.startDate || booking.tourDate).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{booking.type === 'property' ? 'Check-out' : booking.type === 'vehicle' ? 'Dropoff' : 'Date'}</div>
                  <div>{new Date(booking.checkOut || booking.endDate || booking.tourDate).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{booking.type === 'tour' ? 'Participants' : 'Guests'}</div>
                  <div>{booking.guests || booking.participants || 1}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Booking Number:</span>
                  <span className="ml-2 font-mono text-sm font-medium">
                    {booking.bookingNumber}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#01502E]">
                    {booking.currency || 'PKR'} {booking.totalPrice?.toLocaleString() || booking.totalAmount?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.paymentStatus === "PENDING" && (!booking.payments || booking.payments.length === 0)
                      ? "Pay on property"
                      : booking.paymentStatus === "COMPLETED" || (booking.payments && booking.payments.length > 0 && booking.payments[0].status === 'COMPLETED')
                      ? "Total paid"
                      : booking.paymentStatus === "PENDING"
                      ? "Payment pending"
                      : "Payment pending"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {serviceImage && (
            <div className="ml-6 flex-shrink-0">
              <img
                className="h-20 w-20 object-cover rounded-lg"
                src={serviceImage}
                alt={serviceName}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to={`/dashboard/bookings/${booking.id}?type=${booking.type}`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Link>

          {canReview(booking) && (
            <Link
              to={`/dashboard/reviews/write?bookingId=${booking.id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23]"
            >
              <Star className="w-4 h-4 mr-1" />
              Write Review
            </Link>
          )}

          {canCancel(booking) && (
            <button
              onClick={() => setCancellingBooking(booking.id)}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
          )}
        </div>

        {booking.specialRequests && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-start">
              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Special Requests</h4>
                <p className="text-sm text-blue-700 mt-1">{booking.specialRequests}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your current and past reservations
          </p>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {actionData.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {actionData.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: "pending", label: "Pending", count: bookings.pending?.length || 0 },
              { key: "upcoming", label: "Upcoming", count: bookings.upcoming.length },
              { key: "past", label: "Past", count: bookings.past.length },
              { key: "cancelled", label: "Cancelled", count: bookings.cancelled.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-[#01502E] text-[#01502E]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {bookings[activeTab] && bookings[activeTab].length > 0 ? (
            bookings[activeTab].map(renderBookingCard)
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} bookings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "pending"
                  ? "You don't have any pending bookings."
                  : activeTab === "upcoming" 
                  ? "You don't have any upcoming trips."
                  : activeTab === "past"
                  ? "You haven't completed any trips yet."
                  : "You don't have any cancelled bookings."
                }
              </p>
              {activeTab === "upcoming" && (
                <div className="mt-6">
                  <Link
                    to="/accommodations"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23]"
                  >
                    Book a Stay
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cancel Booking Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Cancel Booking
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Form method="post" className="flex-1">
                    <input type="hidden" name="intent" value="cancel" />
                    <input type="hidden" name="bookingId" value={cancellingBooking} />
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                    >
                      Yes, Cancel Booking
                    </button>
                  </Form>
                  <button
                    onClick={() => setCancellingBooking(null)}
                    className="flex-1 inline-flex justify-center px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300"
                  >
                    Keep Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
