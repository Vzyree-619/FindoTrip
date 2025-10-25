import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { 
  Calendar,
  Users,
  MessageSquare,
  Check,
  X,
  Clock,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    console.log("Tour guide bookings loader - User ID:", userId);
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { id: true, name: true, role: true } 
    });
    
    if (!user || user.role !== "TOUR_GUIDE") {
      console.log("User not found or not a tour guide, throwing 403");
      throw new Response("Access restricted to tour guides", { status: 403 });
    }

    console.log("User found:", user.name, "Role:", user.role);

    const guide = await prisma.tourGuide.findUnique({ 
      where: { userId }, 
      select: { id: true, firstName: true, lastName: true, verified: true } 
    });
    
    if (!guide) {
      console.log("Tour guide profile not found for user:", userId);
      return json({ user, guide: null, bookings: [], error: "Tour guide profile not found" });
    }

    console.log("Tour guide found:", guide.firstName, guide.lastName);

  // Get tour guide's bookings
  const bookings = await prisma.tourBooking.findMany({
    where: { 
      tour: { guideId: guide.id }
    },
    include: {
      tour: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          pricePerPerson: true,
          duration: true,
          images: true,
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

    console.log("Bookings loader completed successfully");
    return json({ user, guide, bookings, error: null });
  } catch (error) {
    console.error("Error in tour guide bookings loader:", error);
    return json({ 
      user: null, 
      guide: null, 
      bookings: [], 
      error: "Failed to load bookings data" 
    });
  }
}

export default function TourGuideBookings() {
  const { user, guide, bookings, error } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-md">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === "all") return true;
    return booking.status.toLowerCase() === filter;
  });

  // Categorize bookings
  const now = new Date();
  const upcomingBookings = bookings.filter((booking) => {
    if (booking.status !== "CONFIRMED") return false;
    const tourDate = new Date(booking.tourDate);
    return tourDate > now;
  });
  
  const pastBookings = bookings.filter((booking) => {
    if (booking.status === "COMPLETED") return true;
    if (booking.status !== "CONFIRMED") return false;
    const tourDate = new Date(booking.tourDate);
    return tourDate < now;
  });
  
  const cancelledBookings = bookings.filter((booking) => booking.status === "CANCELLED");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-[#01502E]/10 text-[#01502E]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard/guide" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Tour Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage bookings for your tours - customers who booked your services
          </p>
        </div>

        {/* Booking Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Past</p>
                <p className="text-2xl font-bold text-gray-900">{pastBookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledBookings.length}</p>
              </div>
            </div>
          </div>
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
                ? "You don't have any bookings yet. Once customers book your tours, they'll appear here."
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
                          <h3 className="text-lg font-semibold text-gray-900">{booking.tour.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
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
                            <span className="h-4 w-4 mr-2 text-gray-400">PKR</span>
                          PKR {booking.totalPrice.toLocaleString()}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.user.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.user.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.user.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.tour.city}, {booking.tour.country}
                          </div>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="mt-4 p-3 bg-[#01502E]/10 border border-[#01502E]/20 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-[#01502E] mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-[#013d23]">Special Request:</p>
                              <p className="text-sm text-[#01502E] mt-1">{booking.specialRequests}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-2 min-w-[180px]">
                      <Link
                        to={`/dashboard/messages`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Customer
                      </Link>
                      <Link
                        to={`/tours/${booking.tour.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                      >
                        View Tour Details
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
