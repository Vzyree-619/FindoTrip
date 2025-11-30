import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
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
  BarChart3,
  Plus,
  Trash2,
  EyeOff,
  Eye as EyeIcon,
  Map,
  Grid,
  List,
  Crown,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const location = url.searchParams.get('location') || 'all';
  const priceRange = url.searchParams.get('priceRange') || 'all';
  const rating = url.searchParams.get('rating') || 'all';
  const owner = url.searchParams.get('owner') || '';
  const sort = url.searchParams.get('sort') || 'newest';
  const view = url.searchParams.get('view') || 'grid';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for properties
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (status === 'active') {
    whereClause.approvalStatus = 'APPROVED';
  } else if (status === 'inactive') {
    whereClause.approvalStatus = 'REJECTED';
  } else if (status === 'pending') {
    whereClause.approvalStatus = 'PENDING';
  } else if (status === 'rejected') {
    whereClause.approvalStatus = 'REJECTED';
  }
  
  if (type !== 'all') {
    whereClause.type = type;
  }
  
  if (location !== 'all') {
    whereClause.city = { contains: location, mode: 'insensitive' };
  }
  
  if (priceRange !== 'all') {
    const [min, max] = priceRange.split('-').map(Number);
    whereClause.basePrice = {};
    if (min) whereClause.basePrice.gte = min;
    if (max) whereClause.basePrice.lte = max;
  }
  
  if (rating !== 'all') {
    const minRating = parseFloat(rating);
    whereClause.rating = { gte: minRating };
  }
  
  if (owner) {
    whereClause.owner = {
      OR: [
        { businessName: { contains: owner, mode: 'insensitive' } },
        { businessEmail: { contains: owner, mode: 'insensitive' } }
      ]
    };
  }
  
  // Get properties with detailed information
  const [properties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            businessPhone: true,
            businessCity: true,
            verificationLevel: true,
            totalProperties: true,
            totalRevenue: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                verified: true,
                active: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        },
        roomTypes: {
          where: {
            available: true
          },
          select: {
            id: true,
            name: true,
            basePrice: true,
            currency: true,
            totalUnits: true,
            available: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : 
               sort === 'oldest' ? { createdAt: 'asc' } :
               sort === 'price_low' ? { basePrice: 'asc' } :
               sort === 'price_high' ? { basePrice: 'desc' } :
               sort === 'rating' ? { rating: 'desc' } :
               sort === 'bookings' ? { bookings: { _count: 'desc' } } :
               { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.property.count({ where: whereClause })
  ]);
  
  // Calculate additional metrics for each property
  const propertiesWithMetrics = await Promise.all(
    properties.map(async (property) => {
      // Get total revenue
      const totalRevenue = await prisma.propertyBooking.aggregate({
        where: {
          propertyId: property.id,
          status: 'COMPLETED'
        },
        _sum: {
          totalPrice: true
        }
      });
      
      // Get last booking date
      const lastBooking = await prisma.propertyBooking.findFirst({
        where: { propertyId: property.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      
      // Get utilization rate (bookings vs available days)
      const totalBookings = property._count.bookings;
      const daysSinceCreated = Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const utilizationRate = daysSinceCreated > 0 ? (totalBookings / daysSinceCreated) * 100 : 0;
      
      // Calculate room statistics
      const totalRoomTypes = property.roomTypes?.length || 0;
      const totalRoomUnits = property.roomTypes?.reduce((sum, r) => sum + (r.totalUnits || 0), 0) || 0;
      
      // Get room-specific bookings
      const roomBookings = await prisma.propertyBooking.count({
        where: {
          propertyId: property.id,
          roomTypeId: { not: null }
        }
      });
      
      return {
        ...property,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        lastBookingDate: lastBooking?.createdAt,
        utilizationRate: Math.min(utilizationRate, 100),
        totalRoomTypes,
        totalRoomUnits,
        roomBookings
      };
    })
  );
  
  // Get counts
  const counts = await Promise.all([
    prisma.property.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.property.count({ where: { approvalStatus: 'REJECTED' } }),
    prisma.property.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.property.count()
  ]);
  
  // Get top performing properties
  const topPerformers = await prisma.property.findMany({
    where: { approvalStatus: 'APPROVED' },
    include: {
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: {
      bookings: {
        _count: 'desc'
      }
    },
    take: 5
  });

  // Get unique cities for location dropdown
  const uniqueCities = await prisma.property.findMany({
    select: {
      city: true
    },
    distinct: ['city'],
    orderBy: {
      city: 'asc'
    }
  });
  
  return json({
    admin,
    properties: propertiesWithMetrics,
    totalCount,
    counts: {
      active: counts[0],
      inactive: counts[1],
      pending: counts[2],
      total: counts[3]
    },
    topPerformers,
    uniqueCities: uniqueCities.map(city => city.city),
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, status, type, location, priceRange, rating, owner, sort, view }
  });
}

export default function PropertiesManagement() {
  const { admin, properties, totalCount, counts, topPerformers, uniqueCities, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  // Debug: Log the actual data being loaded
  console.log('=== PROPERTIES DEBUG ===');
  console.log('Properties count:', properties.length);
  console.log('Total count:', totalCount);
  console.log('First property:', properties[0]);
  console.log('All property names:', properties.map(p => p.name));
  console.log('========================');
  
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[id^="dropdown-"]') && !target.closest('[id^="table-dropdown-"]')) {
        // Close all dropdowns
        document.querySelectorAll('[id^="dropdown-"], [id^="table-dropdown-"]').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const handleSelectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.id));
    }
  };
  
  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600">Manage all properties across the platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {totalCount} properties found
          </div>
          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Debug: {properties.length} loaded
          </div>
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
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{counts.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{counts.inactive}</p>
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
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('featured', 'true');
              setSearchParams(newParams);
            }}
          >
            <Crown className="w-4 h-4 mr-2" />
            Featured Properties
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('boosted', 'true');
              setSearchParams(newParams);
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Boosted Listings
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('flagged', 'true');
              setSearchParams(newParams);
            }}
          >
            <Flag className="w-4 h-4 mr-2" />
            Flagged for Review
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('highRevenue', 'true');
              setSearchParams(newParams);
            }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            High Revenue
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
              <option value="active">Active ({counts.active})</option>
              <option value="inactive">Inactive ({counts.inactive})</option>
              <option value="pending">Pending ({counts.pending})</option>
            </select>
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
              <option value="HOUSE">House</option>
              <option value="APARTMENT">Apartment</option>
              <option value="VILLA">Villa</option>
              <option value="CONDO">Condo</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Location:</label>
            <select
              value={filters.location}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('location', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Locations</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Price Range:</label>
            <select
              value={filters.priceRange}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('priceRange', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Any Price</option>
              <option value="0-5000">PKR 0 - 5,000</option>
              <option value="5000-10000">PKR 5,000 - 10,000</option>
              <option value="10000-20000">PKR 10,000 - 20,000</option>
              <option value="20000-50000">PKR 20,000+</option>
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
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
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
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rating</option>
              <option value="bookings">Most Bookings</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search properties..."
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
      
      {/* View Options */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex items-center space-x-2">
              <Button
                variant={filters.view === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('view', 'grid');
                  setSearchParams(newParams);
                }}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={filters.view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('view', 'list');
                  setSearchParams(newParams);
                }}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={filters.view === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('view', 'map');
                  setSearchParams(newParams);
                }}
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedProperties.length === properties.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedProperties.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Create CSV export
                  const csvData = selectedProperties.map(propertyId => {
                    const property = properties.find(p => p.id === propertyId);
                    return property ? `${property.name},${property.city},${property.basePrice},${property.approvalStatus}` : '';
                  }).join('\n');
                  
                  const csvContent = 'Name,City,Price,Status\n' + csvData;
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `selected-properties-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                Export Selected ({selectedProperties.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Properties Grid/List */}
      {filters.view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <Building className="w-12 h-12 text-gray-400" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    property.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    property.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {property.approvalStatus}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{property.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{property.rating ? property.rating.toFixed(1) : '0.0'}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{property.city}</span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    PKR {property.basePrice.toLocaleString()}/night
                  </div>
                  <div className="text-sm text-gray-600">
                    {property._count.bookings} bookings
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{property.owner.businessName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">PKR {property.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="font-medium">{property.utilizationRate ? property.utilizationRate.toFixed(1) : '0.0'}%</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      window.location.href = `/admin/properties/${property.id}`;
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      window.location.href = `/admin/properties/${property.id}/edit`;
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Toggle dropdown menu for this property
                      const dropdown = document.getElementById(`dropdown-${property.id}`);
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <div id={`dropdown-${property.id}`} className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          window.location.href = `/admin/properties/${property.id}/analytics`;
                        }}
                      >
                        View Analytics
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          window.location.href = `/admin/properties/${property.id}/bookings`;
                        }}
                      >
                        View Bookings
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          if (confirm(`Are you sure you want to ${property.approvalStatus === 'APPROVED' ? 'suspend' : 'approve'} this property?`)) {
                            // TODO: Implement approval/suspension logic
                            alert(`Property ${property.approvalStatus === 'APPROVED' ? 'suspended' : 'approved'}`);
                          }
                        }}
                      >
                        {property.approvalStatus === 'APPROVED' ? 'Suspend' : 'Approve'}
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
                            // TODO: Implement delete logic
                            alert('Property deleted');
                          }
                        }}
                      >
                        Delete Property
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProperties.length === properties.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
                      <p className="text-gray-600">No properties match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(property.id)}
                          onChange={() => handleSelectProperty(property.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                            <Building className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{property.name}</div>
                            <div className="text-sm text-gray-500">{property.city}</div>
                            <div className="text-xs text-gray-400">{property.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{property.owner.businessName}</div>
                        <div className="text-sm text-gray-500">{property.owner.businessEmail}</div>
                        <div className="flex items-center space-x-1 mt-1">
                          {property.owner.user.verified && (
                            <span className="px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {property.owner.user.active ? (
                            <span className="px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          PKR {property.basePrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per night</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {property.rating ? property.rating.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({property._count.reviews})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{property._count.bookings}</div>
                          <div className="text-xs text-gray-500">
                            {property.utilizationRate ? property.utilizationRate.toFixed(1) : '0.0'}% utilization
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">PKR {property.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Total earned</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          property.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          property.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          property.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {property.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 relative">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              window.location.href = `/admin/properties/${property.id}`;
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              window.location.href = `/admin/properties/${property.id}/edit`;
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Toggle dropdown menu for this property
                              const dropdown = document.getElementById(`table-dropdown-${property.id}`);
                              if (dropdown) {
                                dropdown.classList.toggle('hidden');
                              }
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          
                          {/* Dropdown Menu */}
                          <div id={`table-dropdown-${property.id}`} className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                            <div className="py-1">
                              <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  window.location.href = `/admin/properties/${property.id}/analytics`;
                                }}
                              >
                                View Analytics
                              </button>
                              <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  window.location.href = `/admin/properties/${property.id}/bookings`;
                                }}
                              >
                                View Bookings
                              </button>
                              <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to ${property.approvalStatus === 'APPROVED' ? 'suspend' : 'approve'} this property?`)) {
                                    // TODO: Implement approval/suspension logic
                                    alert(`Property ${property.approvalStatus === 'APPROVED' ? 'suspended' : 'approved'}`);
                                  }
                                }}
                              >
                                {property.approvalStatus === 'APPROVED' ? 'Suspend' : 'Approve'}
                              </button>
                              <button 
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
                                    // TODO: Implement delete logic
                                    alert('Property deleted');
                                  }
                                }}
                              >
                                Delete Property
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} properties
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
