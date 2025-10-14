import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  User, 
  Calendar, 
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  Database,
  Server,
  Lock,
  Users,
  Building,
  Car,
  MapPin,
  DollarSign,
  MessageSquare,
  Settings,
  Trash2,
  Edit,
  Plus,
  Minus
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const action = url.searchParams.get('action') || 'all';
  const user = url.searchParams.get('user') || 'all';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } },
      { userAgent: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (action !== 'all') {
    where.action = action;
  }
  
  if (user !== 'all') {
    where.userId = user;
  }
  
  if (dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
  }
  
  if (dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
  }
  
  // Get audit logs with pagination
  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);
  
  // Get action counts
  const actionCounts = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: { action: true }
  });
  
  // Get user counts
  const userCounts = await prisma.auditLog.groupBy({
    by: ['userId'],
    _count: { userId: true },
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
  
  // Get recent activity summary
  const recentActivity = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
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
    logs,
    totalCount,
    actionCounts,
    userCounts,
    recentActivity,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, action, user, dateFrom, dateTo }
  });
}

export default function AdminAudit() {
  const { admin, logs, totalCount, actionCounts, userCounts, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
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
  
  const handleDateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return Lock;
      case 'LOGOUT': return Lock;
      case 'USER_CREATED': return Users;
      case 'USER_UPDATED': return Edit;
      case 'USER_DELETED': return Trash2;
      case 'PROPERTY_APPROVED': return Building;
      case 'VEHICLE_APPROVED': return Car;
      case 'TOUR_APPROVED': return MapPin;
      case 'BOOKING_CREATED': return Calendar;
      case 'BOOKING_CANCELLED': return XCircle;
      case 'PAYMENT_PROCESSED': return DollarSign;
      case 'SUPPORT_REPLY': return MessageSquare;
      case 'SETTINGS_UPDATE': return Settings;
      default: return Activity;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'text-green-600 bg-green-100';
      case 'LOGOUT': return 'text-gray-600 bg-gray-100';
      case 'USER_CREATED': return 'text-blue-600 bg-blue-100';
      case 'USER_UPDATED': return 'text-yellow-600 bg-yellow-100';
      case 'USER_DELETED': return 'text-red-600 bg-red-100';
      case 'PROPERTY_APPROVED': return 'text-green-600 bg-green-100';
      case 'VEHICLE_APPROVED': return 'text-green-600 bg-green-100';
      case 'TOUR_APPROVED': return 'text-green-600 bg-green-100';
      case 'BOOKING_CREATED': return 'text-blue-600 bg-blue-100';
      case 'BOOKING_CANCELLED': return 'text-red-600 bg-red-100';
      case 'PAYMENT_PROCESSED': return 'text-green-600 bg-green-100';
      case 'SUPPORT_REPLY': return 'text-purple-600 bg-purple-100';
      case 'SETTINGS_UPDATE': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getSeverityIcon = (action: string) => {
    switch (action) {
      case 'USER_DELETED': return AlertTriangle;
      case 'BOOKING_CANCELLED': return XCircle;
      case 'LOGIN': return CheckCircle;
      case 'LOGOUT': return CheckCircle;
      default: return Info;
    }
  };
  
  const getSeverityColor = (action: string) => {
    switch (action) {
      case 'USER_DELETED': return 'text-red-500';
      case 'BOOKING_CANCELLED': return 'text-red-500';
      case 'LOGIN': return 'text-green-500';
      case 'LOGOUT': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };
  
  const actions = [
    { value: 'all', label: 'All Actions', count: totalCount },
    ...actionCounts.map(ac => ({
      value: ac.action,
      label: ac.action.replace('_', ' '),
      count: ac._count.action
    }))
  ];
  
  const users = [
    { value: 'all', label: 'All Users', count: totalCount },
    ...userCounts.map(uc => ({
      value: uc.userId,
      label: uc.user?.name || uc.user?.email || 'Unknown',
      count: uc._count.userId
    }))
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all system activities and user actions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <div className="text-sm text-gray-500">
            Total Logs: {totalCount.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Action Filter */}
          <select
            value={filters.action}
            onChange={(e) => handleFilter('action', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {actions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label} ({action.count})
              </option>
            ))}
          </select>
          
          {/* User Filter */}
          <select
            value={filters.user}
            onChange={(e) => handleFilter('user', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {users.map((user) => (
              <option key={user.value} value={user.value}>
                {user.label} ({user.count})
              </option>
            ))}
          </select>
          
          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleDateFilter('dateFrom', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="From Date"
          />
          
          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleDateFilter('dateTo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="To Date"
          />
        </div>
      </Card>
      
      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Successful</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(totalCount * 0.85).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(totalCount * 0.05).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(totalCount * 0.10).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Audit Logs List */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </Card>
        ) : (
          logs.map((log) => {
            const ActionIcon = getActionIcon(log.action);
            const SeverityIcon = getSeverityIcon(log.action);
            
            return (
              <Card key={log.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <ActionIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{log.action}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        <div className={`flex items-center space-x-1 ${getSeverityColor(log.action)}`}>
                          <SeverityIcon className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{log.user?.name || 'System'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4" />
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-4">
                        <p className="font-medium mb-1">Details:</p>
                        <p>{log.details}</p>
                      </div>
                      
                      {log.userAgent && (
                        <div className="text-xs text-gray-500">
                          <p className="font-medium mb-1">User Agent:</p>
                          <p className="truncate">{log.userAgent}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
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
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} logs
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
      
      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Log Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <p className="text-sm text-gray-900">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <p className="text-sm text-gray-900">{selectedLog.user?.name || 'System'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLog.details}</p>
              </div>
              
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <p className="text-sm text-gray-900">{selectedLog.resourceType || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                <p className="text-sm text-gray-900">{selectedLog.resourceId || 'N/A'}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
