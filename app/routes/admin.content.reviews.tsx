import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Star, 
  User, 
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Flag,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Clock,
  Calendar
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for reviews
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (status === 'flagged') {
    whereClause.flagged = true;
  } else if (status === 'approved') {
    whereClause.flagged = false;
    whereClause.approved = true;
  } else if (status === 'pending') {
    whereClause.flagged = false;
    whereClause.approved = false;
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get reviews
  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true
          }
        },
        tour: {
          select: {
            id: true,
            title: true,
            difficulty: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.review.count({ where: whereClause })
  ]);
  
  // Get counts
  const counts = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { flagged: true } }),
    prisma.review.count({ where: { flagged: false, approved: true } }),
    prisma.review.count({ where: { flagged: false, approved: false } })
  ]);
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      action: { contains: 'REVIEW' }
    },
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  
  return json({
    admin,
    reviews,
    totalCount,
    counts: {
      total: counts[0],
      flagged: counts[1],
      approved: counts[2],
      pending: counts[3]
    },
    recentActivity,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, sort, dateFrom, dateTo }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const reviewId = formData.get('reviewId') as string;
  const reason = formData.get('reason') as string;
  
  try {
    if (action === 'approve_review') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          approved: true,
          flagged: false
        }
      });
      await logAdminAction(admin.id, 'REVIEW_APPROVED', `Approved review: ${reviewId}`, request);
      
    } else if (action === 'reject_review') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          approved: false,
          flagged: true,
          rejectionReason: reason
        }
      });
      await logAdminAction(admin.id, 'REVIEW_REJECTED', `Rejected review: ${reviewId}. Reason: ${reason}`, request);
      
    } else if (action === 'flag_review') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          flagged: true,
          flagReason: reason
        }
      });
      await logAdminAction(admin.id, 'REVIEW_FLAGGED', `Flagged review: ${reviewId}. Reason: ${reason}`, request);
      
    } else if (action === 'unflag_review') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          flagged: false,
          flagReason: null
        }
      });
      await logAdminAction(admin.id, 'REVIEW_UNFLAGGED', `Unflagged review: ${reviewId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Review moderation action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function ReviewModeration() {
  const { admin, reviews, totalCount, counts, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; reviewId: string; reviewContent: string }>({
    open: false,
    action: '',
    reviewId: '',
    reviewContent: ''
  });
  const [reason, setReason] = useState('');
  
  const fetcher = useFetcher();
  
  const handleReviewAction = (action: string, reviewId: string, reviewContent: string) => {
    setActionModal({ open: true, action, reviewId, reviewContent });
    setReason('');
  };
  
  const submitAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    formData.append('reviewId', actionModal.reviewId);
    if (reason) formData.append('reason', reason);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', reviewId: '', reviewContent: '' });
    setReason('');
  };
  
  const getServiceInfo = (review: any) => {
    if (review.property) {
      return { type: 'Property', name: review.property.name, details: review.property.type };
    } else if (review.vehicle) {
      return { type: 'Vehicle', name: `${review.vehicle.brand} ${review.vehicle.model}`, details: review.vehicle.category };
    } else if (review.tour) {
      return { type: 'Tour', name: review.tour.title, details: review.tour.difficulty };
    }
    return { type: 'Unknown', name: 'N/A', details: 'N/A' };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
          <p className="text-gray-600">Moderate user reviews and content</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-gray-900">{counts.flagged}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{counts.approved}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{counts.pending}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('status', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="flagged">Flagged ({counts.flagged})</option>
              <option value="approved">Approved ({counts.approved})</option>
              <option value="pending">Pending ({counts.pending})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              value={filters.sort}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sort', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('dateFrom', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('dateTo', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={filters.search}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('search', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">No reviews match your current filters.</p>
          </Card>
        ) : (
          reviews.map((review) => {
            const serviceInfo = getServiceInfo(review);
            
            return (
              <Card key={review.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{review.user.name}</h3>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                      
                      {review.flagged && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <Flag className="w-4 h-4" />
                          <span className="text-sm font-medium">FLAGGED</span>
                        </div>
                      )}
                      
                      {review.approved && !review.flagged && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">APPROVED</span>
                        </div>
                      )}
                      
                      {!review.approved && !review.flagged && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">PENDING</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700">{review.content}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Posted {new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>{serviceInfo.type}: {serviceInfo.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{review.user.role}</span>
                      </div>
                    </div>
                    
                    {review.flagReason && (
                      <div className="p-3 bg-red-50 rounded-lg mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">Flag Reason:</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{review.flagReason}</p>
                      </div>
                    )}
                    
                    {review.rejectionReason && (
                      <div className="p-3 bg-yellow-50 rounded-lg mb-3">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-700">Rejection Reason:</span>
                        </div>
                        <p className="text-sm text-yellow-600 mt-1">{review.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {!review.approved && !review.flagged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewAction('approve_review', review.id, review.content)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    
                    {!review.flagged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewAction('flag_review', review.id, review.content)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Flag
                      </Button>
                    )}
                    
                    {review.flagged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewAction('unflag_review', review.id, review.content)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Unflag
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewAction('reject_review', review.id, review.content)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/reviews/${review.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} reviews
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page - 1).toString());
                setSearchParams(newParams);
              }}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page + 1).toString());
                setSearchParams(newParams);
              }}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal.action === 'approve_review' && 'Approve Review'}
              {actionModal.action === 'reject_review' && 'Reject Review'}
              {actionModal.action === 'flag_review' && 'Flag Review'}
              {actionModal.action === 'unflag_review' && 'Unflag Review'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {actionModal.action === 'approve_review' && 'Are you sure you want to approve this review?'}
                  {actionModal.action === 'reject_review' && 'Are you sure you want to reject this review?'}
                  {actionModal.action === 'flag_review' && 'Are you sure you want to flag this review?'}
                  {actionModal.action === 'unflag_review' && 'Are you sure you want to unflag this review?'}
                </p>
                <p className="font-medium text-gray-900 line-clamp-3">{actionModal.reviewContent}</p>
              </div>
              
              {(actionModal.action === 'reject_review' || actionModal.action === 'flag_review') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason:
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for this action..."
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', reviewId: '', reviewContent: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitAction}
                  disabled={fetcher.state === 'submitting'}
                  className={
                    actionModal.action.includes('reject') || actionModal.action.includes('flag')
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }
                >
                  {fetcher.state === 'submitting' ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
