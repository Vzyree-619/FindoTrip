import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Calendar, 
  User, 
  Building, 
  Car, 
  MapPin, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Star,
  CreditCard,
  CalendarDays,
  Users
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (status !== 'all') {
    where.status = status;
  }
  
  // Get all bookings with pagination
  const [propertyBookings, vehicleBookings, tourBookings] = await Promise.all([
    prisma.propertyBooking.findMany({
      where: type === 'all' || type === 'property' ? where : { id: 'none' },
      include: {
        customer: {
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
            address: true,
            city: true,
            owner: {
              select: {
                id: true,
                name: true,
                businessName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.vehicleBooking.findMany({
      where: type === 'all' || type === 'vehicle' ? where : { id: 'none' },
      include: {
        customer: {
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
            owner: {
              select: {
                id: true,
                name: true,
                businessName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.tourBooking.findMany({
      where: type === 'all' || type === 'tour' ? where : { id: 'none' },
      include: {
        customer: {
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
            name: true,
            location: true,
            difficulty: true,
            guide: {
              select: {
                id: true,
                name: true,
                businessName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })
  ]);
  
  // Combine all bookings
  const allBookings = [
    ...propertyBookings.map(booking => ({ ...booking, bookingType: 'property' as const })),
    ...vehicleBookings.map(booking => ({ ...booking, bookingType: 'vehicle' as const })),
    ...tourBookings.map(booking => ({ ...booking, bookingType: 'tour' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Get booking counts
  const [totalBookings, statusCounts] = await Promise.all([
    prisma.propertyBooking.count() + prisma.vehicleBooking.count() + prisma.tourBooking.count(),
    Promise.all([
      prisma.propertyBooking.count({ where: { status: 'CONFIRMED' } }) + 
      prisma.vehicleBooking.count({ where: { status: 'CONFIRMED' } }) + 
      prisma.tourBooking.count({ where: { status: 'CONFIRMED' } }),
      prisma.propertyBooking.count({ where: { status: 'PENDING' } }) + 
      prisma.vehicleBooking.count({ where: { status: 'PENDING' } }) + 
      prisma.tourBooking.count({ where: { status: 'PENDING' } }),
      prisma.propertyBooking.count({ where: { status: 'CANCELLED' } }) + 
      prisma.vehicleBooking.count({ where: { status: 'CANCELLED' } }) + 
      prisma.tourBooking.count({ where: { status: 'CANCELLED' } })
    ])
  ]);
  
  return json({
    admin,
    bookings: allBookings,
    totalCount: totalBookings,
    statusCounts: {
      confirmed: statusCounts[0],
      pending: statusCounts[1],
      cancelled: statusCounts[2]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(allBookings.length / limit),
      hasNext: page < Math.ceil(allBookings.length / limit),
      hasPrev: page > 1
    },
    filters: { search, status, type }
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
    if (action === 'confirm') {
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
    } else if (action === 'cancel') {
      if (bookingType === 'property') {
        await prisma.propertyBooking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' }
        });
      } else if (bookingType === 'vehicle') {
        await prisma.vehicleBooking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' }
        });
      } else if (bookingType === 'tour') {
        await prisma.tourBooking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' }
        });
      }
      await logAdminAction(admin.id, 'BOOKING_CANCELLED', `Cancelled ${bookingType} booking: ${bookingId}. Reason: ${reason}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Booking action error:', error);
    return json({ success: false, error: 'Failed to process booking action' }, { status: 500 });
  }
}

export default function AdminBookings() {
  const { admin, bookings, totalCount, statusCounts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBookingId, setCancelBookingId] = useState('');
  const [cancelBookingType, setCancelBookingType] = useState('');
  
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
  
  const handleBookingAction = (action: string, bookingId: string, bookingType: string, reason?: string) => {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('bookingId', bookingId);
    formData.append('bookingType', bookingType);
    if (reason) formData.append('reason', reason);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return CheckCircle;
      case 'PENDING': return Clock;
      case 'CANCELLED': return XCircle;
      default: return AlertTriangle;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property': return Building;
      case 'vehicle': return Car;
      case 'tour': return MapPin;
      default: return Calendar;
    }
  };
  
  const types = [
    { value: 'all', label: 'All Types', count: totalCount },
    { value: 'property', label: 'Properties', count: bookings.filter(b => b.bookingType === 'property').length },
    { value: 'vehicle', label: 'Vehicles', count: bookings.filter(b => b.bookingType === 'vehicle').length },
    { value: 'tour', label: 'Tours', count: bookings.filter(b => b.bookingType === 'tour').length }
  ];
  
  const statuses = [
    { value: 'all', label: 'All Status', count: totalCount },
    { value: 'CONFIRMED', label: 'Confirmed', count: statusCounts.confirmed },
    { value: 'PENDING', label: 'Pending', count: statusCounts.pending },
    { value: 'CANCELLED', label: 'Cancelled', count: statusCounts.cancelled }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">Manage all bookings across the platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Bookings: {totalCount.toLocaleString()}
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
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilter('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.count})
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
      
      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </Card>
        ) : (
          bookings.map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            const TypeIcon = getTypeIcon(booking.bookingType);
            
            return (
              <Card key={`${booking.bookingType}-${booking.id}`} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.bookingType === 'property' && booking.property?.name}
                          {booking.bookingType === 'vehicle' && `${booking.vehicle?.brand} ${booking.vehicle?.model}`}
                          {booking.bookingType === 'tour' && booking.tour?.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {booking.bookingType.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{booking.customer.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{booking.customer.email}</span>
                        </div>
                        {booking.customer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{booking.customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Booked {new Date(booking.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>PKR {booking.totalPrice?.toLocaleString() || 'N/A'}</span>
                        </div>
                        {booking.bookingType === 'property' && (
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4" />
                            <span>{booking.property?.owner.businessName || booking.property?.owner.name}</span>
                          </div>
                        )}
                        {booking.bookingType === 'vehicle' && (
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4" />
                            <span>{booking.vehicle?.owner.businessName || booking.vehicle?.owner.name}</span>
                          </div>
                        )}
                        {booking.bookingType === 'tour' && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.tour?.guide.businessName || booking.tour?.guide.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Booking Details */}
                      <div className="text-sm text-gray-600">
                        {booking.bookingType === 'property' && (
                          <div>
                            <strong>Property:</strong> {booking.property?.name} - {booking.property?.type}
                            <br />
                            <strong>Location:</strong> {booking.property?.address}, {booking.property?.city}
                          </div>
                        )}
                        {booking.bookingType === 'vehicle' && (
                          <div>
                            <strong>Vehicle:</strong> {booking.vehicle?.brand} {booking.vehicle?.model} - {booking.vehicle?.category}
                            <br />
                            <strong>Location:</strong> {booking.vehicle?.city}
                          </div>
                        )}
                        {booking.bookingType === 'tour' && (
                          <div>
                            <strong>Tour:</strong> {booking.tour?.name}
                            <br />
                            <strong>Location:</strong> {booking.tour?.location} - {booking.tour?.difficulty}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {booking.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBookingAction('confirm', booking.id, booking.bookingType)}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {booking.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCancelBookingId(booking.id);
                          setCancelBookingType(booking.bookingType);
                          setCancelReason('');
                        }}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, bookings.length)} of {bookings.length} bookings
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
      
      {/* Cancel Confirmation Modal */}
      {cancelBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Booking</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please provide a reason for cancellation..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelBookingId('');
                    setCancelBookingType('');
                    setCancelReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleBookingAction('cancel', cancelBookingId, cancelBookingType, cancelReason);
                    setCancelBookingId('');
                    setCancelBookingType('');
                    setCancelReason('');
                  }}
                  disabled={!cancelReason.trim() || fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
