import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Building,
  Car,
  MapPin,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || 'all';
  const status = url.searchParams.get('status') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (role !== 'all') {
    where.role = role;
  }
  
  if (status === 'verified') {
    where.verified = true;
  } else if (status === 'unverified') {
    where.verified = false;
  }
  
  // Get users with pagination
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        verified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.user.count({ where })
  ]);
  
  // Get role counts
  const roleCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true }
  });
  
  const statusCounts = await Promise.all([
    prisma.user.count({ where: { verified: true } }),
    prisma.user.count({ where: { verified: false } })
  ]);
  
  return json({
    admin,
    users,
    totalCount,
    roleCounts,
    statusCounts,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, role, status }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const userId = formData.get('userId') as string;
  const reason = formData.get('reason') as string;
  
  try {
    if (action === 'verify') {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: true }
      });
      await logAdminAction(admin.id, 'USER_VERIFIED', `Verified user: ${userId}`, request);
    } else if (action === 'unverify') {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: false }
      });
      await logAdminAction(admin.id, 'USER_UNVERIFIED', `Unverified user: ${userId}`, request);
    } else if (action === 'delete') {
      await prisma.user.delete({
        where: { id: userId }
      });
      await logAdminAction(admin.id, 'USER_DELETED', `Deleted user: ${userId}. Reason: ${reason}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('User action error:', error);
    return json({ success: false, error: 'Failed to process user action' }, { status: 500 });
  }
}

export default function AdminUsers() {
  const { admin, users, totalCount, roleCounts, statusCounts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteUserId, setDeleteUserId] = useState('');
  
  const fetcher = useFetcher();
  
  const handleSearch = (search: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (search) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleUserAction = (action: string, userId: string, reason?: string) => {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('userId', userId);
    if (reason) formData.append('reason', reason);
    fetcher.submit(formData, { method: 'post' });
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
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return Users;
      case 'PROPERTY_OWNER': return Building;
      case 'VEHICLE_OWNER': return Car;
      case 'TOUR_GUIDE': return MapPin;
      case 'SUPER_ADMIN': return Shield;
      default: return UserCheck;
    }
  };
  
  const roles = [
    { value: 'all', label: 'All Roles', count: totalCount },
    { value: 'CUSTOMER', label: 'Customers', count: roleCounts.find(r => r.role === 'CUSTOMER')?._count.role || 0 },
    { value: 'PROPERTY_OWNER', label: 'Property Owners', count: roleCounts.find(r => r.role === 'PROPERTY_OWNER')?._count.role || 0 },
    { value: 'VEHICLE_OWNER', label: 'Vehicle Owners', count: roleCounts.find(r => r.role === 'VEHICLE_OWNER')?._count.role || 0 },
    { value: 'TOUR_GUIDE', label: 'Tour Guides', count: roleCounts.find(r => r.role === 'TOUR_GUIDE')?._count.role || 0 }
  ];
  
  const statuses = [
    { value: 'all', label: 'All Status', count: totalCount },
    { value: 'verified', label: 'Verified', count: statusCounts[0] },
    { value: 'unverified', label: 'Unverified', count: statusCounts[1] }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users across the platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Users: {totalCount.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => handleFilter('role', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label} ({role.count})
              </option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} ({status.count})
              </option>
            ))}
          </select>
          
          {/* Results per page */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('limit', e.target.value);
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </Card>
      
      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </Card>
        ) : (
          users.map((user) => {
            const RoleIcon = getRoleIcon(user.role);
            
            return (
              <Card key={user.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <RoleIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                        {user.verified ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unverified
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {user.role !== 'SUPER_ADMIN' && (
                      <>
                        {user.verified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('unverify', user.id)}
                            disabled={fetcher.state === 'submitting'}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Unverify
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('verify', user.id)}
                            disabled={fetcher.state === 'submitting'}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteUserId(user.id)}
                          disabled={fetcher.state === 'submitting'}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
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
          <div className="text-sm text-gray-500">
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
            <span className="text-sm text-gray-500">
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
      
      {/* Delete Confirmation Modal */}
      {deleteUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete User</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deletion
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please provide a reason for deletion..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteUserId('');
                    setDeleteReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleUserAction('delete', deleteUserId, deleteReason);
                    setDeleteUserId('');
                    setDeleteReason('');
                  }}
                  disabled={!deleteReason.trim() || fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}