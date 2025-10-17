import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MapPin, 
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
  Shield
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const category = url.searchParams.get('category') || 'all';
  const location = url.searchParams.get('location') || 'all';
  const priceRange = url.searchParams.get('priceRange') || 'all';
  const rating = url.searchParams.get('rating') || 'all';
  const guide = url.searchParams.get('guide') || '';
  const sort = url.searchParams.get('sort') || 'newest';
  const view = url.searchParams.get('view') || 'grid';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for tours
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (status === 'active') {
    whereClause.status = 'ACTIVE';
  } else if (status === 'inactive') {
    whereClause.status = 'INACTIVE';
  } else if (status === 'pending') {
    whereClause.status = 'PENDING';
  } else if (status === 'rejected') {
    whereClause.status = 'REJECTED';
  }
  
  if (category !== 'all') {
    whereClause.category = category;
  }
  
  if (location !== 'all') {
    whereClause.city = { contains: location, mode: 'insensitive' };
  }
  
  if (priceRange !== 'all') {
    const [min, max] = priceRange.split('-').map(Number);
    whereClause.pricePerPerson = {};
    if (min) whereClause.pricePerPerson.gte = min;
    if (max) whereClause.pricePerPerson.lte = max;
  }
  
  if (rating !== 'all') {
    const minRating = parseFloat(rating);
    whereClause.averageRating = { gte: minRating };
  }
  
  if (guide) {
    whereClause.guide = {
      OR: [
        { name: { contains: guide, mode: 'insensitive' } },
        { email: { contains: guide, mode: 'insensitive' } }
      ]
    };
  }
  
  // Get tours with detailed information
  const [tours, totalCount] = await Promise.all([
    prisma.tour.findMany({
      where: whereClause,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
            verified: true,
            isActive: true
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
               sort === 'price_low' ? { pricePerPerson: 'asc' } :
               sort === 'price_high' ? { pricePerPerson: 'desc' } :
               sort === 'rating' ? { averageRating: 'desc' } :
               sort === 'bookings' ? { bookings: { _count: 'desc' } } :
               { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.tour.count({ where: whereClause })
  ]);
  
  // Calculate additional metrics for each tour
  const toursWithMetrics = await Promise.all(
    tours.map(async (tour) => {
      // Get total revenue
      const totalRevenue = await prisma.tourBooking.aggregate({
        where: {
          tourId: tour.id,
          status: 'COMPLETED'
        },
        _sum: {
          totalPrice: true
        }
      });
      
      // Get last booking date
      const lastBooking = await prisma.tourBooking.findFirst({
        where: { tourId: tour.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      
      // Get utilization rate
      const totalBookings = tour._count.bookings;
      const daysSinceCreated = Math.floor((Date.now() - new Date(tour.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const utilizationRate = daysSinceCreated > 0 ? (totalBookings / daysSinceCreated) * 100 : 0;
      
      // Get languages offered (simplified)
      const languagesOffered = ['English', 'Urdu']; // This would come from actual data
      
      // Get certification status (simplified)
      const certificationStatus = 'Certified'; // This would come from actual data
      
      return {
        ...tour,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        lastBookingDate: lastBooking?.createdAt,
        utilizationRate: Math.min(utilizationRate, 100),
        languagesOffered,
        certificationStatus
      };
    })
  );
  
  // Get counts
  const counts = await Promise.all([
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
    prisma.tour.count({ where: { status: 'INACTIVE' } }),
    prisma.tour.count({ where: { status: 'PENDING' } }),
    prisma.tour.count()
  ]);
  
  return json({
    admin,
    tours: toursWithMetrics,
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
    filters: { search, status, category, location, priceRange, rating, guide, sort, view }
  });
}

export default function ToursManagement() {
  const { admin, tours, totalCount, counts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  
  const handleSelectAll = () => {
    if (selectedTours.length === tours.length) {
      setSelectedTours([]);
    } else {
      setSelectedTours(tours.map(t => t.id));
    }
  };
  
  const handleSelectTour = (tourId: string) => {
    setSelectedTours(prev => 
      prev.includes(tourId) 
        ? prev.filter(id => id !== tourId)
        : [...prev, tourId]
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tour Management</h1>
          <p className="text-gray-600">Manage all tours across the platform</p>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
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
            Featured Tours
          </Button>
          
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Boosted Listings
          </Button>
          
          <Button variant="outline" size="sm">
            <Globe className="w-4 h-4 mr-2" />
            Multi-Language
          </Button>
          
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Certified Guides
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
            <label className="text-sm text-gray-600">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('category', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="CULTURAL">Cultural</option>
              <option value="ADVENTURE">Adventure</option>
              <option value="HISTORICAL">Historical</option>
              <option value="NATURE">Nature</option>
              <option value="FOOD">Food</option>
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
              <option value="0-1000">PKR 0 - 1,000</option>
              <option value="1000-3000">PKR 1,000 - 3,000</option>
              <option value="3000-5000">PKR 3,000 - 5,000</option>
              <option value="5000-10000">PKR 5,000+</option>
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
              placeholder="Search tours..."
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
              {selectedTours.length === tours.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedTours.length > 0 && (
              <Button variant="outline" size="sm">
                Export Selected ({selectedTours.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Tours Grid/List */}
      {filters.view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <Card key={tour.id} className="overflow-hidden">
              <div className="relative">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-gray-400" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tour.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    tour.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                    tour.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tour.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{tour.title}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{tour.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tour.city}</span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    PKR {tour.pricePerPerson.toLocaleString()}/person
                  </div>
                  <div className="text-sm text-gray-600">
                    {tour._count.bookings} bookings
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Guide:</span>
                    <span className="font-medium">{tour.guide.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">PKR {tour.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{tour.duration} hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Languages:</span>
                    <span className="font-medium">{tour.languagesOffered.length}</span>
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
                      checked={selectedTours.length === tours.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guide
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
                {tours.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tours Found</h3>
                      <p className="text-gray-600">No tours match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTours.includes(tour.id)}
                          onChange={() => handleSelectTour(tour.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                            <MapPin className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tour.title}</div>
                            <div className="text-sm text-gray-500">{tour.city}</div>
                            <div className="text-xs text-gray-400">{tour.category} • {tour.duration}h</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.guide.name}</div>
                        <div className="text-sm text-gray-500">{tour.guide.email}</div>
                        <div className="flex items-center space-x-1 mt-1">
                          {tour.guide.verified && (
                            <span className="px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {tour.guide.isActive ? (
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
                          PKR {tour.pricePerPerson.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per person</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {tour.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({tour._count.reviews})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{tour._count.bookings}</div>
                          <div className="text-xs text-gray-500">
                            {tour.utilizationRate.toFixed(1)}% utilization
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">PKR {tour.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Total earned</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tour.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            tour.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                            tour.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tour.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            Languages: {tour.languagesOffered.length}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} tours
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
