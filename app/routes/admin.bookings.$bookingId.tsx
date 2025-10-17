import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
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
  ExternalLink,
  ArrowLeft,
  Shield,
  FileText,
  Send,
  Ban,
  RefreshCw,
  Zap,
  Target,
  Timer,
  Globe,
  Award,
  Flag,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const { bookingId } = params;
  
  if (!bookingId) {
    throw new Response("Booking ID is required", { status: 400 });
  }
  
  // Try to find booking in all booking tables
  const [propertyBooking, vehicleBooking, tourBooking] = await Promise.all([
    prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verified: true,
            isActive: true
          }
        },
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                verified: true,
                isActive: true
              }
            }
          }
        }
      }
    }),
    prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verified: true,
            isActive: true
          }
        },
        vehicle: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                verified: true,
                isActive: true
              }
            }
          }
        }
      }
    }),
    prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verified: true,
            isActive: true
          }
        },
        tour: {
          include: {
            guide: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                verified: true,
                isActive: true
              }
            }
          }
        }
      }
    })
  ]);
  
  const booking = propertyBooking || vehicleBooking || tourBooking;
  
  if (!booking) {
    throw new Response("Booking not found", { status: 404 });
  }
  
  // Determine booking type and service
  let bookingType = '';
  let service = null;
  let provider = null;
  
  if (propertyBooking) {
    bookingType = 'PROPERTY';
    service = propertyBooking.property;
    provider = propertyBooking.property.owner;
  } else if (vehicleBooking) {
    bookingType = 'VEHICLE';
    service = vehicleBooking.vehicle;
    provider = vehicleBooking.vehicle.owner;
  } else if (tourBooking) {
    bookingType = 'TOUR';
    service = tourBooking.tour;
    provider = tourBooking.tour.guide;
  }
  
  // Get booking timeline/activity
  const timeline = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: 'BOOKING', entityId: bookingId },
        { action: { contains: 'BOOKING' } }
      ]
    },
    orderBy: { timestamp: 'desc' },
    take: 10
  });
  
  // Get related bookings for the same customer
  const relatedBookings = await Promise.all([
    prisma.propertyBooking.findMany({
      where: { userId: booking.user.id },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.vehicleBooking.findMany({
      where: { userId: booking.user.id },
      include: { vehicle: { select: { brand: true, model: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.tourBooking.findMany({
      where: { userId: booking.user.id },
      include: { tour: { select: { title: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);
  
  const allRelatedBookings = [
    ...relatedBookings[0].map(b => ({ ...b, type: 'PROPERTY' })),
    ...relatedBookings[1].map(b => ({ ...b, type: 'VEHICLE' })),
    ...relatedBookings[2].map(b => ({ ...b, type: 'TOUR' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return json({
    admin,
    booking,
    bookingType,
    service,
    provider,
    timeline,
    relatedBookings: allRelatedBookings
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const { bookingId } = params;
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const reason = formData.get('reason') as string;
  const refundAmount = formData.get('refundAmount') as string;
  
  try {
    if (action === 'confirm_booking') {
      // Update booking status to confirmed
      await prisma.propertyBooking.updateMany({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' }
      });
      await prisma.vehicleBooking.updateMany({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' }
      });
      await prisma.tourBooking.updateMany({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' }
      });
      
      await logAdminAction(admin.id, 'CONFIRM_BOOKING', `Confirmed booking ${bookingId}`, request);
      
    } else if (action === 'cancel_booking') {
      // Update booking status to cancelled
      await prisma.propertyBooking.updateMany({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
      await prisma.vehicleBooking.updateMany({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
      await prisma.tourBooking.updateMany({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
      
      await logAdminAction(admin.id, 'CANCEL_BOOKING', `Cancelled booking ${bookingId}: ${reason}`, request);
      
    } else if (action === 'issue_refund') {
      // Process refund
      const refund = parseFloat(refundAmount);
      
      await logAdminAction(admin.id, 'ISSUE_REFUND', `Issued refund of PKR ${refund} for booking ${bookingId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Booking action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function BookingDetails() {
  const { admin, booking, bookingType, service, provider, timeline, relatedBookings } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('overview');
  const [actionModal, setActionModal] = useState<{ open: boolean; action: string; title: string }>({
    open: false,
    action: '',
    title: ''
  });
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  
  const fetcher = useFetcher();
  
  const handleBookingAction = (action: string, title: string) => {
    setActionModal({ open: true, action, title });
  };
  
  const executeAction = () => {
    const formData = new FormData();
    formData.append('action', actionModal.action);
    if (reason) formData.append('reason', reason);
    if (refundAmount) formData.append('refundAmount', refundAmount);
    fetcher.submit(formData, { method: 'post' });
    
    setActionModal({ open: false, action: '', title: '' });
    setReason('');
    setRefundAmount('');
  };
  
  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'PROPERTY': return Building;
      case 'VEHICLE': return Car;
      case 'TOUR': return MapPin;
      default: return Calendar;
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
  
  const BookingIcon = getBookingIcon(bookingType);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/admin/bookings/all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">Complete booking information and management</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Details
          </Button>
          <Button variant="outline">
            <Receipt className="w-4 h-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>
      
      {/* Booking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookingIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Booking Type</p>
              <p className="text-lg font-bold text-gray-900">{bookingType}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold text-gray-900">{booking.status}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Price</p>
              <p className="text-lg font-bold text-gray-900">PKR {booking.totalPrice.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Booked On</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Comprehensive Tabbed Interface */}
      <Card className="p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setActiveTab('provider')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'provider'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Provider
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actions
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Service Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Service Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <div className="text-sm text-gray-900">
                    {bookingType === 'PROPERTY' && service?.name}
                    {bookingType === 'VEHICLE' && `${service?.brand} ${service?.model}`}
                    {bookingType === 'TOUR' && service?.title}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="text-sm text-gray-900">{service?.city}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <div className="text-sm text-gray-900">{bookingType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
                  <div className="text-sm text-gray-900 font-mono">{service?.id}</div>
                </div>
              </div>
            </div>
            
            {/* Booking Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Dates</label>
                  <div className="text-sm text-gray-900">
                    {bookingType === 'PROPERTY' && booking.checkInTime && booking.checkOutTime && 
                      `${new Date(booking.checkInTime).toLocaleDateString()} - ${new Date(booking.checkOutTime).toLocaleDateString()}`}
                    {bookingType === 'VEHICLE' && booking.startDate && booking.endDate && 
                      `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`}
                    {bookingType === 'TOUR' && booking.tourDate && 
                      new Date(booking.tourDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <div className="text-sm text-gray-900">
                    {bookingType === 'PROPERTY' && booking.checkInTime && booking.checkOutTime && 
                      `${Math.ceil((new Date(booking.checkOutTime).getTime() - new Date(booking.checkInTime).getTime()) / (1000 * 60 * 60 * 24))} nights`}
                    {bookingType === 'VEHICLE' && booking.startDate && booking.endDate && 
                      `${Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
                    {bookingType === 'TOUR' && '1 day'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests/Passengers</label>
                  <div className="text-sm text-gray-900">
                    {bookingType === 'PROPERTY' && `${booking.guests || 1} guests`}
                    {bookingType === 'VEHICLE' && `${booking.passengers || 1} passengers`}
                    {bookingType === 'TOUR' && `${booking.participants || 1} participants`}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                  <div className="text-sm text-gray-900">{booking.specialRequests || 'None'}</div>
                </div>
              </div>
            </div>
            
            {/* Pricing Breakdown */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Pricing Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Price:</span>
                  <span className="text-sm font-medium">PKR {booking.basePrice?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Service Fee:</span>
                  <span className="text-sm font-medium">PKR {booking.serviceFee?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Taxes:</span>
                  <span className="text-sm font-medium">PKR {booking.tax?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Additional Fees:</span>
                  <span className="text-sm font-medium">PKR {booking.additionalFees?.toLocaleString() || '0'}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total Price:</span>
                  <span className="text-sm font-bold text-gray-900">PKR {booking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Timeline</h4>
            {timeline.length === 0 ? (
              <p className="text-gray-600">No timeline events found</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{event.action}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'customer' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Personal Details</h5>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="text-sm text-gray-900">{booking.user.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="text-sm text-gray-900">{booking.user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <div className="text-sm text-gray-900">{booking.user.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {booking.user.verified && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Booking History</h5>
                <div className="space-y-2">
                  {relatedBookings.slice(0, 3).map((relatedBooking) => (
                    <div key={relatedBooking.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {relatedBooking.type === 'PROPERTY' && relatedBooking.property?.name}
                          {relatedBooking.type === 'VEHICLE' && `${relatedBooking.vehicle?.brand} ${relatedBooking.vehicle?.model}`}
                          {relatedBooking.type === 'TOUR' && relatedBooking.tour?.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(relatedBooking.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        PKR {relatedBooking.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'provider' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Provider Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Provider Details</h5>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="text-sm text-gray-900">{provider?.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="text-sm text-gray-900">{provider?.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <div className="text-sm text-gray-900">{provider?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        provider?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {provider?.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {provider?.verified && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Service Details</h5>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Name</label>
                    <div className="text-sm text-gray-900">
                      {bookingType === 'PROPERTY' && service?.name}
                      {bookingType === 'VEHICLE' && `${service?.brand} ${service?.model}`}
                      {bookingType === 'TOUR' && service?.title}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <div className="text-sm text-gray-900">{service?.city}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Price</label>
                    <div className="text-sm text-gray-900">PKR {service?.basePrice?.toLocaleString() || '0'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Status Management</h5>
                <div className="space-y-2">
                  {booking.status === 'PENDING' && (
                    <Button
                      onClick={() => handleBookingAction('confirm_booking', 'Confirm Booking')}
                      className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </Button>
                  )}
                  
                  {booking.status !== 'CANCELLED' && (
                    <Button
                      onClick={() => handleBookingAction('cancel_booking', 'Cancel Booking')}
                      variant="outline"
                      className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleBookingAction('issue_refund', 'Issue Refund')}
                    variant="outline"
                    className="w-full justify-start text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Issue Refund
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Communication</h5>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Customer
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Provider
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{actionModal.title}</h3>
              <Button
                variant="outline"
                onClick={() => setActionModal({ open: false, action: '', title: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {actionModal.action === 'cancel_booking' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter cancellation reason..."
                  />
                </div>
              )}
              
              {actionModal.action === 'issue_refund' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter refund amount..."
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, action: '', title: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeAction}
                  disabled={fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Processing...' : 'Execute'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
