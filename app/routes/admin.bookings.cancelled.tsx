import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Calendar, 
  Building, 
  Car, 
  MapPin, 
  User,
  Search,
  Filter,
  Download,
  Eye,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  DollarSign,
  MapPin as LocationIcon,
  AlertTriangle
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const type = url.searchParams.get('type') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for cancelled bookings
  const whereClause: any = {
    status: 'CANCELLED'
  };
  
  if (search) {
    whereClause.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get cancelled bookings
  const [propertyBookings, vehicleBookings, tourBookings] = await Promise.all([
    type === 'all' || type === 'properties' ? 
    prisma.propertyBooking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            basePrice: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }) : [],
    
    type === 'all' || type === 'vehicles' ? 
    prisma.vehicleBooking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            category: true,
            city: true,
            basePrice: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }) : [],
    
    type === 'all' || type === 'tours' ? 
    prisma.tourBooking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        tour: {
          select: {
            id: true,
            title: true,
            city: true,
            difficulty: true,
            pricePerPerson: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }) : []
  ]);
  
  // Get counts
  const counts = await Promise.all([
    prisma.propertyBooking.count({ where: { status: 'CANCELLED' } }),
    prisma.vehicleBooking.count({ where: { status: 'CANCELLED' } }),
    prisma.tourBooking.count({ where: { status: 'CANCELLED' } })
  ]);
  
  const allBookings = [
    ...propertyBookings.map(b => ({ ...b, bookingType: 'property' as const })),
    ...vehicleBookings.map(b => ({ ...b, bookingType: 'vehicle' as const })),
    ...tourBookings.map(b => ({ ...b, bookingType: 'tour' as const }))
  ];
  
  return json({
    admin,
    allBookings,
    totalCount: allBookings.length,
    counts: {
      properties: counts[0],
      vehicles: counts[1],
      tours: counts[2],
      total: counts[0] + counts[1] + counts[2]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(allBookings.length / limit),
      hasNext: page < Math.ceil(allBookings.length / limit),
      hasPrev: page > 1
    },
    filters: { search, type, sort, dateFrom, dateTo }
  });
}

export default function CancelledBookings() {
  const { admin, allBookings, totalCount, counts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'property': return Building;
      case 'vehicle': return Car;
      case 'tour': return MapPin;
      default: return Calendar;
    }
  };
  
  const getBookingColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-blue-100 text-blue-800';
      case 'vehicle': return 'bg-green-100 text-green-800';
      case 'tour': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cancelled Bookings</h1>
          <p className="text-gray-600">View all cancelled bookings across the platform</p>
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
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{counts.properties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{counts.vehicles}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tours</p>
              <p className="text-2xl font-bold text-gray-900">{counts.tours}</p>
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
              <option value="properties">Properties ({counts.properties})</option>
              <option value="vehicles">Vehicles ({counts.vehicles})</option>
              <option value="tours">Tours ({counts.tours})</option>
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
              placeholder="Search cancelled bookings..."
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
      
      {/* Bookings List */}
      <div className="space-y-4">
        {allBookings.length === 0 ? (
          <Card className="p-8 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cancelled Bookings</h3>
            <p className="text-gray-600">No cancelled bookings match your current filters.</p>
          </Card>
        ) : (
          allBookings.map((booking) => {
            const BookingIcon = getBookingIcon(booking.bookingType);
            const service = booking.bookingType === 'property' ? booking.property :
                           booking.bookingType === 'vehicle' ? booking.vehicle :
                           booking.tour;
            
            return (
              <Card key={booking.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BookingIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.bookingType === 'property' ? service?.name :
                         booking.bookingType === 'vehicle' ? `${service?.brand} ${service?.model}` :
                         service?.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingColor(booking.bookingType)}`}>
                        {booking.bookingType.toUpperCase()}
                      </span>
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">CANCELLED</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{booking.user?.name} ({booking.user?.email})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Cancelled {new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>PKR {booking.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <LocationIcon className="w-4 h-4" />
                        <span>{service?.city}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {booking.bookingType === 'property' ? 
                            `${new Date(booking.checkInTime || booking.createdAt).toLocaleDateString()} - ${new Date(booking.checkOutTime || booking.createdAt).toLocaleDateString()}` :
                           booking.bookingType === 'vehicle' ?
                            `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}` :
                            `${new Date(booking.tourDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    
                    {booking.cancellationReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">Cancellation Reason:</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{booking.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/bookings/${booking.bookingType}/${booking.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
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
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} cancelled bookings
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
