import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  User, 
  Building, 
  Car, 
  MapPin, 
  Shield,
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
  MoreHorizontal,
  UserCheck,
  UserX,
  Settings,
  Activity
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || 'all';
  const status = url.searchParams.get('status') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause
  const whereClause: any = {
    role: { not: 'SUPER_ADMIN' } // Exclude super admins from user management
  };
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (role !== 'all') {
    whereClause.role = role;
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
  
  // Get users with pagination
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        propertyOwner: {
          select: {
            businessName: true,
            businessPhone: true,
            businessEmail: true,
            verificationLevel: true,
            totalEarnings: true,
            totalBookings: true
          }
        },
        vehicleOwner: {
          select: {
            businessName: true,
            businessPhone: true,
            businessEmail: true,
            verificationLevel: true,
            totalEarnings: true,
            totalBookings: true
          }
        },
        tourGuide: {
          select: {
            firstName: true,
            lastName: true,
            businessPhone: true,
            businessEmail: true,
            verificationLevel: true,
            totalEarnings: true,
            totalBookings: true
          }
        },
        _count: {
          select: {
            propertyBookings: true,
            vehicleBookings: true,
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
  
  // Get role counts
  const roleCounts = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER' } }),
    prisma.user.count({ where: { role: 'VEHICLE_OWNER' } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE' } }),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
  ]);
  
  // Get status counts
  const statusCounts = await Promise.all([
    prisma.user.count({ where: { verified: true } }),
    prisma.user.count({ where: { verified: false } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } })
  ]);
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
  
  return json({
    admin,
    users,
    totalCount,
    roleCounts: {
      customers: roleCounts[0],
      propertyOwners: roleCounts[1],
      vehicleOwners: roleCounts[2],
      tourGuides: roleCounts[3],
      admins: roleCounts[4]
    },
    statusCounts: {
      verified: statusCounts[0],
      unverified: statusCounts[1],
      active: statusCounts[2],
      inactive: statusCounts[3]
    },
    recentActivity,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, role, status, sort, dateFrom, dateTo }
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
      await logAdminAction(admin.id, 'USER_VERIFIED', `Verified user: ${userId}`, request);
      
    } else if (action === 'unverify_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: false }
      });
      await logAdminAction(admin.id, 'USER_UNVERIFIED', `Unverified user: ${userId}`, request);
      
    } else if (action === 'activate_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      await logAdminAction(admin.id, 'USER_ACTIVATED', `Activated user: ${userId}`, request);
      
    } else if (action === 'deactivate_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          deactivationReason: reason
        }
      });
      await logAdminAction(admin.id, 'USER_DEACTIVATED', `Deactivated user: ${userId}. Reason: ${reason}`, request);
      
    } else if (action === 'ban_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          banned: true,
          banReason: reason
        }
      });
      await logAdminAction(admin.id, 'USER_BANNED', `Banned user: ${userId}. Reason: ${reason}`, request);
      
    } else if (action === 'unban_user') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: true,
          banned: false,
          banReason: null
        }
      });
      await logAdminAction(admin.id, 'USER_UNBANNED', `Unbanned user: ${userId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('User management action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function AllUsers() {
  const { admin, users, totalCount, roleCounts, statusCounts, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; userId: string; userName: string }>({
    open: false,
    action: '',
    userId: '',
    userName: ''
  });
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [userDetails, setUserDetails] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [editModal, setEditModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [messageModal, setMessageModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [moreActionsModal, setMoreActionsModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [selectedAction, setSelectedAction] = useState('');
  
  const fetcher = useFetcher();
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return User;
      case 'PROPERTY_OWNER': return Building;
      case 'VEHICLE_OWNER': return Car;
      case 'TOUR_GUIDE': return MapPin;
      case 'SUPER_ADMIN': return Shield;
      default: return User;
    }
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800';
      case 'PROPERTY_OWNER': return 'bg-green-100 text-green-800';
      case 'VEHICLE_OWNER': return 'bg-purple-100 text-purple-800';
      case 'TOUR_GUIDE': return 'bg-orange-100 text-orange-800';
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
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
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };
  
  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  const getBusinessInfo = (user: any) => {
    if (user.role === 'PROPERTY_OWNER' && user.propertyOwner) {
      return {
        businessName: user.propertyOwner.businessName,
        businessPhone: user.propertyOwner.businessPhone,
        businessEmail: user.propertyOwner.businessEmail,
        verificationLevel: user.propertyOwner.verificationLevel,
        totalEarnings: user.propertyOwner.totalEarnings,
        totalBookings: user.propertyOwner.totalBookings
      };
    } else if (user.role === 'VEHICLE_OWNER' && user.vehicleOwner) {
      return {
        businessName: user.vehicleOwner.businessName,
        businessPhone: user.vehicleOwner.businessPhone,
        businessEmail: user.vehicleOwner.businessEmail,
        verificationLevel: user.vehicleOwner.verificationLevel,
        totalEarnings: user.vehicleOwner.totalEarnings,
        totalBookings: user.vehicleOwner.totalBookings
      };
    } else if (user.role === 'TOUR_GUIDE' && user.tourGuide) {
      return {
        businessName: `${user.tourGuide.firstName} ${user.tourGuide.lastName}`,
        businessPhone: user.tourGuide.businessPhone,
        businessEmail: user.tourGuide.businessEmail,
        verificationLevel: user.tourGuide.verificationLevel,
        totalEarnings: user.tourGuide.totalEarnings,
        totalBookings: user.tourGuide.totalBookings
      };
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">Manage all platform users and their accounts</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{roleCounts.customers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Property Owners</p>
              <p className="text-2xl font-bold text-gray-900">{roleCounts.propertyOwners}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Car className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle Owners</p>
              <p className="text-2xl font-bold text-gray-900">{roleCounts.vehicleOwners}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tour Guides</p>
              <p className="text-2xl font-bold text-gray-900">{roleCounts.tourGuides}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{roleCounts.admins}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.verified}</p>
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
              <p className="text-2xl font-bold text-gray-900">{statusCounts.unverified}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.inactive}</p>
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
            <label className="text-sm text-gray-600">Role:</label>
            <select
              value={filters.role}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('role', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Roles</option>
              <option value="CUSTOMER">Customers ({roleCounts.customers})</option>
              <option value="PROPERTY_OWNER">Property Owners ({roleCounts.propertyOwners})</option>
              <option value="VEHICLE_OWNER">Vehicle Owners ({roleCounts.vehicleOwners})</option>
              <option value="TOUR_GUIDE">Tour Guides ({roleCounts.tourGuides})</option>
            </select>
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
              <option value="verified">Verified ({statusCounts.verified})</option>
              <option value="unverified">Unverified ({statusCounts.unverified})</option>
              <option value="active">Active ({statusCounts.active})</option>
              <option value="inactive">Inactive ({statusCounts.inactive})</option>
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
              placeholder="Search users..."
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
      
      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedUsers.length} users selected
              </span>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                <UserX className="w-4 h-4 mr-2" />
                Suspend Selected
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers([])}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">No users match your current filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  const businessInfo = getBusinessInfo(user);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                            <RoleIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                              {user.lastLoginAt && (
                                <span> • Last seen: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                        {businessInfo && (
                          <div className="text-xs text-gray-500 mt-1">
                            {businessInfo.businessName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {user.isActive ? (
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
                          {user.verified ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">Unverified</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.role === 'CUSTOMER' ? (
                            <>
                              <div>Bookings: {user._count.propertyBookings + user._count.vehicleBookings + user._count.tourBookings}</div>
                              <div className="text-gray-500">Reviews: {user._count.reviews}</div>
                            </>
                          ) : businessInfo ? (
                            <>
                              <div>Earned: PKR {businessInfo.totalEarnings?.toLocaleString() || 0}</div>
                              <div className="text-gray-500">Bookings: {businessInfo.totalBookings || 0}</div>
                            </>
                          ) : (
                            <div className="text-gray-500">No activity data</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserDetails({ open: true, userId: user.id, userName: user.name })}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditModal({ open: true, userId: user.id, userName: user.name })}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('deactivate_user', user.id, user.name)}
                            disabled={fetcher.state === 'submitting'}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMessageModal({ open: true, userId: user.id, userName: user.name })}
                            className="text-purple-600 border-purple-600 hover:bg-purple-50"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <div className="relative">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setMoreActionsModal({ open: true, userId: user.id, userName: user.name })}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} users
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
      
      {/* User Details Modal */}
      {userDetails.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <Button
                variant="outline"
                onClick={() => setUserDetails({ open: false, userId: '', userName: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{userDetails.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">user@example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">+1234567890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium">Customer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </div>
              
              {/* Activity Summary */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Activity Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bookings:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Spent:</span>
                    <span className="font-medium">PKR 1,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews Given:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs for detailed information */}
            <div className="mt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
                    Bookings
                  </button>
                  <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Reviews
                  </button>
                  <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Activity Log
                  </button>
                  <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Messages
                  </button>
                </nav>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-600">Detailed user information would be displayed here...</p>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Edit User Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <Button
                variant="outline"
                onClick={() => setEditModal({ open: false, userId: '', userName: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={editModal.userName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="CUSTOMER">Customer</option>
                    <option value="PROPERTY_OWNER">Property Owner</option>
                    <option value="VEHICLE_OWNER">Vehicle Owner</option>
                    <option value="TOUR_GUIDE">Tour Guide</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Status
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add internal notes about this user..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setEditModal({ open: false, userId: '', userName: '' })}
                >
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Message User Modal */}
      {messageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Send Message</h3>
              <Button
                variant="outline"
                onClick={() => setMessageModal({ open: false, userId: '', userName: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To: {messageModal.userName}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter message subject..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Type your message here..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2 text-sm text-gray-700">Send email notification</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2 text-sm text-gray-700">Send SMS notification</span>
                </label>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setMessageModal({ open: false, userId: '', userName: '' })}
                >
                  Cancel
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* More Actions Modal */}
      {moreActionsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">More Actions</h3>
              <Button
                variant="outline"
                onClick={() => setMoreActionsModal({ open: false, userId: '', userName: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Advanced actions for: <span className="font-medium">{moreActionsModal.userName}</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAction('activity_log');
                    // Handle activity log
                  }}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Activity Log
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAction('login_history');
                    // Handle login history
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Login History
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAction('reset_password');
                    // Handle password reset
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAction('verify_manually');
                    // Handle manual verification
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Email/Phone
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedAction('ban_user');
                    // Handle ban user
                  }}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User (Permanent)
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedAction('delete_account');
                    // Handle delete account
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAction('impersonate');
                    // Handle impersonation
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Impersonate User
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedAction('export_data');
                    // Handle data export
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export User Data
                </Button>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setMoreActionsModal({ open: false, userId: '', userName: '' })}
                >
                  Cancel
                </Button>
                {selectedAction && (
                  <Button
                    onClick={() => {
                      // Handle selected action
                      setMoreActionsModal({ open: false, userId: '', userName: '' });
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Execute Action
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal.action === 'verify_user' && 'Verify User'}
              {actionModal.action === 'unverify_user' && 'Unverify User'}
              {actionModal.action === 'activate_user' && 'Activate User'}
              {actionModal.action === 'deactivate_user' && 'Suspend User'}
              {actionModal.action === 'ban_user' && 'Ban User'}
              {actionModal.action === 'unban_user' && 'Unban User'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {actionModal.action === 'verify_user' && 'Are you sure you want to verify this user?'}
                  {actionModal.action === 'unverify_user' && 'Are you sure you want to unverify this user?'}
                  {actionModal.action === 'activate_user' && 'Are you sure you want to activate this user?'}
                  {actionModal.action === 'deactivate_user' && 'Are you sure you want to suspend this user?'}
                  {actionModal.action === 'ban_user' && 'Are you sure you want to ban this user?'}
                  {actionModal.action === 'unban_user' && 'Are you sure you want to unban this user?'}
                </p>
                <p className="font-medium text-gray-900">{actionModal.userName}</p>
              </div>
              
              {(actionModal.action === 'deactivate_user' || actionModal.action === 'ban_user') && (
                <>
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
                  
                  {actionModal.action === 'deactivate_user' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration:
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="1">1 Day</option>
                        <option value="7">1 Week</option>
                        <option value="30">1 Month</option>
                        <option value="indefinite">Indefinite</option>
                      </select>
                    </div>
                  )}
                </>
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
                    actionModal.action.includes('ban') || actionModal.action.includes('deactivate') 
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
