import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Star, ArrowLeft, MessageSquare, Calendar, MapPin } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    select: { id: true, name: true, role: true } 
  });
  
  if (!user || user.role !== "TOUR_GUIDE") {
    throw new Response("Access restricted to tour guides", { status: 403 });
  }

  const guide = await prisma.tourGuide.findUnique({ 
    where: { userId }, 
    select: { id: true, firstName: true, lastName: true, verified: true } 
  });
  
  if (!guide) {
    return json({ user, guide: null, reviews: [], error: "Tour guide profile not found" });
  }

  // Get reviews for tour guide's tours
  const reviews = await prisma.review.findMany({
    where: {
      tour: {
        guideId: guide.id
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        }
      },
      tour: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return json({ user, guide, reviews, averageRating, error: null });
}

export default function TourGuideReviews() {
  const { user, guide, reviews, averageRating, error } = useLoaderData<typeof loader>();

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
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">
            Reviews and ratings from customers who experienced your tours
          </p>
        </div>

        {/* Rating Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Overall Rating</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Reviews</div>
              <div className="text-3xl font-bold text-[#01502E]">{reviews.length}</div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              You don't have any reviews yet. Reviews will appear here once customers rate your tours.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {review.user.avatar ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={review.user.avatar}
                          alt={review.user.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#01502E] flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {review.user.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{review.user.name}</h3>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {review.tour.title}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      to={`/dashboard/messages`}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Reply
                    </Link>
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
