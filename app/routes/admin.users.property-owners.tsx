import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  Building, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  DollarSign,
  TrendingUp,
  Activity,
  MessageSquare,
  MoreHorizontal,
  UserCheck,
  UserX,
  Settings,
  AlertTriangle,
  Award,
  Flag,
  Ban,
  Calendar,
  MapPin,
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
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (status === 'verified') {
    whereClause.verified = true;
  } else if (status === 'unverified') {
    whereClause.verified = false;
  } else if (status === 'active') {
    whereClause.active = true;
  } else if (status === 'inactive') {
    whereClause.active = false;
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
            verificationLevel: true,
            totalRevenue: true,
            totalProperties: true
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
  
  // Calculate additional metrics for each owner
  const ownersWithMetrics = await Promise.all(
    propertyOwners.map(async (owner) => {
      // Get total revenue from properties
      const totalRevenue = await prisma.propertyBooking.aggregate({
        where: {
          property: {
            ownerId: owner.id
          },
          status: 'COMPLETED'
        },
        _sum: {
          totalPrice: true
        }
      });
      
      // Get average rating
      const avgRating = await prisma.review.aggregate({
        where: {
          property: {
            ownerId: owner.id
          }
        },
        _avg: {
          rating: true
        }
      });
      
      // Get response rate (simplified calculation)
      const totalBookings = await prisma.propertyBooking.count({
        where: {
          property: {
            ownerId: owner.id
          }
        }
      });
      
      const respondedBookings = await prisma.propertyBooking.count({
        where: {
          property: {
            ownerId: owner.id
          },
          status: { in: ['CONFIRMED', 'CANCELLED'] }
        }
      });
      
      const responseRate = totalBookings > 0 ? (respondedBookings / totalBookings) * 100 : 0;
      
      // Get cancellation rate
      const cancelledBookings = await prisma.propertyBooking.count({
        where: {
          property: {
            ownerId: owner.id
          },
          status: 'CANCELLED'
        }
      });
      
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      
      // Calculate account health score (0-100)
      const healthScore = Math.max(0, Math.min(100, 
        (responseRate * 0.3) + 
        ((100 - cancellationRate) * 0.3) + 
        (avgRating._avg.rating ? avgRating._avg.rating * 20 : 0) + 
        (owner.verified ? 20 : 0)
      ));
      
      return {
        ...owner,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        averageRating: avgRating._avg.rating || 0,
        responseRate,
        cancellationRate,
        healthScore
      };
    })
  );
  
  // Get counts
  const counts = await Promise.all([
    prisma.user.count({ where: { role: 'PROPERTY_OWNER' } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', verified: true } }),
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', active: true } }),
    prisma.user.count({ 
      where: { 
        role: 'PROPERTY_OWNER',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })
  ]);
  
  // Get top performers
  const topPerformers = await prisma.user.findMany({
    where: { role: 'PROPERTY_OWNER' },
    include: {
      _count: {
        select: {
          propertyBookings: true
        }
      }
    },
    orderBy: {
      propertyBookings: {
        _count: 'desc'
      }
    },
    take: 5
  });
  
  return json({
    admin,
    propertyOwners: ownersWithMetrics,
    totalCount,
    counts: {
      total: counts[0],
      verified: counts[1],
      active: counts[2],
      newThisMonth: counts[3]
    },
    topPerformers,
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

export default function PropertyOwners() {
  const { admin, propertyOwners, totalCount, counts, topPerformers, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Owners</h1>
          <p className="text-gray-600">Manage property owners and their business performance</p>
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
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Owners</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{counts.verified}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{counts.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">{counts.newThisMonth}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quick Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
          </div>
          
          <Button variant="outline" size="sm">
            <Award className="w-4 h-4 mr-2" />
            Top Performers
          </Button>
          
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            New Owners (&lt; 30 days)
          </Button>
          
          <Button variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Inactive (90+ days)
          </Button>
          
          <Button variant="outline" size="sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Verified Only
          </Button>
          
          <Button variant="outline" size="sm">
            <Flag className="w-4 h-4 mr-2" />
            Pending Properties
          </Button>
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
              <option value="verified">Verified ({counts.verified})</option>
              <option value="unverified">Unverified</option>
              <option value="active">Active ({counts.active})</option>
              <option value="inactive">Inactive</option>
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
              <option value="revenue">Highest Revenue</option>
              <option value="bookings">Most Bookings</option>
              <option value="rating">Highest Rating</option>
            </select>
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
      
      {/* Property Owners Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propertyOwners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Owners Found</h3>
                    <p className="text-gray-600">No property owners match your current filters.</p>
                  </td>
                </tr>
              ) : (
                propertyOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                          <Building className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                          <div className="text-sm text-gray-500">{owner.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {owner.verified && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                            {owner.isActive ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{owner.propertyOwner?.totalProperties || 0}</div>
                        <div className="text-gray-500">
                          {owner.propertyOwner?.totalProperties || 0} total
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{owner._count.propertyBookings}</div>
                        <div className="text-gray-500">
                          {owner.responseRate.toFixed(1)}% response rate
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">PKR {owner.totalRevenue.toLocaleString()}</div>
                        <div className="text-gray-500">
                          {owner.cancellationRate.toFixed(1)}% cancellation
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {owner.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span>{owner.responseRate.toFixed(1)}%</span>
                        </div>
                        <div className="text-gray-500 text-xs">
                          Response Rate
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(owner.healthScore)}`}>
                          {owner.healthScore.toFixed(0)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {getHealthScoreLabel(owner.healthScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/users/${owner.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
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
    </div>
  );
}