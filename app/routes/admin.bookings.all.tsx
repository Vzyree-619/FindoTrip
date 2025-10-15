import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
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
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  DollarSign,
  MapPin as LocationIcon,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard,
  Receipt,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for bookings
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { property: { name: { contains: search, mode: 'insensitive' } } },
      { vehicle: { brand: { contains: search, mode: 'insensitive' } } },
      { tour: { title: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
  }
  
  // Get all bookings across all types
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
            basePrice: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
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
            basePrice: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
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
            pricePerPerson: true,
            guide: {
              select: {
                name: true,
                email: true
              }
            }
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
    prisma.propertyBooking.count(),
    prisma.vehicleBooking.count(),
    prisma.tourBooking.count(),
    prisma.propertyBooking.count({ where: { status: 'CONFIRMED' } }),
    prisma.vehicleBooking.count({ where: { status: 'CONFIRMED' } }),
    prisma.tourBooking.count({ where: { status: 'CONFIRMED' } }),
    prisma.propertyBooking.count({ where: { status: 'PENDING' } }),
    prisma.vehicleBooking.count({ where: { status: 'PENDING' } }),
    prisma.tourBooking.count({ where: { status: 'PENDING' } }),
    prisma.propertyBooking.count({ where: { status: 'CANCELLED' } }),
    prisma.vehicleBooking.count({ where: { status: 'CANCELLED' } }),
    prisma.tourBooking.count({ where: { status: 'CANCELLED' } })
  ]);
  
  // Get revenue statistics
  const revenueStats = await Promise.all([
    prisma.propertyBooking.aggregate({ 
      _sum: { totalPrice: true },
      _avg: { totalPrice: true }
    }),
    prisma.vehicleBooking.aggregate({ 
      _sum: { totalPrice: true },
      _avg: { totalPrice: true }
    }),
    prisma.tourBooking.aggregate({ 
      _sum: { totalPrice: true },
      _avg: { totalPrice: true }
    })
  ]);
  
  const totalRevenue = revenueStats.reduce((sum, stat) => sum + (stat._sum.totalPrice || 0), 0);
  const averageBookingValue = revenueStats.reduce((sum, stat) => sum + (stat._avg.totalPrice || 0), 0) / 3;
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      action: { contains: 'BOOKING' }
    },
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  
  const allBookings = [
    ...propertyBookings.map(b => ({ ...b, bookingType: 'property' as const, service: b.property, user: b.user })),
    ...vehicleBookings.map(b => ({ ...b, bookingType: 'vehicle' as const, service: b.vehicle, user: b.user })),
    ...tourBookings.map(b => ({ ...b, bookingType: 'tour' as const, service: b.tour, user: b.user }))
  ];
  
  return json({
    admin,
    allBookings,
    totalCount: allBookings.length,
    counts: {
      total: counts[0] + counts[1] + counts[2],
      properties: counts[0],
      vehicles: counts[1],
      tours: counts[2],
      confirmed: counts[3] + counts[4] + counts[5],
      pending: counts[6] + counts[7] + counts[8],
      cancelled: counts[9] + counts[10] + counts[11]
    },
    revenueStats: {
      totalRevenue,
      averageBookingValue,
      propertyRevenue: revenueStats[0]._sum.totalPrice || 0,
      vehicleRevenue: revenueStats[1]._sum.totalPrice || 0,
      tourRevenue: revenueStats[2]._sum.totalPrice || 0
    },
    recentActivity,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(allBookings.length / limit),
      hasNext: page < Math.ceil(allBookings.length / limit),
      hasPrev: page > 1
    },
    filters: { search, status, type, sort, dateFrom, dateTo }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const bookingId = formData.get('bookingId') as string;
  const bookingType = formData.get('bookingType') as string;
  const reason = formData.get('reason') as string;
  
  try {
    if (action === 'confirm_booking') {
      if (bookingType === 'property') {
        await prisma.propertyBooking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        });
      } else if (bookingType === 'vehicle') {
        await prisma.vehicleBooking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        });
      } else if (bookingType === 'tour') {
        await prisma.tourBooking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        });
      }
      
      await logAdminAction(admin.id, 'BOOKING_CONFIRMED', `Confirmed ${bookingType} booking: ${bookingId}`, request);
      
    } else if (action === 'cancel_booking') {
      if (bookingType === 'property') {
        await prisma.propertyBooking.update({
          where: { id: bookingId },
          data: { 
            status: 'CANCELLED',
            cancellationReason: reason
          }
        });
      } else if (bookingType === 'vehicle') {
        await prisma.vehicleBooking.update({
          where: { id: bookingId },
          data: { 
            status: 'CANCELLED',
            cancellationReason: reason
          }
        });
      } else if (bookingType === 'tour') {
        await prisma.tourBooking.update({
          where: { id: bookingId },
          data: { 
            status: 'CANCELLED',
            cancellationReason: reason
          }
        });
      }
      
      await logAdminAction(admin.id, 'BOOKING_CANCELLED', `Cancelled ${bookingType} booking: ${bookingId}. Reason: ${reason}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Booking management action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function AllBookings() {
  const { admin, allBookings, totalCount, counts, revenueStats, recentActivity, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; bookingId: string; bookingType: string; bookingTitle: string }>({
    open: false,
    action: '',
    bookingId: '',
    bookingType: '',
    bookingTitle: ''
  });
  const [reason, setReason] = useState('');
  
  const fetcher = useFetcher();
  
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleBookingAction = (action: string, bookingId: string, bookingType: string, bookingTitle: string) => {
    setActionModal({ open: true, action, bookingId, bookingType, bookingTitle });
    setReason('');
  };
  
  const submitAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    formData.append('bookingId', actionModal.bookingId);
    formData.append('bookingType', actionModal.bookingType);
    if (reason) formData.append('reason', reason);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', bookingId: '', bookingType: '', bookingTitle: '' });
    setReason('');
  };
  
  const handleSelectAll = () => {
    if (selectedBookings.length === allBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(allBookings.map(booking => booking.id));
    }
  };
  
  const handleSelectBooking = (bookingId: string) => {
    if (selectedBookings.includes(bookingId)) {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    } else {
      setSelectedBookings([...selectedBookings, bookingId]);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-600">Manage all platform bookings across properties, vehicles, and tours</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedBookings.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedBookings.length})
            </Button>
          )}
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
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
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
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{counts.confirmed}</p>
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
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{counts.cancelled}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {revenueStats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Property Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {revenueStats.propertyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {revenueStats.vehicleRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tour Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {revenueStats.tourRevenue.toLocaleString()}</p>
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
              <option value="confirmed">Confirmed ({counts.confirmed})</option>
              <option value="pending">Pending ({counts.pending})</option>
              <option value="cancelled">Cancelled ({counts.cancelled})</option>
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
              placeholder="Search bookings..."
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
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600">No bookings match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedBookings.length === allBookings.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({allBookings.length} bookings)
              </span>
            </div>
            
            {allBookings.map((booking) => {
              const BookingIcon = getBookingIcon(booking.bookingType);
              const service = booking.service;
              
              return (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => handleSelectBooking(booking.id)}
                      className="rounded"
                    />
                    
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{booking.user?.name} ({booking.user?.email})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Booked {new Date(booking.createdAt).toLocaleDateString()}</span>
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
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {booking.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookingAction('confirm_booking', booking.id, booking.bookingType, 
                            booking.bookingType === 'property' ? service?.name || '' :
                            booking.bookingType === 'vehicle' ? `${service?.brand} ${service?.model}` || '' :
                            service?.title || '')}
                          disabled={fetcher.state === 'submitting'}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                      )}
                      
                      {booking.status !== 'CANCELLED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookingAction('cancel_booking', booking.id, booking.bookingType,
                            booking.bookingType === 'property' ? service?.name || '' :
                            booking.bookingType === 'vehicle' ? `${service?.brand} ${service?.model}` || '' :
                            service?.title || '')}
                          disabled={fetcher.state === 'submitting'}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/bookings/${booking.bookingType}/${booking.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} bookings
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
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal.action === 'confirm_booking' && 'Confirm Booking'}
              {actionModal.action === 'cancel_booking' && 'Cancel Booking'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {actionModal.action === 'confirm_booking' && 'Are you sure you want to confirm this booking?'}
                  {actionModal.action === 'cancel_booking' && 'Are you sure you want to cancel this booking?'}
                </p>
                <p className="font-medium text-gray-900">{actionModal.bookingTitle}</p>
              </div>
              
              {actionModal.action === 'cancel_booking' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation reason:
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for cancellation..."
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', bookingId: '', bookingType: '', bookingTitle: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitAction}
                  disabled={fetcher.state === 'submitting'}
                  className={
                    actionModal.action === 'cancel_booking' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
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
