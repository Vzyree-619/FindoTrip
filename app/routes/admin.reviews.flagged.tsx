import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  Shield,
  Ban,
  Check,
  X,
  User,
  Calendar,
  StarIcon,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const reason = url.searchParams.get("reason") || "all";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause for flagged reviews
  let whereClause: any = {
    flagged: true
  };
  
  if (search) {
    whereClause.OR = [
      { comment: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { reviewerName: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (reason !== "all") {
    whereClause.flagReason = { contains: reason, mode: 'insensitive' };
  }

  // Get flagged reviews with pagination
  const [flaggedReviews, totalCount] = await Promise.all([
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
      orderBy: { flaggedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.review.count({ where: whereClause })
  ]);

  // Get flagged review statistics
  const [
    totalFlagged,
    recentFlagged,
    flagReasons,
    averageRating
  ] = await Promise.all([
    prisma.review.count({ where: { flagged: true } }),
    prisma.review.count({
      where: {
        flagged: true,
        flaggedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.review.groupBy({
      by: ['flagReason'],
      where: { flagged: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.review.aggregate({
      where: { flagged: true },
      _avg: { rating: true }
    })
  ]);

  // Get rating distribution for flagged reviews
  const ratingDistribution = await Promise.all([
    prisma.review.count({ where: { flagged: true, rating: 1 } }),
    prisma.review.count({ where: { flagged: true, rating: 2 } }),
    prisma.review.count({ where: { flagged: true, rating: 3 } }),
    prisma.review.count({ where: { flagged: true, rating: 4 } }),
    prisma.review.count({ where: { flagged: true, rating: 5 } })
  ]);

  return json({
    admin,
    flaggedReviews,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    search,
    reason,
    stats: {
      totalFlagged,
      recentFlagged,
      averageRating: averageRating._avg.rating || 0
    },
    flagReasons,
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
      case 'approve_flagged':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: false,
            flagReason: null,
            moderatedAt: new Date(),
            moderatedBy: admin.id
          }
        });
        return json({ success: true, message: 'Flagged review approved successfully' });

      case 'reject_flagged':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: true,
            flagReason: reason || 'Inappropriate content',
            moderatedAt: new Date(),
            moderatedBy: admin.id
          }
        });
        return json({ success: true, message: 'Flagged review rejected successfully' });

      case 'unflag_review':
        await prisma.review.update({
          where: { id: reviewId },
          data: { 
            flagged: false,
            flagReason: null,
            moderatedAt: new Date(),
            moderatedBy: admin.id
          }
        });
        return json({ success: true, message: 'Review unflagged successfully' });

      case 'delete_flagged':
        await prisma.review.delete({
          where: { id: reviewId }
        });
        return json({ success: true, message: 'Flagged review deleted successfully' });

      case 'bulk_approve':
        const approveIds = formData.getAll('reviewIds') as string[];
        await prisma.review.updateMany({
          where: { id: { in: approveIds } },
          data: { 
            flagged: false,
            flagReason: null,
            moderatedAt: new Date(),
            moderatedBy: admin.id
          }
        });
        return json({ success: true, message: `${approveIds.length} reviews approved successfully` });

      case 'bulk_delete':
        const deleteIds = formData.getAll('reviewIds') as string[];
        await prisma.review.deleteMany({
          where: { id: { in: deleteIds } }
        });
        return json({ success: true, message: `${deleteIds.length} reviews deleted successfully` });

      default:
        return json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Flagged review action error:', error);
    return json({ success: false, message: 'Failed to process review action' }, { status: 500 });
  }
}

export default function FlaggedReviews() {
  const { 
    admin, 
    flaggedReviews, 
    totalCount, 
    currentPage, 
    totalPages, 
    search, 
    reason, 
    stats, 
    flagReasons, 
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

  const getFlagReasonColor = (reason: string) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('spam')) return 'bg-red-100 text-red-800';
    if (reasonLower.includes('inappropriate')) return 'bg-orange-100 text-orange-800';
    if (reasonLower.includes('fake')) return 'bg-purple-100 text-purple-800';
    if (reasonLower.includes('harassment')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
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
                <Flag className="w-8 h-8 mr-3 text-red-600" />
                Flagged Reviews
              </h1>
              <p className="text-gray-600 mt-2">
                Review and moderate flagged reviews that require attention
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

        {/* Flagged Review Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Flagged</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFlagged.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Flags</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentFlagged.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Last 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <StarIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Action Required</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</p>
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
                    placeholder="Search flagged reviews..."
                    defaultValue={search}
                    className="pl-10"
                    name="search"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  name="reason"
                  defaultValue={reason}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Reasons</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate</option>
                  <option value="fake">Fake</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
                <Button type="submit" variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flagged Reviews List */}
        <div className="space-y-6">
          {flaggedReviews.map((review) => {
            const serviceInfo = getServiceInfo(review);
            return (
              <Card key={review.id} className="border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Flag className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{review.reviewerName}</h3>
                          <Badge className="bg-red-100 text-red-800">
                            Flagged
                          </Badge>
                          {review.flagReason && (
                            <Badge className={getFlagReasonColor(review.flagReason)}>
                              {review.flagReason}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            {getRatingStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.rating} star{review.rating !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">{serviceInfo.type}:</span> {serviceInfo.name} • {serviceInfo.location}
                        </div>
                        {review.flaggedAt && (
                          <div className="text-xs text-red-600 mt-1">
                            Flagged on {new Date(review.flaggedAt).toLocaleDateString()}
                          </div>
                        )}
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
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="approve_flagged" />
                        <input type="hidden" name="reviewId" value={review.id} />
                        <Button size="sm" variant="outline" type="submit" className="text-green-600 border-green-600 hover:bg-green-50">
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="unflag_review" />
                        <input type="hidden" name="reviewId" value={review.id} />
                        <Button size="sm" variant="outline" type="submit" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          <X className="w-4 h-4 mr-1" />
                          Unflag
                        </Button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="delete_flagged" />
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

        {/* No Flagged Reviews Found */}
        {flaggedReviews.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Reviews Found</h3>
              <p className="text-gray-500 mb-4">
                {search || reason !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No reviews have been flagged yet."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
