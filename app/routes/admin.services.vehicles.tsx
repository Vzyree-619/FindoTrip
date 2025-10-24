import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Car, 
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
  Zap,
  Wrench,
  Shield,
  Fuel
} from "lucide-react";
import { useState } from "react";

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
  
  // Build where clause for vehicles
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (status === 'active') {
    whereClause.available = true;
    whereClause.approvalStatus = 'APPROVED';
  } else if (status === 'inactive') {
    whereClause.available = false;
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
    whereClause.averageRating = { gte: minRating };
  }
  
  if (owner) {
    whereClause.owner = {
      OR: [
        { businessName: { contains: owner, mode: 'insensitive' } },
        { businessEmail: { contains: owner, mode: 'insensitive' } },
        { user: { name: { contains: owner, mode: 'insensitive' } } },
        { user: { email: { contains: owner, mode: 'insensitive' } } }
      ]
    };
  }
  
  // Get vehicles with detailed information
  const [vehicles, totalCount] = await Promise.all([
    prisma.vehicle.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            verified: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : 
               sort === 'oldest' ? { createdAt: 'asc' } :
               sort === 'price_low' ? { basePrice: 'asc' } :
               sort === 'price_high' ? { basePrice: 'desc' } :
               sort === 'rating' ? { averageRating: 'desc' } :
               sort === 'bookings' ? { bookings: { _count: 'desc' } } :
               { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.vehicle.count({ where: whereClause })
  ]);

  
  // Calculate additional metrics for each vehicle
  const vehiclesWithMetrics = await Promise.all(
    vehicles.map(async (vehicle) => {
      // Get total revenue
      const totalRevenue = await prisma.vehicleBooking.aggregate({
        where: {
          vehicleId: vehicle.id,
          status: 'COMPLETED'
        },
        _sum: {
          totalPrice: true
        }
      });
      
      // Get last booking date
      const lastBooking = await prisma.vehicleBooking.findFirst({
        where: { vehicleId: vehicle.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      
      // Get utilization rate
      const totalBookings = vehicle._count.bookings;
      const daysSinceCreated = Math.floor((Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const utilizationRate = daysSinceCreated > 0 ? (totalBookings / daysSinceCreated) * 100 : 0;
      
      // Get insurance status (simplified)
      const insuranceStatus = 'Valid'; // This would come from actual insurance data
      
      // Get maintenance status (simplified)
      const maintenanceStatus = 'Up to Date'; // This would come from actual maintenance data
      
      // Compute display status
      let displayStatus = 'UNKNOWN';
      if (vehicle.approvalStatus === 'PENDING') {
        displayStatus = 'PENDING';
      } else if (vehicle.approvalStatus === 'REJECTED') {
        displayStatus = 'REJECTED';
      } else if (vehicle.approvalStatus === 'APPROVED' && vehicle.available) {
        displayStatus = 'ACTIVE';
      } else if (vehicle.approvalStatus === 'APPROVED' && !vehicle.available) {
        displayStatus = 'INACTIVE';
      }

      return {
        ...vehicle,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        lastBookingDate: lastBooking?.createdAt,
        utilizationRate: Math.min(utilizationRate, 100),
        insuranceStatus,
        maintenanceStatus,
        displayStatus
      };
    })
  );
  
  // Get counts
  const counts = await Promise.all([
    prisma.vehicle.count({ where: { available: true, approvalStatus: 'APPROVED' } }),
    prisma.vehicle.count({ where: { available: false } }),
    prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.vehicle.count()
  ]);
  
  return json({
    admin,
    vehicles: vehiclesWithMetrics,
    totalCount,
    counts: {
      active: counts[0],
      inactive: counts[1],
      pending: counts[2],
      total: counts[3]
    },
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

export default function VehiclesManagement() {
  const { admin, vehicles, totalCount, counts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  
  const handleSelectAll = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map(v => v.id));
    }
  };
  
  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">Manage all vehicles across the platform</p>
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
              <Car className="w-6 h-6 text-blue-600" />
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
          
          <Button variant="outline" size="sm">
            <Crown className="w-4 h-4 mr-2" />
            Featured Vehicles
          </Button>
          
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Boosted Listings
          </Button>
          
          <Button variant="outline" size="sm">
            <Wrench className="w-4 h-4 mr-2" />
            Maintenance Due
          </Button>
          
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Insurance Valid
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
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="COUPE">Coupe</option>
              <option value="CONVERTIBLE">Convertible</option>
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
              <option value="Islamabad">Islamabad</option>
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Rawalpindi">Rawalpindi</option>
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
              <option value="0-2000">PKR 0 - 2,000</option>
              <option value="2000-5000">PKR 2,000 - 5,000</option>
              <option value="5000-10000">PKR 5,000 - 10,000</option>
              <option value="10000-20000">PKR 10,000+</option>
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
              placeholder="Search vehicles..."
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
              {selectedVehicles.length === vehicles.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedVehicles.length > 0 && (
              <Button variant="outline" size="sm">
                Export Selected ({selectedVehicles.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Vehicles Grid/List */}
      {filters.view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="relative">
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ display: vehicle.images && vehicle.images.length > 0 ? 'none' : 'flex' }}>
                    <Car className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle.displayStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    vehicle.displayStatus === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                    vehicle.displayStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vehicle.displayStatus}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{(vehicle.averageRating || 0).toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{vehicle.city}</span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    PKR {(vehicle.basePrice || 0).toLocaleString()}/day
                  </div>
                  <div className="text-sm text-gray-600">
                    {vehicle._count.bookings} rentals
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{vehicle.owner.user.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">PKR {(vehicle.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="font-medium">{(vehicle.utilizationRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Insurance:</span>
                    <span className={`font-medium ${
                      vehicle.insuranceStatus === 'Valid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {vehicle.insuranceStatus}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
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
                      checked={selectedVehicles.length === vehicles.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
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
                    Rentals
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
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicles Found</h3>
                      <p className="text-gray-600">No vehicles match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.includes(vehicle.id)}
                          onChange={() => handleSelectVehicle(vehicle.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                            {vehicle.images && vehicle.images.length > 0 ? (
                              <img 
                                src={vehicle.images[0]} 
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg" style={{ display: vehicle.images && vehicle.images.length > 0 ? 'none' : 'flex' }}>
                              <Car className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vehicle.brand} {vehicle.model}</div>
                            <div className="text-sm text-gray-500">{vehicle.city}</div>
                            <div className="text-xs text-gray-400">{vehicle.type} • {vehicle.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.owner.user.name}</div>
                        <div className="text-sm text-gray-500">{vehicle.owner.user.email}</div>
                        <div className="flex items-center space-x-1 mt-1">
                          {vehicle.owner.verified && (
                            <span className="px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {vehicle.owner.user.active ? (
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
                          PKR {(vehicle.basePrice || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per day</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {(vehicle.averageRating || 0).toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({vehicle._count.reviews})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{vehicle._count.bookings}</div>
                          <div className="text-xs text-gray-500">
                            {(vehicle.utilizationRate || 0).toFixed(1)}% utilization
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">PKR {(vehicle.totalRevenue || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Total earned</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            vehicle.displayStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            vehicle.displayStatus === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                            vehicle.displayStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {vehicle.displayStatus}
                          </span>
                          <div className="text-xs text-gray-500">
                            Insurance: {vehicle.insuranceStatus}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
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
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} vehicles
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
