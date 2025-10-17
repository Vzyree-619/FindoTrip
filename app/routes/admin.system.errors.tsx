import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  AlertTriangle, 
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Power,
  Plug,
  Unplug,
  Cable,
  Router,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Sparkles,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Forward,
  Send,
  Mail,
  Phone,
  MessageCircle,
  Bug,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Minus,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Target,
  Timer,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  Settings,
  CreditCard,
  Shield,
  Bell,
  Building,
  Car,
  MapPin,
  Share2,
  Gift,
  HelpCircle,
  Wrench,
  HardDrive,
  Network,
  Lock,
  Unlock,
  Bot,
  Cpu,
  Key
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const severity = url.searchParams.get('severity') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const status = url.searchParams.get('status') || 'all';
  const date = url.searchParams.get('date') || '24';
  const search = url.searchParams.get('search') || '';
  
  // Build where clause for error logs
  const whereClause: any = {};
  
  if (severity !== 'all') {
    whereClause.severity = severity.toUpperCase();
  }
  
  if (type !== 'all') {
    whereClause.type = type;
  }
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }
  
  if (date !== 'all') {
    const hours = parseInt(date);
    whereClause.createdAt = {
      gte: new Date(Date.now() - hours * 60 * 60 * 1000)
    };
  }
  
  if (search) {
    whereClause.OR = [
      { message: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
      { errorCode: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Get error logs
  const [errorLogs, totalCount] = await Promise.all([
    prisma.errorLog.findMany({
      where: whereClause,
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
    prisma.errorLog.count({ where: whereClause })
  ]);
  
  // Get error summary
  const errorSummary = await Promise.all([
    prisma.errorLog.count({
      where: {
        severity: 'CRITICAL',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.errorLog.count({
      where: {
        severity: 'WARNING',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.errorLog.count({
      where: {
        severity: 'INFO',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);
  
  // Get error trends
  const errorTrends = await prisma.errorLog.groupBy({
    by: ['severity'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  
  // Get most common errors
  const commonErrors = await prisma.errorLog.groupBy({
    by: ['message'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });
  
  return json({
    admin,
    errorLogs,
    totalCount,
    errorSummary: {
      critical: errorSummary[0],
      warning: errorSummary[1],
      info: errorSummary[2]
    },
    errorTrends: errorTrends.map(trend => ({
      severity: trend.severity,
      count: trend._count.id
    })),
    commonErrors: commonErrors.map(error => ({
      message: error.message,
      count: error._count.id
    })),
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { severity, type, status, date, search }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  
  try {
    if (action === 'mark_resolved') {
      const errorId = formData.get('errorId') as string;
      const resolution = formData.get('resolution') as string;
      
      await prisma.errorLog.update({
        where: { id: errorId },
        data: {
          status: 'RESOLVED',
          resolution,
          resolvedAt: new Date(),
          resolvedBy: admin.id
        }
      });
      
      await logAdminAction(admin.id, 'RESOLVE_ERROR', `Resolved error ${errorId}`, request);
      
    } else if (action === 'assign_error') {
      const errorId = formData.get('errorId') as string;
      const assigneeId = formData.get('assigneeId') as string;
      
      await prisma.errorLog.update({
        where: { id: errorId },
        data: {
          assignedTo: assigneeId,
          status: 'ASSIGNED'
        }
      });
      
      await logAdminAction(admin.id, 'ASSIGN_ERROR', `Assigned error ${errorId}`, request);
      
    } else if (action === 'reopen_error') {
      const errorId = formData.get('errorId') as string;
      const reason = formData.get('reason') as string;
      
      await prisma.errorLog.update({
        where: { id: errorId },
        data: {
          status: 'OPEN',
          reopenedAt: new Date(),
          reopenedBy: admin.id,
          reopenReason: reason
        }
      });
      
      await logAdminAction(admin.id, 'REOPEN_ERROR', `Reopened error ${errorId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error logs action error:', error);
    return json({ success: false, error: 'Failed to perform action' }, { status: 500 });
  }
}

export default function ErrorLogs() {
  const { 
    admin, 
    errorLogs, 
    totalCount, 
    errorSummary, 
    errorTrends, 
    commonErrors, 
    pagination, 
    filters 
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedError, setExpandedError] = useState<string | null>(null);
  
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'text-green-600';
      case 'OPEN': return 'text-red-600';
      case 'ASSIGNED': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
          <p className="text-gray-600">Monitor and track system errors and issues</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>
      
      {/* Error Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">{errorSummary.critical}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-gray-900">{errorSummary.warning}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Info</p>
              <p className="text-2xl font-bold text-gray-900">{errorSummary.info}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Error Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Error Trends (Last 7 Days)</h2>
          </div>
          
          <div className="space-y-3">
            {errorTrends.map((trend) => (
              <div key={trend.severity} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(trend.severity)}
                  <span className="text-sm font-medium text-gray-900">{trend.severity}</span>
                </div>
                <span className="text-sm text-gray-600">{trend.count} errors</span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bug className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Most Common Errors</h2>
          </div>
          
          <div className="space-y-3">
            {commonErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{error.message}</p>
                </div>
                <span className="text-sm text-gray-600">{error.count} times</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Error Logs Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Error Logs</h2>
          <div className="flex items-center space-x-4">
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="database">Database</option>
              <option value="payment">Payment</option>
              <option value="email">Email</option>
              <option value="api">API</option>
              <option value="system">System</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Last Hour</option>
              <option value="24">Last 24 Hours</option>
              <option value="168">Last 7 Days</option>
              <option value="720">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            
            <input
              type="text"
              placeholder="Search errors..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {errorLogs.map((error) => (
            <div key={error.id} className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  {getSeverityIcon(error.severity)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                      <span className="text-sm text-gray-600">{formatTimeAgo(error.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{error.message}</p>
                    <p className="text-xs text-gray-600">
                      {error.user?.name} • {error.page} • {error.browser} • {error.ipAddress}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getStatusColor(error.status)}`}>
                    {error.status}
                  </span>
                  <Button
                    onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {expandedError === error.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                      <p className="text-sm text-gray-700">{error.details}</p>
                    </div>
                    
                    {error.errorCode && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Error Code</h4>
                        <p className="text-sm text-gray-700 font-mono">{error.errorCode}</p>
                      </div>
                    )}
                    
                    {error.stackTrace && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Stack Trace</h4>
                        <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                          {error.stackTrace}
                        </pre>
                      </div>
                    )}
                    
                    {error.resolution && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Resolution</h4>
                        <p className="text-sm text-gray-700">{error.resolution}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Resolved by {error.resolvedBy} on {new Date(error.resolvedAt || '').toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {error.status === 'OPEN' && (
                        <Button
                          onClick={() => {
                            const resolution = prompt('Enter resolution details:');
                            if (resolution) {
                              // Handle mark resolved
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                      
                      {error.status === 'RESOLVED' && (
                        <Button
                          onClick={() => {
                            const reason = prompt('Enter reason for reopening:');
                            if (reason) {
                              // Handle reopen
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page - 1).toString());
                setSearchParams(newParams);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page + 1).toString());
                setSearchParams(newParams);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Export Options */}
      <div className="flex items-center justify-center space-x-4">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV Export
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          JSON Export
        </Button>
        <Button variant="outline">
          <Mail className="w-4 h-4 mr-2" />
          Send to Developer
        </Button>
      </div>
    </div>
  );
}
