import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { getPendingReviewRequests } from "~/lib/review-requests.server";
import { prisma } from "~/lib/db/db.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface ReviewRequest {
  id: string;
  bookingId: string;
  bookingType: string;
  serviceId: string;
  serviceType: string;
  service: {
    id: string;
    title: string;
    images: string[];
  };
  expiresAt: string;
  requestedAt: string;
}

interface CompletedReview {
  id: string;
  rating: number;
  comment: string;
  service: {
    id: string;
    title: string;
    type: string;
  };
  createdAt: string;
}

interface LoaderData {
  pendingRequests: ReviewRequest[];
  completedReviews: CompletedReview[];
  stats: {
    totalReviews: number;
    averageRating: number;
    pendingCount: number;
  };
}

// ========================================
// LOADER
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);

    // Get pending review requests
    const pendingRequests = await getPendingReviewRequests(userId);

    // Get completed reviews
    const completedReviews = await prisma.review.findMany({
      where: {
        customerId: userId,
        isActive: true
      },
      include: {
        property: {
          select: { id: true, title: true }
        },
        vehicle: {
          select: { id: true, name: true }
        },
        tour: {
          select: { id: true, title: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Format completed reviews
    const formattedReviews: CompletedReview[] = completedReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      service: {
        id: review.property?.id || review.vehicle?.id || review.tour?.id || '',
        title: review.property?.title || review.vehicle?.name || review.tour?.title || '',
        type: review.property ? 'property' : review.vehicle ? 'vehicle' : 'tour'
      },
      createdAt: review.createdAt.toISOString()
    }));

    // Get user stats
    const userStats = await prisma.review.aggregate({
      where: {
        customerId: userId,
        isActive: true
      },
      _count: {
        id: true
      },
      _avg: {
        rating: true
      }
    });

    const stats = {
      totalReviews: userStats._count.id,
      averageRating: userStats._avg.rating || 0,
      pendingCount: pendingRequests.length
    };

    const loaderData: LoaderData = {
      pendingRequests,
      completedReviews: formattedReviews,
      stats
    };

    return json(loaderData);
  } catch (error) {
    console.error("Error in reviews loader:", error);
    throw new Response("Failed to load reviews data", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function ReviewsDashboard() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Reviews</h1>
            <p className="text-gray-600">Manage your reviews and feedback</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {data.stats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              Average rating
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Reviews Written</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.stats.pendingCount}</div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {data.stats.averageRating.toFixed(1)}★
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Review Requests */}
      {data.pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Review Requests</h3>
          <div className="space-y-4">
            {data.pendingRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {request.service.images && request.service.images.length > 0 && (
                      <img
                        src={request.service.images[0]}
                        alt={request.service.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{request.service.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {request.serviceType} • Booking #{request.bookingId.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Expires</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(request.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      to={`/booking/${request.bookingId}/review`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Write Review
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Reviews */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Reviews</h3>
        <div className="space-y-4">
          {data.completedReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">★</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{review.service.title}</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                  <div className="mt-1 text-xs text-gray-500 capitalize">
                    {review.service.type} • {review.rating} stars
                  </div>
                </div>
              </div>
            </div>
          ))}
          {data.completedReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No reviews written yet
            </div>
          )}
        </div>
      </div>

      {/* Empty State for Pending Requests */}
      {data.pendingRequests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
          <p className="text-gray-600">
            You don't have any pending review requests at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
