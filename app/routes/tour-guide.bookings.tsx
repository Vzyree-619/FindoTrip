import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  Calendar,
  Users,
  MessageSquare,
  Check,
  X,
  Clock,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Mock data - replace with actual database queries
  const bookings = [
    {
      id: "1",
      tourTitle: "K2 Base Camp Trek - 15 Days",
      tourDate: "2025-11-15",
      numberOfGuests: 6,
      totalPrice: 15000,
      status: "PENDING",
      paymentStatus: "PENDING",
      customerName: "Ahmed Khan",
      customerEmail: "ahmed@example.com",
      customerPhone: "+92 300 1234567",
      specialRequests: "Need vegetarian meals for 2 guests",
      unreadMessages: 2,
      createdAt: "2025-10-01",
      guests: [
        { name: "Ahmed Khan", email: "ahmed@example.com", phone: "+92 300 1234567" },
        { name: "Sarah Khan", email: "sarah@example.com", phone: "+92 300 7654321" }
      ]
    },
    {
      id: "2",
      tourTitle: "Hunza Valley Cultural Tour",
      tourDate: "2025-10-20",
      numberOfGuests: 4,
      totalPrice: 1400,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      customerName: "John Smith",
      customerEmail: "john@example.com",
      customerPhone: "+1 234 567 8900",
      specialRequests: "",
      unreadMessages: 0,
      createdAt: "2025-09-25",
      guests: [
        { name: "John Smith", email: "john@example.com", phone: "+1 234 567 8900" }
      ]
    },
    {
      id: "3",
      tourTitle: "Deosai Plains Safari",
      tourDate: "2025-10-18",
      numberOfGuests: 8,
      totalPrice: 2800,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      customerName: "Maria Garcia",
      customerEmail: "maria@example.com",
      customerPhone: "+34 600 123 456",
      specialRequests: "Pickup from Skardu airport required",
      unreadMessages: 1,
      createdAt: "2025-09-20",
      guests: [
        { name: "Maria Garcia", email: "maria@example.com", phone: "+34 600 123 456" }
      ]
    }
  ];

  return json({ bookings });
}

export default function BookingManagement() {
  const { bookings } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const filteredBookings = bookings.filter(booking => {
    if (filter === "all") return true;
    return booking.status.toLowerCase() === filter;
  });

  const handleAccept = (bookingId: string) => {
    console.log("Accepting booking:", bookingId);
    // Logic to accept booking
  };

  const handleReject = (bookingId: string) => {
    if (confirm("Are you sure you want to reject this booking?")) {
      console.log("Rejecting booking:", bookingId);
      // Logic to reject booking
    }
  };

  const handleCancel = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      console.log("Cancelling booking:", bookingId);
      // Logic to cancel booking
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your tour bookings and communicate with guests
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "all"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "pending"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending ({bookings.filter(b => b.status === "PENDING").length})
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "confirmed"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Confirmed ({bookings.filter(b => b.status === "CONFIRMED").length})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "completed"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed ({bookings.filter(b => b.status === "COMPLETED").length})
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "cancelled"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancelled ({bookings.filter(b => b.status === "CANCELLED").length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {filter === "all" 
                ? "You don't have any bookings yet."
                : `No ${filter} bookings available.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{booking.tourTitle}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                              {booking.paymentStatus}
                            </span>
                            {booking.unreadMessages > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {booking.unreadMessages} new
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(booking.tourDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          PKR {booking.totalPrice.toLocaleString()}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.customerName}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.customerEmail}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.customerPhone}
                          </div>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Special Request:</p>
                              <p className="text-sm text-blue-700 mt-1">{booking.specialRequests}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-2 min-w-[180px]">
                      {booking.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleAccept(booking.id)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(booking.id)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Booking
                        </button>
                      )}
                      <Link
                        to={`/tour-guide/bookings/${booking.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/tour-guide/bookings/${booking.id}/messages`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                        {booking.unreadMessages > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {booking.unreadMessages}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

