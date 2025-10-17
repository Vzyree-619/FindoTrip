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
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  DollarSign,
  MapPin as LocationIcon,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

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
  
  // Build where clause for pending bookings
  const whereClause: any = {
    status: 'PENDING'
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
  
  // Get pending bookings
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
    prisma.propertyBooking.count({ where: { status: 'PENDING' } }),
    prisma.vehicleBooking.count({ where: { status: 'PENDING' } }),
    prisma.tourBooking.count({ where: { status: 'PENDING' } })
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
    console.error('Booking action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function PendingBookings() {
  const { admin, allBookings, totalCount, counts, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Bookings</h1>
          <p className="text-gray-600">Review and approve pending bookings</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
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
              placeholder="Search pending bookings..."
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
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Bookings</h3>
            <p className="text-gray-600">No pending bookings match your current filters.</p>
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
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">PENDING</span>
                      </div>
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
          })
        )}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} pending bookings
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
