import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  Calendar, 
  DollarSign, 
  Star, 
  Users, 
  TrendingUp, 
  MapPin,
  Clock,
  Award,
  AlertCircle
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Mock data - replace with actual database queries
  const stats = {
    totalEarnings: 12450.50,
    monthlyEarnings: 3250.00,
    upcomingTours: 8,
    completedTours: 156,
    averageRating: 4.8,
    totalReviews: 142,
    activeBookings: 12,
    pendingBookings: 5
  };

  const upcomingTours = [
    {
      id: "1",
      title: "K2 Base Camp Trek",
      date: "2025-10-15",
      time: "06:00 AM",
      guests: 6,
      location: "Skardu",
      price: 450,
      status: "confirmed"
    },
    {
      id: "2",
      title: "Hunza Valley Cultural Tour",
      date: "2025-10-18",
      time: "09:00 AM",
      guests: 4,
      location: "Hunza",
      price: 200,
      status: "confirmed"
    },
    {
      id: "3",
      title: "Deosai Plains Safari",
      date: "2025-10-20",
      time: "07:00 AM",
      guests: 8,
      location: "Deosai",
      price: 350,
      status: "pending"
    }
  ];

  const recentReviews = [
    {
      id: "1",
      tourTitle: "Fairy Meadows Trek",
      rating: 5,
      comment: "Amazing experience! The guide was knowledgeable and friendly.",
      guestName: "John Doe",
      date: "2025-10-05"
    },
    {
      id: "2",
      tourTitle: "Skardu City Tour",
      rating: 4,
      comment: "Great tour, learned a lot about the local culture.",
      guestName: "Jane Smith",
      date: "2025-10-03"
    }
  ];

  const earnings = {
    thisWeek: 850,
    lastWeek: 720,
    thisMonth: 3250,
    lastMonth: 2980
  };

  return json({ stats, upcomingTours, recentReviews, earnings });
}

export default function TourGuideDashboard() {
  const { stats, upcomingTours, recentReviews, earnings } = useLoaderData<typeof loader>();

  const earningsChange = ((earnings.thisWeek - earnings.lastWeek) / earnings.lastWeek * 100).toFixed(1);
  const monthlyChange = ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tour Guide Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Here's an overview of your tour guide business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  PKR {stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{monthlyChange}% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Tours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingTours}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.pendingBookings} pending confirmation</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageRating}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalReviews} reviews</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedTours}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{earningsChange}% this week
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Tours */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Tours</h2>
                <Link
                  to="/tour-guide/bookings"
                  className="text-sm text-[#01502E] hover:text-[#013d23] font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingTours.map((tour) => (
                  <div key={tour.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{tour.title}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(tour.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })} at {tour.time}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {tour.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {tour.guests} guests
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-gray-900">PKR {tour.price}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                          tour.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tour.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01502E]">98%</div>
                  <div className="text-xs text-gray-600 mt-1">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01502E]">4.8</div>
                  <div className="text-xs text-gray-600 mt-1">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01502E]">92%</div>
                  <div className="text-xs text-gray-600 mt-1">Response Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01502E]">156</div>
                  <div className="text-xs text-gray-600 mt-1">Total Tours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/tour-guide/tours/new"
                  className="block w-full px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition text-center font-medium"
                >
                  Create New Tour
                </Link>
                <Link
                  to="/tour-guide/schedule"
                  className="block w-full px-4 py-2 border border-[#01502E] text-[#01502E] rounded-lg hover:bg-gray-50 transition text-center font-medium"
                >
                  Update Availability
                </Link>
                <Link
                  to="/tour-guide/tours"
                  className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center font-medium"
                >
                  Manage Tours
                </Link>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">{review.rating}.0</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{review.comment}</p>
                    <p className="text-xs text-gray-500">
                      {review.guestName} • {review.tourTitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert/Notification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Complete Your Profile</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Add certifications to increase bookings by up to 40%.
                  </p>
                  <Link
                    to="/tour-guide/profile"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    Update Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

