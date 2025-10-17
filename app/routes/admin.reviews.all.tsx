import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Star, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Users,
  Calendar,
  Clock,
  Mail,
  Phone,
  Award,
  Shield,
  BookOpen,
  Globe,
  MessageSquare,
  Settings,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  Target,
  Timer,
  Bell,
  BellOff,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle2,
  Clock3,
  AlertCircle,
  Info,
  HelpCircle,
  Bug,
  Wrench,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply,
  Forward,
  Copy,
  Share,
  Tag,
  AlertTriangle,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  MessageCircle,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  BarChart3,
  Building,
  Car,
  MapPin
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const serviceType = url.searchParams.get('serviceType') || 'all';
  const rating = url.searchParams.get('rating') || 'all';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const hasResponse = url.searchParams.get('hasResponse') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
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
  
  if (status !== 'all') {
    if (status === 'published') {
      whereClause.isHidden = false;
    } else if (status === 'hidden') {
      whereClause.isHidden = true;
    } else if (status === 'flagged') {
      whereClause.isFlagged = true;
    }
  }
  
  if (serviceType !== 'all') {
    whereClause.serviceType = serviceType.toUpperCase();
  }
  
  if (rating !== 'all') {
    whereClause.rating = parseInt(rating);
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  if (hasResponse !== 'all') {
    if (hasResponse === 'yes') {
      whereClause.response = { not: null };
    } else if (hasResponse === 'no') {
      whereClause.response = null;
    }
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
            role: true,
            verified: true,
            active: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            city: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        tour: {
          select: {
            id: true,
            title: true,
            city: true,
            guide: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            helpfulVotes: true,
            reports: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : 
               sort === 'oldest' ? { createdAt: 'asc' } :
               sort === 'rating' ? { rating: 'desc' } :
               sort === 'helpful' ? { helpfulVotes: { _count: 'desc' } } :
               { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.review.count({ where: whereClause })
  ]);
  
  // Get review statistics
  const reviewStats = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { isHidden: false } }),
    prisma.review.count({ where: { isFlagged: true } }),
    prisma.review.count({ where: { isHidden: true } }),
    prisma.review.aggregate({
      _avg: { rating: true }
    })
  ]);
  
  // Get rating distribution
  const ratingDistribution = await Promise.all([
    prisma.review.count({ where: { rating: 5 } }),
    prisma.review.count({ where: { rating: 4 } }),
    prisma.review.count({ where: { rating: 3 } }),
    prisma.review.count({ where: { rating: 2 } }),
    prisma.review.count({ where: { rating: 1 } })
  ]);
  
  // Get service type statistics
  const serviceTypeStats = await Promise.all([
    prisma.review.count({ where: { serviceType: 'PROPERTY' } }),
    prisma.review.count({ where: { serviceType: 'VEHICLE' } }),
    prisma.review.count({ where: { serviceType: 'TOUR' } })
  ]);
  
  // Get most helpful reviews
  const mostHelpful = await prisma.review.findMany({
    where: { isHidden: false },
    orderBy: { helpfulVotes: { _count: 'desc' } },
    take: 5,
    include: {
      user: {
        select: {
          name: true
        }
      }
    }
  });
  
  return json({
    admin,
    reviews,
    totalCount,
    reviewStats: {
      total: reviewStats[0],
      published: reviewStats[1],
      flagged: reviewStats[2],
      hidden: reviewStats[3],
      averageRating: reviewStats[4]._avg.rating || 0
    },
    ratingDistribution: {
      five: ratingDistribution[0],
      four: ratingDistribution[1],
      three: ratingDistribution[2],
      two: ratingDistribution[3],
      one: ratingDistribution[4]
    },
    serviceTypeStats: {
      properties: serviceTypeStats[0],
      vehicles: serviceTypeStats[1],
      tours: serviceTypeStats[2]
    },
    mostHelpful,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, serviceType, rating, dateFrom, dateTo, hasResponse, sort }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const reviewId = formData.get('reviewId') as string;
  const reason = formData.get('reason') as string;
  const editedContent = formData.get('editedContent') as string;
  
  try {
    if (action === 'hide') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          isHidden: true,
          hiddenReason: reason,
          hiddenBy: admin.id,
          hiddenAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'HIDE_REVIEW', `Hidden review ${reviewId}: ${reason}`, request);
      
    } else if (action === 'unhide') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          isHidden: false,
          hiddenReason: null,
          hiddenBy: null,
          hiddenAt: null
        }
      });
      
      await logAdminAction(admin.id, 'UNHIDE_REVIEW', `Unhidden review ${reviewId}`, request);
      
    } else if (action === 'remove') {
      await prisma.review.delete({
        where: { id: reviewId }
      });
      
      await logAdminAction(admin.id, 'REMOVE_REVIEW', `Removed review ${reviewId}: ${reason}`, request);
      
    } else if (action === 'edit') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          content: editedContent,
          editedBy: admin.id,
          editedAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'EDIT_REVIEW', `Edited review ${reviewId}`, request);
      
    } else if (action === 'feature') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          isFeatured: true,
          featuredBy: admin.id,
          featuredAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'FEATURE_REVIEW', `Featured review ${reviewId}`, request);
      
    } else if (action === 'unfeature') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { 
          isFeatured: false,
          featuredBy: null,
          featuredAt: null
        }
      });
      
      await logAdminAction(admin.id, 'UNFEATURE_REVIEW', `Unfeatured review ${reviewId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Review action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function AllReviews() {
  const { 
    admin, 
    reviews, 
    totalCount, 
    reviewStats, 
    ratingDistribution, 
    serviceTypeStats, 
    mostHelpful, 
    pagination, 
    filters 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; reviewId: string; title: string }>({
    open: false,
    action: '',
    reviewId: '',
    title: ''
  });
  const [reason, setReason] = useState('');
  const [editedContent, setEditedContent] = useState('');
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r.id));
    }
  };
  
  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };
  
  const handleReviewAction = (action: string, reviewId: string, title: string) => {
    setActionModal({ open: true, action, reviewId, title });
  };
  
  const executeAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    formData.append('reviewId', actionModal.reviewId);
    if (reason) formData.append('reason', reason);
    if (editedContent) formData.append('editedContent', editedContent);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', reviewId: '', title: '' });
    setReason('');
    setEditedContent('');
  };
  
  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'PROPERTY': return Building;
      case 'VEHICLE': return Car;
      case 'TOUR': return MapPin;
      default: return Star;
    }
  };
  
  const getServiceColor = (serviceType: string) => {
    switch (serviceType) {
      case 'PROPERTY': return 'bg-green-100 text-green-800';
      case 'VEHICLE': return 'bg-blue-100 text-blue-800';
      case 'TOUR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Reviews</h1>
          <p className="text-gray-600">Manage and moderate all platform reviews</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedReviews.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedReviews.length})
            </Button>
          )}
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{reviewStats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{reviewStats.published}</p>
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
              <p className="text-2xl font-bold text-gray-900">{reviewStats.flagged}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hidden</p>
              <p className="text-2xl font-bold text-gray-900">{reviewStats.hidden}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">{reviewStats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Rating Distribution */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[
            { stars: 5, count: ratingDistribution.five, color: 'bg-green-500' },
            { stars: 4, count: ratingDistribution.four, color: 'bg-blue-500' },
            { stars: 3, count: ratingDistribution.three, color: 'bg-yellow-500' },
            { stars: 2, count: ratingDistribution.two, color: 'bg-orange-500' },
            { stars: 1, count: ratingDistribution.one, color: 'bg-red-500' }
          ].map((item) => (
            <div key={item.stars} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {Array.from({ length: item.stars }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${(item.count / reviewStats.total) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Service Type Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{serviceTypeStats.properties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{serviceTypeStats.vehicles}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tours</p>
              <p className="text-2xl font-bold text-gray-900">{serviceTypeStats.tours}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Most Helpful Reviews */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Helpful Reviews</h3>
        <div className="space-y-3">
          {mostHelpful.map((review, index) => (
            <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{review.content.substring(0, 50)}...</div>
                  <div className="text-sm text-gray-600">By {review.user.name}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {review._count.helpfulVotes} helpful votes
              </div>
            </div>
          ))}
        </div>
      </Card>
      
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
              <option value="published">Published ({reviewStats.published})</option>
              <option value="hidden">Hidden ({reviewStats.hidden})</option>
              <option value="flagged">Flagged ({reviewStats.flagged})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Service Type:</label>
            <select
              value={filters.serviceType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('serviceType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="property">Properties ({serviceTypeStats.properties})</option>
              <option value="vehicle">Vehicles ({serviceTypeStats.vehicles})</option>
              <option value="tour">Tours ({serviceTypeStats.tours})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Rating:</label>
            <select
              value={filters.rating}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('rating', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Has Response:</label>
            <select
              value={filters.hasResponse}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('hasResponse', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="yes">With Response</option>
              <option value="no">No Response</option>
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
              <option value="rating">Highest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
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
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">No reviews match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedReviews.length === reviews.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({reviews.length} reviews)
              </span>
            </div>
            
            {reviews.map((review) => {
              const ServiceIcon = getServiceIcon(review.serviceType);
              
              return (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => handleSelectReview(review.id)}
                      className="rounded mt-1"
                    />
                    
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ServiceIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Review #{review.id.slice(-8)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(review.serviceType)}`}>
                          {review.serviceType}
                        </span>
                        {review.isHidden && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Hidden
                          </span>
                        )}
                        {review.isFlagged && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Flagged
                          </span>
                        )}
                        {review.isFeatured && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{review.user.name} ({review.user.role})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Posted {new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{review._count.helpfulVotes} helpful</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Flag className="w-4 h-4" />
                          <span>{review._count.reports} reports</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                          {review.rating}.0
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded">
                        {review.content}
                      </div>
                      
                      {review.response && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                          <div className="font-medium text-blue-800 mb-1">Owner Response:</div>
                          <div>{review.response}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            Responded {new Date(review.responseDate!).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleReviewAction('edit', review.id, 'Edit Review')}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      {review.isHidden ? (
                        <Button
                          onClick={() => handleReviewAction('unhide', review.id, 'Unhide Review')}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Unhide
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleReviewAction('hide', review.id, 'Hide Review')}
                          variant="outline"
                          size="sm"
                          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Hide
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handleReviewAction('remove', review.id, 'Remove Review')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{actionModal.title}</h3>
              <Button
                variant="outline"
                onClick={() => setActionModal({ open: false, action: '', reviewId: '', title: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {actionModal.action === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit Review Content
                  </label>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Enter edited review content..."
                  />
                </div>
              )}
              
              {(actionModal.action === 'hide' || actionModal.action === 'remove') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
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
                  onClick={() => setActionModal({ open: false, action: '', reviewId: '', title: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeAction}
                  disabled={fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Processing...' : 'Execute'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
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
    </div>
  );
}
