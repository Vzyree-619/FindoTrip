import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Building, 
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
  MapPin,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3
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
  
  // Build where clause for property owners
  const whereClause: any = {
    role: 'PROPERTY_OWNER'
  };
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { propertyOwner: { businessName: { contains: search, mode: 'insensitive' } } }
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
  
  // Get property owners with detailed information
  const [propertyOwners, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        propertyOwner: {
          select: {
            businessName: true,
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
            subscriptionStatus: true
          }
        },
        properties: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            basePrice: true,
            available: true,
            approvalStatus: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            propertyBookings: true,
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
    prisma.user.count({ where: { role: 'PROPERTY_OWNER' } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', verified: true } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', verified: false } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', isActive: true } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', isActive: false } }),
    prisma.property.count({ where: { owner: { role: 'PROPERTY_OWNER' } } }),
    prisma.property.count({ where: { owner: { role: 'PROPERTY_OWNER' }, available: true } }),
    prisma.property.count({ where: { owner: { role: 'PROPERTY_OWNER' }, approvalStatus: 'PENDING' } })
  ]);
  
  // Get top performing property owners
  const topPerformers = await prisma.user.findMany({
    where: { role: 'PROPERTY_OWNER' },
    include: {
      propertyOwner: {
        select: {
          businessName: true,
          totalEarnings: true,
          totalBookings: true,
          averageRating: true
        }
      }
    },
    orderBy: { propertyOwner: { totalEarnings: 'desc' } },
    take: 5
  });
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      user: { role: 'PROPERTY_OWNER' }
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
    propertyOwners,
    totalCount,
    stats: {
      total: stats[0],
      verified: stats[1],
      unverified: stats[2],
      active: stats[3],
      inactive: stats[4],
      totalProperties: stats[5],
      activeProperties: stats[6],
      pendingProperties: stats[7]
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
      await logAdminAction(admin.id, 'PROPERTY_OWNER_VERIFIED', `Verified property owner: ${userId}`, request);
      
    } else if (action === 'unverify_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: false }
      });
      await logAdminAction(admin.id, 'PROPERTY_OWNER_UNVERIFIED', `Unverified property owner: ${userId}`, request);
      
    } else if (action === 'activate_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      await logAdminAction(admin.id, 'PROPERTY_OWNER_ACTIVATED', `Activated property owner: ${userId}`, request);
      
    } else if (action === 'deactivate_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          deactivationReason: reason
        }
      });
      await logAdminAction(admin.id, 'PROPERTY_OWNER_DEACTIVATED', `Deactivated property owner: ${userId}. Reason: ${reason}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Property owner management action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function PropertyOwners() {
  const { admin, propertyOwners, totalCount, stats, topPerformers, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
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
    if (selectedUsers.length === propertyOwners.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(propertyOwners.map(user => user.id));
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
          <h1 className="text-2xl font-bold text-gray-900">Property Owners</h1>
          <p className="text-gray-600">Manage property owners and their business accounts</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Owners</p>
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
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProperties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingProperties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Owners</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Top Performers */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Property Owners</h3>
        <div className="space-y-3">
          {topPerformers.map((owner, index) => (
            <div key={owner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{owner.name}</p>
                  <p className="text-sm text-gray-600">{owner.propertyOwner?.businessName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>PKR {owner.propertyOwner?.totalEarnings?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{owner.propertyOwner?.averageRating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>{owner.propertyOwner?.totalBookings || 0} bookings</span>
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
              placeholder="Search property owners..."
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
      
      {/* Property Owners List */}
      <div className="space-y-4">
        {propertyOwners.length === 0 ? (
          <Card className="p-8 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Owners Found</h3>
            <p className="text-gray-600">No property owners match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedUsers.length === propertyOwners.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({propertyOwners.length} owners)
              </span>
            </div>
            
            {propertyOwners.map((owner) => (
              <Card key={owner.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(owner.id)}
                    onChange={() => handleSelectUser(owner.id)}
                    className="rounded"
                  />
                  
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{owner.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Property Owner
                      </span>
                      {owner.verified && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      )}
                      {owner.isActive ? (
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
                        <span>{owner.email}</span>
                      </div>
                      {owner.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{owner.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(owner.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {owner.propertyOwner && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>{owner.propertyOwner.businessName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>PKR {owner.propertyOwner.totalEarnings?.toLocaleString() || 0} earned</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>{owner.propertyOwner.averageRating?.toFixed(1) || 'N/A'} ({owner.propertyOwner.totalReviews || 0} reviews)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>{owner.properties.length} properties</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!owner.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('verify_user', owner.id, owner.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    
                    {owner.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('unverify_user', owner.id, owner.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Unverify
                      </Button>
                    )}
                    
                    {owner.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('deactivate_user', owner.id, owner.name)}
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
                        onClick={() => handleUserAction('activate_user', owner.id, owner.name)}
                        disabled={fetcher.state === 'submitting'}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/users/${owner.id}`}>
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} property owners
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
              {actionModal.action === 'verify_user' && 'Verify Property Owner'}
              {actionModal.action === 'unverify_user' && 'Unverify Property Owner'}
              {actionModal.action === 'activate_user' && 'Activate Property Owner'}
              {actionModal.action === 'deactivate_user' && 'Deactivate Property Owner'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {actionModal.action === 'verify_user' && 'Are you sure you want to verify this property owner?'}
                  {actionModal.action === 'unverify_user' && 'Are you sure you want to unverify this property owner?'}
                  {actionModal.action === 'activate_user' && 'Are you sure you want to activate this property owner?'}
                  {actionModal.action === 'deactivate_user' && 'Are you sure you want to deactivate this property owner?'}
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
