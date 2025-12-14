import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useNavigation, Outlet } from "@remix-run/react";
import { useState, useMemo, useCallback } from "react";
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
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Loader timeout")), 10000); // 10 second timeout
    });

    // Get all bookings with related data with limits to prevent performance issues
    const bookingsPromise = Promise.all([
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
        take: 100, // Limit to prevent performance issues
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
        take: 100, // Limit to prevent performance issues
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
        take: 100, // Limit to prevent performance issues
      }),
    ]);

    const [propertyBookings, vehicleBookings, tourBookings] = await Promise.race([
      bookingsPromise,
      timeoutPromise,
    ]) as any;

    // Get all payments for these bookings
    const allBookingIds = [
      ...propertyBookings.map((b: any) => b.id),
      ...vehicleBookings.map((b: any) => b.id),
      ...tourBookings.map((b: any) => b.id),
    ];
    
    // Get payments with timeout and limit
    const paymentsPromise = allBookingIds.length > 0
      ? prisma.payment.findMany({
          where: {
            bookingId: { in: allBookingIds },
          },
          orderBy: { createdAt: 'desc' },
          take: 200, // Limit to prevent performance issues
        })
      : Promise.resolve([]);
    
    const payments = await Promise.race([
      paymentsPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Payments timeout")), 5000)),
    ]).catch(() => []) as any;

    // Combine and transform to unified format
    const bookingsWithRelations = [
      ...propertyBookings.map((b: any) => ({
        ...b,
        type: 'property' as const,
        property: b.property,
        payments: payments.filter((p: any) => p.bookingId === b.id && p.bookingType === 'PROPERTY'),
        reviews: [],
      })),
      ...vehicleBookings.map((b: any) => ({
        ...b,
        type: 'vehicle' as const,
        vehicle: b.vehicle,
        payments: payments.filter((p: any) => p.bookingId === b.id && p.bookingType === 'VEHICLE'),
        reviews: [],
      })),
      ...tourBookings.map((b: any) => ({
        ...b,
        type: 'tour' as const,
        tour: b.tour,
        payments: payments.filter((p: any) => p.bookingId === b.id && p.bookingType === 'TOUR'),
        reviews: [],
      })),
    ];

    // Categorize bookings
    const now = new Date();
    
    const pending = bookingsWithRelations.filter((booking) => booking.status === "PENDING");
    
    const upcoming = bookingsWithRelations.filter((booking) => {
      if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
        let relevantDate: Date;
        if (booking.type === "property" && booking.checkIn) {
          relevantDate = new Date(booking.checkIn);
        } else if (booking.type === "vehicle" && booking.startDate) {
          relevantDate = new Date(booking.startDate);
        } else if (booking.type === "tour" && booking.tourDate) {
          relevantDate = new Date(booking.tourDate);
        } else {
          return false;
        }
        return relevantDate > now;
      }
      return false;
    });
    
    const past = bookingsWithRelations.filter((booking) => {
      if (booking.status === "COMPLETED") return true;
      if (booking.status !== "CONFIRMED") return false;
      
      let relevantDate: Date;
      if (booking.type === "property" && booking.checkOut) {
        relevantDate = new Date(booking.checkOut);
      } else if (booking.type === "vehicle" && booking.endDate) {
        relevantDate = new Date(booking.endDate);
      } else if (booking.type === "tour" && booking.tourDate) {
        relevantDate = new Date(booking.tourDate);
      } else {
        return false;
      }
      return relevantDate < now;
    });
    
    const cancelled = bookingsWithRelations.filter((booking) => booking.status === "CANCELLED");

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
        pending: [],
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
      return json({ 
        error: "Booking cancellation feature is being updated. Please contact support for assistance." 
      }, { status: 501 });
    } catch (error) {
      return json({ error: "Failed to cancel booking" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

// Memoized booking card component for performance
const BookingCard = ({ booking, onCancelClick }: { booking: any; onCancelClick: (id: string) => void }) => {
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

  const checkInDate = booking.checkIn || booking.startDate || booking.tourDate;
  const checkOutDate = booking.checkOut || booking.endDate || booking.tourDate;
  const now = new Date();

  const getStatusInfo = () => {
    if (booking.status === "CANCELLED") {
      return { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, label: "Cancelled" };
    }
    if (booking.status === "PENDING") {
      return { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" };
    }
    if (booking.status === "CONFIRMED") {
      const checkIn = new Date(checkInDate);
      if (checkIn > now) {
        return { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Calendar, label: "Upcoming" };
      }
      const checkOut = new Date(checkOutDate);
      if (checkOut > now) {
        return { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle, label: "Active" };
      }
    }
    if (booking.status === "COMPLETED") {
      return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: CheckCircle, label: "Completed" };
    }
    return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: AlertCircle, label: booking.status };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const canCancel = booking.status === "CONFIRMED" && new Date(checkInDate) > now;
  const canReview = (booking.status === "COMPLETED" || (booking.status === "CONFIRMED" && new Date(checkOutDate) < now)) &&
    (!booking.reviews || booking.reviews.length === 0);

  const paymentStatus = booking.paymentStatus === "PENDING" && (!booking.payments || booking.payments.length === 0)
    ? "Pay on property"
    : booking.paymentStatus === "COMPLETED" || (booking.payments && booking.payments.length > 0 && booking.payments[0].status === 'COMPLETED')
    ? "Total paid"
    : "Payment pending";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        {serviceImage && (
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
            <img
              src={serviceImage}
              alt={serviceName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                {serviceName}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{serviceLocation || 'Location not specified'}</span>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusInfo.color} flex-shrink-0`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-xs font-semibold">{statusInfo.label}</span>
            </div>
          </div>

          {/* Booking Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  {booking.type === 'property' ? 'Check-in' : booking.type === 'vehicle' ? 'Pickup' : 'Date'}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  {booking.type === 'property' ? 'Check-out' : booking.type === 'vehicle' ? 'Dropoff' : 'Date'}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  {booking.type === 'tour' ? 'Participants' : 'Guests'}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {booking.guests || booking.participants || 1}
                </div>
              </div>
            </div>
          </div>

          {/* Price and Booking Number */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Booking Number</div>
              <div className="font-mono text-sm font-semibold text-gray-700">
                {booking.bookingNumber}
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-[#01502E]">
                {booking.currency || 'PKR'} {booking.totalPrice?.toLocaleString() || booking.totalAmount?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {paymentStatus}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <Link
              to={`/dashboard/bookings/${booking.id}?type=${booking.type}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Link>

            {canReview && (
              <Link
                to={`/dashboard/reviews/write?bookingId=${booking.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] hover:bg-[#013d23] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Star className="w-4 h-4" />
                Write Review
              </Link>
            )}

            {canCancel && (
              <button
                onClick={() => onCancelClick(booking.id)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-blue-900 mb-1">Special Requests</div>
                  <p className="text-sm text-blue-700">{booking.specialRequests}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MyBookings() {
  const { bookings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);

  // Determine default tab - show first tab with bookings
  const defaultTab = useMemo(() => {
    if (bookings.upcoming.length > 0) return "upcoming";
    if (bookings.pending.length > 0) return "pending";
    if (bookings.past.length > 0) return "past";
    if (bookings.cancelled.length > 0) return "cancelled";
    return "upcoming"; // Default to upcoming even if empty
  }, [bookings]);

  const [activeTab, setActiveTab] = useState<"pending" | "upcoming" | "past" | "cancelled">(defaultTab);

  // Memoize tab counts
  const tabCounts = useMemo(() => ({
    pending: bookings.pending.length,
    upcoming: bookings.upcoming.length,
    past: bookings.past.length,
    cancelled: bookings.cancelled.length,
  }), [bookings]);

  // Memoize active bookings
  const activeBookings = useMemo(() => {
    return bookings[activeTab] || [];
  }, [bookings, activeTab]);

  const handleCancelClick = useCallback((id: string) => {
    setCancellingBooking(id);
  }, []);

  const isLoading = navigation.state === "loading";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all your reservations in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Upcoming</div>
                <div className="text-2xl font-bold text-gray-900">{tabCounts.upcoming}</div>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-gray-900">{tabCounts.pending}</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Past</div>
                <div className="text-2xl font-bold text-gray-900">{tabCounts.past}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Cancelled</div>
                <div className="text-2xl font-bold text-gray-900">{tabCounts.cancelled}</div>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{actionData.message}</p>
            </div>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{actionData.error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <nav className="flex space-x-1">
            {[
              { key: "upcoming", label: "Upcoming", icon: Calendar },
              { key: "pending", label: "Pending", icon: Clock },
              { key: "past", label: "Past", icon: CheckCircle },
              { key: "cancelled", label: "Cancelled", icon: XCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const count = tabCounts[tab.key as keyof typeof tabCounts];
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                    isActive
                      ? "bg-[#01502E] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#01502E] animate-spin" />
          </div>
        )}

        {/* Bookings List */}
        {!isLoading && (
          <div className="space-y-4">
            {activeBookings.length > 0 ? (
              activeBookings.map((booking: any) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelClick={handleCancelClick}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {activeTab} bookings
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {activeTab === "pending"
                    ? "You don't have any pending bookings at the moment."
                    : activeTab === "upcoming" 
                    ? "You don't have any upcoming trips. Start planning your next adventure!"
                    : activeTab === "past"
                    ? "You haven't completed any trips yet. Your travel history will appear here."
                    : "You don't have any cancelled bookings."}
                </p>
                {activeTab === "upcoming" && (
                  <Link
                    to="/accommodations"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#01502E] hover:bg-[#013d23] text-white rounded-lg font-medium transition-colors"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Explore Properties
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cancel Booking Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this booking? This action cannot be undone and may be subject to cancellation fees.
              </p>
              <div className="flex gap-3">
                <Form method="post" className="flex-1">
                  <input type="hidden" name="intent" value="cancel" />
                  <input type="hidden" name="bookingId" value={cancellingBooking} />
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Yes, Cancel Booking
                  </button>
                </Form>
                <button
                  onClick={() => setCancellingBooking(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render child route (booking details) */}
        <Outlet />
      </div>
    </div>
  );
}
