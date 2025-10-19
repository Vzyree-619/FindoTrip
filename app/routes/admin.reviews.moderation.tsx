import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  Star, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  Calendar,
  StarIcon,
  Shield,
  Ban,
  Check,
  X
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const rating = url.searchParams.get("rating") || "all";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause for review filtering
  let whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (status !== "all") {
    if (status === "pending") {
      whereClause.flagged = false;
      whereClause.moderatedAt = null;
    } else if (status === "approved") {
      whereClause.flagged = false;
      whereClause.moderatedAt = { not: null };
    } else if (status === "flagged") {
      whereClause.flagged = true;
    }
  }

  if (rating !== "all") {
    whereClause.rating = parseInt(rating);
  }

  // Get reviews with pagination
  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            verified: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true
          }
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true
          }
        },
        tour: {
          select: {
            id: true,
            title: true,
            city: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.review.count({ where: whereClause })
  ]);

  // Get review statistics
  const [
    totalReviews,
    pendingReviews,
    approvedReviews,
    flaggedReviews,
    averageRating,
    recentReviews
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { flagged: false, moderatedAt: null } }),
    prisma.review.count({ where: { flagged: false, moderatedAt: { not: null } } }),
    prisma.review.count({ where: { flagged: true } }),
    prisma.review.aggregate({
      _avg: { rating: true }
    }),
    prisma.review.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get rating distribution
  const ratingDistribution = await Promise.all([
    prisma.review.count({ where: { rating: 1 } }),
    prisma.review.count({ where: { rating: 2 } }),
    prisma.review.count({ where: { rating: 3 } }),
    prisma.review.count({ where: { rating: 4 } }),
    prisma.review.count({ where: { rating: 5 } })
  ]);

  return json({
    admin,
    reviews,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    search,
    status,
    rating,
    stats: {
      totalReviews,
      pendingReviews,
      approvedReviews,
      flaggedReviews,
      averageRating: averageRating._avg.rating || 0,
      recentReviews
    },
    ratingDistribution
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const reviewId = formData.get('reviewId') as string;
  const reason = formData.get('reason') as string;

  try {
    switch (action) {
      case 'approve_review':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: false,
            flagReason: null,
            moderatedAt: new Date(),
            moderatedBy: admin.id
          }
        });
        return json({ success: true, message: 'Review approved successfully' });

      case 'reject_review':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: true,
            flagReason: reason,
            moderatedAt: new Date(),
            moderatedBy: admin.id
          }
        });
        return json({ success: true, message: 'Review rejected successfully' });

      case 'flag_review':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: true,
            flagReason: reason,
            flaggedAt: new Date(),
            flaggedBy: admin.id
          }
        });
        return json({ success: true, message: 'Review flagged successfully' });

      case 'unflag_review':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: false,
            flagReason: null,
            flaggedAt: null,
            flaggedBy: null
          }
        });
        return json({ success: true, message: 'Review unflagged successfully' });

      case 'delete_review':
        await prisma.review.delete({
          where: { id: reviewId }
        });
        return json({ success: true, message: 'Review deleted successfully' });

      default:
        return json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Review moderation error:', error);
    return json({ success: false, message: 'Failed to process review action' }, { status: 500 });
  }
}

export default function ReviewModeration() {
  const { 
    admin, 
    reviews, 
    totalCount, 
    currentPage, 
    totalPages, 
    search, 
    status, 
    rating, 
    stats, 
    ratingDistribution 
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusColor = (review: any) => {
    if (review.flagged) return 'bg-red-100 text-red-800';
    if (review.moderatedAt) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (review: any) => {
    if (review.flagged) return 'Flagged';
    if (review.moderatedAt) return 'Approved';
    return 'Pending';
  };

  const getServiceInfo = (review: any) => {
    if (review.property) {
      return {
        type: 'Property',
        name: review.property.name,
        location: review.property.city,
        details: review.property.type
      };
    } else if (review.vehicle) {
      return {
        type: 'Vehicle',
        name: `${review.vehicle.brand} ${review.vehicle.model}`,
        location: 'Vehicle',
        details: review.vehicle.year
      };
    } else if (review.tour) {
      return {
        type: 'Tour',
        name: review.tour.title,
        location: review.tour.city,
        details: review.tour.type
      };
    }
    return { type: 'Unknown', name: 'Unknown', location: 'Unknown', details: 'Unknown' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 mr-3" />
                Review Moderation
              </h1>
              <p className="text-gray-600 mt-2">
                Moderate and manage user reviews across the platform
              </p>
            </div>
          </div>
        </div>

        {/* Action Feedback */}
        {actionData && (
          <div className={`mb-6 p-4 rounded-md ${
            actionData.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {actionData.message}
          </div>
        )}

        {/* Review Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedReviews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Flagged</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.flaggedReviews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search reviews..."
                    defaultValue={search}
                    className="pl-10"
                    name="search"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  name="status"
                  defaultValue={status}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>
                <select
                  name="rating"
                  defaultValue={rating}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
                <Button type="submit" variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => {
            const serviceInfo = getServiceInfo(review);
            return (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{review.user.name}</h3>
                          <Badge className={getStatusColor(review)}>
                            {getStatusText(review)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            {getRatingStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.rating} star{review.rating !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{review.content}</p>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">{serviceInfo.type}:</span> {serviceInfo.name} • {serviceInfo.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!review.moderatedAt && (
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="approve_review" />
                          <input type="hidden" name="reviewId" value={review.id} />
                          <Button size="sm" variant="outline" type="submit">
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </Form>
                      )}
                      {!review.flagged && (
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="flag_review" />
                          <input type="hidden" name="reviewId" value={review.id} />
                          <input type="hidden" name="reason" value="Inappropriate content" />
                          <Button size="sm" variant="outline" type="submit">
                            <Flag className="w-4 h-4 mr-1" />
                            Flag
                          </Button>
                        </Form>
                      )}
                      {review.flagged && (
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="unflag_review" />
                          <input type="hidden" name="reviewId" value={review.id} />
                          <Button size="sm" variant="outline" type="submit">
                            <X className="w-4 h-4 mr-1" />
                            Unflag
                          </Button>
                        </Form>
                      )}
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="delete_review" />
                        <input type="hidden" name="reviewId" value={review.id} />
                        <Button size="sm" variant="outline" type="submit" className="text-red-600 border-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </Form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const url = new URL(window.location);
                    url.searchParams.set('page', pageNum.toString());
                    window.location.href = url.toString();
                  }}
                >
                  {pageNum}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* No Reviews Found */}
        {reviews.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
              <p className="text-gray-500 mb-4">
                {search || status !== "all" || rating !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No reviews have been submitted yet."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
