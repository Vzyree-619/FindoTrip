import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MapPin, 
  User, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Star,
  DollarSign,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Languages,
  Award,
  BookOpen
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
  
  // Build where clause for tour guides
  const whereClause: any = {
    role: 'TOUR_GUIDE'
  };
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { tourGuide: { 
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      } }
    ];
  }
  
  if (status === 'verified') {
    whereClause.verified = true;
  } else if (status === 'unverified') {
    whereClause.verified = false;
  } else if (status === 'active') {
    whereClause.isActive = true;
  } else if (status === 'inactive') {
    whereClause.isActive = false;
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get tour guides with detailed information
  const [tourGuides, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        tourGuide: {
          select: {
            firstName: true,
            lastName: true,
            businessPhone: true,
            businessEmail: true,
            businessAddress: true,
            businessCity: true,
            businessCountry: true,
            verificationLevel: true,
            totalEarnings: true,
            totalBookings: true,
            averageRating: true,
            totalReviews: true,
            joinedDate: true,
            lastActiveDate: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            languages: true,
            specialties: true,
            certifications: true,
            experience: true
          }
        },
        tours: {
          select: {
            id: true,
            title: true,
            city: true,
            difficulty: true,
            pricePerPerson: true,
            available: true,
            approvalStatus: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            tourBookings: true,
            reviews: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.user.count({ where: whereClause })
  ]);
  
  // Get statistics
  const stats = await Promise.all([
    prisma.user.count({ where: { role: 'TOUR_GUIDE' } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE', verified: true } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE', verified: false } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE', isActive: true } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE', isActive: false } }),
    prisma.tour.count({ where: { guide: { role: 'TOUR_GUIDE' } } }),
    prisma.tour.count({ where: { guide: { role: 'TOUR_GUIDE' }, available: true } }),
    prisma.tour.count({ where: { guide: { role: 'TOUR_GUIDE' }, approvalStatus: 'PENDING' } })
  ]);
  
  // Get top performing tour guides
  const topPerformers = await prisma.user.findMany({
    where: { role: 'TOUR_GUIDE' },
    include: {
      tourGuide: {
        select: {
          firstName: true,
          lastName: true,
          totalEarnings: true,
          totalBookings: true,
          averageRating: true
        }
      }
    },
    orderBy: { tourGuide: { totalEarnings: 'desc' } },
    take: 5
  });
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      user: { role: 'TOUR_GUIDE' }
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
    tourGuides,
    totalCount,
    stats: {
      total: stats[0],
      verified: stats[1],
      unverified: stats[2],
      active: stats[3],
      inactive: stats[4],
      totalTours: stats[5],
      activeTours: stats[6],
      pendingTours: stats[7]
    },
    topPerformers,
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
  const userId = formData.get('userId') as string;
  const reason = formData.get('reason') as string;
  
  try {
    if (action === 'verify_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: true }
      });
      await logAdminAction(admin.id, 'TOUR_GUIDE_VERIFIED', `Verified tour guide: ${userId}`, request);
      
    } else if (action === 'unverify_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: false }
      });
      await logAdminAction(admin.id, 'TOUR_GUIDE_UNVERIFIED', `Unverified tour guide: ${userId}`, request);
      
    } else if (action === 'activate_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      await logAdminAction(admin.id, 'TOUR_GUIDE_ACTIVATED', `Activated tour guide: ${userId}`, request);
      
    } else if (action === 'deactivate_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          deactivationReason: reason
        }
      });
      await logAdminAction(admin.id, 'TOUR_GUIDE_DEACTIVATED', `Deactivated tour guide: ${userId}. Reason: ${reason}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Tour guide management action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function TourGuides() {
  const { admin, tourGuides, totalCount, stats, topPerformers, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; userId: string; userName: string }>({
    open: false,
    action: '',
    userId: '',
    userName: ''
  });
  const [reason, setReason] = useState('');
  
  const fetcher = useFetcher();
  
  const handleUserAction = (action: string, userId: string, userName: string) => {
    setActionModal({ open: true, action, userId, userName });
    setReason('');
  };
  
  const submitAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    formData.append('userId', actionModal.userId);
    if (reason) formData.append('reason', reason);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', userId: '', userName: '' });
    setReason('');
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.length === tourGuides.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(tourGuides.map(user => user.id));
    }
  };
  
  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tour Guides</h1>
          <p className="text-gray-600">Manage tour guides and their professional accounts</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedUsers.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedUsers.length})
            </Button>
          )}
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Guides</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unverified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unverified}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.totalTours}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTours}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTours}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Guides</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Top Performers */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Tour Guides</h3>
        <div className="space-y-3">
          {topPerformers.map((guide, index) => (
            <div key={guide.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{guide.name}</p>
                  <p className="text-sm text-gray-600">
                    {guide.tourGuide?.firstName} {guide.tourGuide?.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>PKR {guide.tourGuide?.totalEarnings?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{guide.tourGuide?.averageRating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{guide.tourGuide?.totalBookings || 0} bookings</span>
                </div>
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
              <option value="verified">Verified ({stats.verified})</option>
              <option value="unverified">Unverified ({stats.unverified})</option>
              <option value="active">Active ({stats.active})</option>
              <option value="inactive">Inactive ({stats.inactive})</option>
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
              placeholder="Search tour guides..."
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
      
      {/* Tour Guides List */}
      <div className="space-y-4">
        {tourGuides.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tour Guides Found</h3>
            <p className="text-gray-600">No tour guides match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedUsers.length === tourGuides.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({tourGuides.length} guides)
              </span>
            </div>
            
            {tourGuides.map((guide) => (
              <Card key={guide.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(guide.id)}
                    onChange={() => handleSelectUser(guide.id)}
                    className="rounded"
                  />
                  
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{guide.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Tour Guide
                      </span>
                      {guide.verified && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      )}
                      {guide.isActive ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <UserX className="w-4 h-4" />
                          <span className="text-sm font-medium">Inactive</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{guide.email}</span>
                      </div>
                      {guide.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{guide.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(guide.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {guide.tourGuide && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{guide.tourGuide.firstName} {guide.tourGuide.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>PKR {guide.tourGuide.totalEarnings?.toLocaleString() || 0} earned</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>{guide.tourGuide.averageRating?.toFixed(1) || 'N/A'} ({guide.tourGuide.totalReviews || 0} reviews)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{guide.tours.length} tours</span>
                        </div>
                      </div>
                    )}
                    
                    {guide.tourGuide && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {guide.tourGuide.languages && guide.tourGuide.languages.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Languages className="w-4 h-4" />
                            <span>{guide.tourGuide.languages.join(', ')}</span>
                          </div>
                        )}
                        {guide.tourGuide.specialties && guide.tourGuide.specialties.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4" />
                            <span>{guide.tourGuide.specialties.join(', ')}</span>
                          </div>
                        )}
                        {guide.tourGuide.experience && (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{guide.tourGuide.experience} years experience</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!guide.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('verify_user', guide.id, guide.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    
                    {guide.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('unverify_user', guide.id, guide.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Unverify
                      </Button>
                    )}
                    
                    {guide.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('deactivate_user', guide.id, guide.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('activate_user', guide.id, guide.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/users/${guide.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} tour guides
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
              {actionModal.action === 'verify_user' && 'Verify Tour Guide'}
              {actionModal.action === 'unverify_user' && 'Unverify Tour Guide'}
              {actionModal.action === 'activate_user' && 'Activate Tour Guide'}
              {actionModal.action === 'deactivate_user' && 'Deactivate Tour Guide'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {actionModal.action === 'verify_user' && 'Are you sure you want to verify this tour guide?'}
                  {actionModal.action === 'unverify_user' && 'Are you sure you want to unverify this tour guide?'}
                  {actionModal.action === 'activate_user' && 'Are you sure you want to activate this tour guide?'}
                  {actionModal.action === 'deactivate_user' && 'Are you sure you want to deactivate this tour guide?'}
                </p>
                <p className="font-medium text-gray-900">{actionModal.userName}</p>
              </div>
              
              {(actionModal.action === 'deactivate_user') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (optional):
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for deactivation..."
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', userId: '', userName: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitAction}
                  disabled={fetcher.state === 'submitting'}
                  className={
                    actionModal.action.includes('deactivate') 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
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
