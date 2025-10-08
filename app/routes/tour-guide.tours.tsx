import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  MapPin
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Mock data - replace with actual database queries
  const tours = [
    {
      id: "1",
      title: "K2 Base Camp Trek - 15 Days Adventure",
      description: "Experience the ultimate trekking adventure to K2 Base Camp...",
      coverImage: "/k2.jpg",
      pricePerPerson: 2500,
      minGroupSize: 4,
      maxGroupSize: 12,
      duration: 360, // hours (15 days)
      difficulty: "Expert",
      location: "Skardu",
      isActive: true,
      isApproved: true,
      totalBookings: 45,
      totalEarnings: 112500,
      averageRating: 4.9,
      createdAt: "2025-01-15"
    },
    {
      id: "2",
      title: "Hunza Valley Cultural Tour",
      description: "Explore the rich culture and stunning beauty of Hunza Valley...",
      coverImage: "/hunza.jpg",
      pricePerPerson: 350,
      minGroupSize: 2,
      maxGroupSize: 8,
      duration: 8,
      difficulty: "Easy",
      location: "Hunza",
      isActive: true,
      isApproved: true,
      totalBookings: 128,
      totalEarnings: 44800,
      averageRating: 4.7,
      createdAt: "2024-11-20"
    },
    {
      id: "3",
      title: "Deosai Plains Jeep Safari",
      description: "Discover the Land of Giants with our exclusive jeep safari...",
      coverImage: "/deosai.jpg",
      pricePerPerson: 450,
      minGroupSize: 2,
      maxGroupSize: 6,
      duration: 10,
      difficulty: "Moderate",
      location: "Deosai",
      isActive: false,
      isApproved: false,
      totalBookings: 0,
      totalEarnings: 0,
      averageRating: 0,
      createdAt: "2025-10-05"
    }
  ];

  return json({ tours });
}

export default function TourManagement() {
  const { tours } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending">("all");

  const filteredTours = tours.filter(tour => {
    if (filter === "all") return true;
    if (filter === "active") return tour.isActive && tour.isApproved;
    if (filter === "inactive") return !tour.isActive;
    if (filter === "pending") return !tour.isApproved;
    return true;
  });

  const handleDuplicate = (tourId: string) => {
    // Logic to duplicate tour
    console.log("Duplicating tour:", tourId);
  };

  const handleDelete = (tourId: string) => {
    if (confirm("Are you sure you want to delete this tour?")) {
      // Logic to delete tour
      console.log("Deleting tour:", tourId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tours</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage your tour packages
            </p>
          </div>
          <Link
            to="/tour-guide/tours/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Tour
          </Link>
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
              All Tours ({tours.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "active"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active ({tours.filter(t => t.isActive && t.isApproved).length})
            </button>
            <button
              onClick={() => setFilter("inactive")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "inactive"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inactive ({tours.filter(t => !t.isActive).length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "pending"
                  ? "bg-[#01502E] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending Approval ({tours.filter(t => !t.isApproved).length})
            </button>
          </div>
        </div>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-sm mx-auto">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tours found</h3>
              <p className="text-gray-600 mb-6">
                {filter === "all" 
                  ? "Get started by creating your first tour package."
                  : `No ${filter} tours available.`}
              </p>
              {filter === "all" && (
                <Link
                  to="/tour-guide/tours/new"
                  className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Tour
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                {/* Tour Image */}
                <div className="relative h-48 bg-gray-200">
                  {tour.coverImage ? (
                    <img
                      src={tour.coverImage}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {tour.isApproved ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {!tour.isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Tour Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tour.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tour.description}</p>

                  {/* Tour Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                      PKR {tour.pricePerPerson}/person
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {tour.minGroupSize}-{tour.maxGroupSize} guests
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {tour.duration}h ({Math.ceil(tour.duration / 24)}d)
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {tour.location}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{tour.totalBookings}</div>
                      <div className="text-xs text-gray-500">Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {tour.averageRating > 0 ? tour.averageRating.toFixed(1) : "-"}
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {tour.totalEarnings > 0 ? `${(tour.totalEarnings / 1000).toFixed(0)}k` : "-"}
                      </div>
                      <div className="text-xs text-gray-500">Earnings</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      to={`/tour-guide/tours/${tour.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                    <Link
                      to={`/tour-guide/tours/${tour.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition text-sm font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(tour.id)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      title="Duplicate Tour"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tour.id)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete Tour"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

