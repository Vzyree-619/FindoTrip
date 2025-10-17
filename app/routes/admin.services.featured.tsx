import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Building, 
  Car, 
  MapPin,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
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
  BarChart3,
  Plus,
  Trash2,
  EyeOff,
  Eye as EyeIcon,
  Map,
  Grid,
  List,
  Crown,
  Zap,
  Globe,
  BookOpen,
  Users,
  Shield,
  Target,
  Timer,
  Sparkles
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const type = url.searchParams.get('type') || 'all';
  const status = url.searchParams.get('status') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for featured services
  const whereClause: any = {
    OR: [
      { featured: true },
      { boosted: true }
    ]
  };
  
  if (search) {
    whereClause.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      }
    ];
  }
  
  if (type === 'property') {
    whereClause.AND = [{ featured: true }];
  } else if (type === 'vehicle') {
    whereClause.AND = [{ boosted: true }];
  } else if (type === 'tour') {
    whereClause.AND = [{ featured: true }];
  }
  
  if (status === 'active') {
    whereClause.AND = [{ status: 'ACTIVE' }];
  } else if (status === 'inactive') {
    whereClause.AND = [{ status: 'INACTIVE' }];
  }
  
  // Get featured properties
  const featuredProperties = await prisma.property.findMany({
    where: {
      featured: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    },
    orderBy: { featuredAt: 'desc' }
  });
  
  // Get boosted vehicles
  const boostedVehicles = await prisma.vehicle.findMany({
    where: {
      boosted: true,
      ...(search && {
        OR: [
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    },
    orderBy: { boostedAt: 'desc' }
  });
  
  // Get featured tours
  const featuredTours = await prisma.tour.findMany({
    where: {
      featured: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    },
    orderBy: { featuredAt: 'desc' }
  });
  
  // Calculate metrics
  const featuredPropertiesWithMetrics = await Promise.all(
    featuredProperties.map(async (property) => {
      const totalRevenue = await prisma.propertyBooking.aggregate({
        where: {
          propertyId: property.id,
          status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      });
      
      return {
        ...property,
        type: 'PROPERTY',
        totalRevenue: totalRevenue._sum.totalPrice || 0
      };
    })
  );
  
  const boostedVehiclesWithMetrics = await Promise.all(
    boostedVehicles.map(async (vehicle) => {
      const totalRevenue = await prisma.vehicleBooking.aggregate({
        where: {
          vehicleId: vehicle.id,
          status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      });
      
      return {
        ...vehicle,
        type: 'VEHICLE',
        totalRevenue: totalRevenue._sum.totalPrice || 0
      };
    })
  );
  
  const featuredToursWithMetrics = await Promise.all(
    featuredTours.map(async (tour) => {
      const totalRevenue = await prisma.tourBooking.aggregate({
        where: {
          tourId: tour.id,
          status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      });
      
      return {
        ...tour,
        type: 'TOUR',
        totalRevenue: totalRevenue._sum.totalPrice || 0
      };
    })
  );
  
  // Combine all featured services
  const allFeaturedServices = [
    ...featuredPropertiesWithMetrics,
    ...boostedVehiclesWithMetrics,
    ...featuredToursWithMetrics
  ];
  
  // Get counts
  const counts = await Promise.all([
    prisma.property.count({ where: { featured: true } }),
    prisma.vehicle.count({ where: { boosted: true } }),
    prisma.tour.count({ where: { featured: true } }),
    allFeaturedServices.length
  ]);
  
  return json({
    admin,
    featuredServices: allFeaturedServices,
    totalCount: allFeaturedServices.length,
    counts: {
      featuredProperties: counts[0],
      boostedVehicles: counts[1],
      featuredTours: counts[2],
      total: counts[3]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(allFeaturedServices.length / limit),
      hasNext: page < Math.ceil(allFeaturedServices.length / limit),
      hasPrev: page > 1
    },
    filters: { search, type, status, sort }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const serviceId = formData.get('serviceId') as string;
  const serviceType = formData.get('serviceType') as string;
  const duration = formData.get('duration') as string;
  
  try {
    if (action === 'remove_featured') {
      if (serviceType === 'PROPERTY') {
        await prisma.property.update({
          where: { id: serviceId },
          data: { featured: false, featuredAt: null }
        });
      } else if (serviceType === 'VEHICLE') {
        await prisma.vehicle.update({
          where: { id: serviceId },
          data: { boosted: false, boostedAt: null }
        });
      } else if (serviceType === 'TOUR') {
        await prisma.tour.update({
          where: { id: serviceId },
          data: { featured: false, featuredAt: null }
        });
      }
      
      await logAdminAction(admin.id, 'REMOVE_FEATURED', `Removed ${serviceType} from featured services`, request);
      
    } else if (action === 'extend_promotion') {
      const extendDays = parseInt(duration);
      const newEndDate = new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000);
      
      if (serviceType === 'PROPERTY') {
        await prisma.property.update({
          where: { id: serviceId },
          data: { featuredUntil: newEndDate }
        });
      } else if (serviceType === 'VEHICLE') {
        await prisma.vehicle.update({
          where: { id: serviceId },
          data: { boostedUntil: newEndDate }
        });
      } else if (serviceType === 'TOUR') {
        await prisma.tour.update({
          where: { id: serviceId },
          data: { featuredUntil: newEndDate }
        });
      }
      
      await logAdminAction(admin.id, 'EXTEND_PROMOTION', `Extended ${serviceType} promotion by ${extendDays} days`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Featured services action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function FeaturedServicesManagement() {
  const { admin, featuredServices, totalCount, counts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [promotionModal, setPromotionModal] = useState<{ open: boolean; serviceId: string; serviceType: string }>({
    open: false,
    serviceId: '',
    serviceType: ''
  });
  const [duration, setDuration] = useState('30');
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedServices.length === featuredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(featuredServices.map(s => s.id));
    }
  };
  
  const handleSelectService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  const handleRemoveFeatured = (serviceId: string, serviceType: string) => {
    const formData = new FormData();
    formData.append('action', 'remove_featured');
    formData.append('serviceId', serviceId);
    formData.append('serviceType', serviceType);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleExtendPromotion = () => {
    const formData = new FormData();
    formData.append('action', 'extend_promotion');
    formData.append('serviceId', promotionModal.serviceId);
    formData.append('serviceType', promotionModal.serviceType);
    formData.append('duration', duration);
    fetcher.submit(formData, { method: 'post' });
    
    setPromotionModal({ open: false, serviceId: '', serviceType: '' });
    setDuration('30');
  };
  
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'PROPERTY': return Building;
      case 'VEHICLE': return Car;
      case 'TOUR': return MapPin;
      default: return Star;
    }
  };
  
  const getServiceColor = (type: string) => {
    switch (type) {
      case 'PROPERTY': return 'text-blue-600';
      case 'VEHICLE': return 'text-green-600';
      case 'TOUR': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Featured Services Management</h1>
          <p className="text-gray-600">Manage featured properties, boosted vehicles, and promoted tours</p>
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
              <p className="text-sm font-medium text-gray-600">Featured Properties</p>
              <p className="text-2xl font-bold text-gray-900">{counts.featuredProperties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Boosted Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{counts.boostedVehicles}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Featured Tours</p>
              <p className="text-2xl font-bold text-gray-900">{counts.featuredTours}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Promoted</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          </div>
          
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Featured Property
          </Button>
          
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Boost Vehicle
          </Button>
          
          <Button variant="outline" size="sm">
            <Crown className="w-4 h-4 mr-2" />
            Feature Tour
          </Button>
          
          <Button variant="outline" size="sm">
            <Timer className="w-4 h-4 mr-2" />
            Extend All Promotions
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
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filters.type}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('type', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="property">Properties ({counts.featuredProperties})</option>
              <option value="vehicle">Vehicles ({counts.boostedVehicles})</option>
              <option value="tour">Tours ({counts.featuredTours})</option>
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
              <option value="active">Active</option>
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
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search featured services..."
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
      
      {/* Featured Services List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedServices.length === featuredServices.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner/Guide
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promotion Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {featuredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Featured Services Found</h3>
                    <p className="text-gray-600">No services match your current filters.</p>
                  </td>
                </tr>
              ) : (
                featuredServices.map((service) => {
                  const ServiceIcon = getServiceIcon(service.type);
                  
                  return (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleSelectService(service.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                            <ServiceIcon className={`w-5 h-5 ${getServiceColor(service.type)}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {service.name || service.title || `${service.brand} ${service.model}`}
                            </div>
                            <div className="text-sm text-gray-500">{service.city}</div>
                            <div className="text-xs text-gray-400">{service.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {service.owner?.name || service.guide?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.owner?.email || service.guide?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {service.featured && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                          {service.boosted && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Boosted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{service._count.bookings} bookings</div>
                          <div className="text-xs text-gray-500">
                            {service._count.reviews} reviews
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">PKR {service.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Total earned</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {service.featuredAt ? new Date(service.featuredAt).toLocaleDateString() : 
                             service.boostedAt ? new Date(service.boostedAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {service.featuredUntil ? `Until ${new Date(service.featuredUntil).toLocaleDateString()}` :
                             service.boostedUntil ? `Until ${new Date(service.boostedUntil).toLocaleDateString()}` : 'No expiry'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPromotionModal({ open: true, serviceId: service.id, serviceType: service.type })}
                          >
                            <Timer className="w-4 h-4 mr-1" />
                            Extend
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveFeatured(service.id, service.type)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
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
      
      {/* Extend Promotion Modal */}
      {promotionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Extend Promotion</h3>
              <Button
                variant="outline"
                onClick={() => setPromotionModal({ open: false, serviceId: '', serviceType: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extension Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPromotionModal({ open: false, serviceId: '', serviceType: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExtendPromotion}
                  disabled={fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Extending...' : 'Extend Promotion'}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} featured services
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
