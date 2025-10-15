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
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Map,
  Target,
  Timer,
  Globe,
  Award,
  Flag,
  MoreHorizontal,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'month';
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const type = url.searchParams.get('type') || 'all';
  const status = url.searchParams.get('status') || 'all';
  
  const currentDate = new Date(date);
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Build where clause for bookings
  const whereClause: any = {
    createdAt: {
      gte: startOfMonth,
      lte: endOfMonth
    }
  };
  
  if (type !== 'all') {
    whereClause.bookingType = type.toUpperCase();
  }
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }
  
  // Get all bookings for the month
  const [propertyBookings, vehicleBookings, tourBookings] = await Promise.all([
    type === 'all' || type === 'properties' ? 
    prisma.propertyBooking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, city: true } }
      }
    }) : [],
    type === 'all' || type === 'vehicles' ? 
    prisma.vehicleBooking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, brand: true, model: true, city: true } }
      }
    }) : [],
    type === 'all' || type === 'tours' ? 
    prisma.tourBooking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        tour: { select: { id: true, title: true, city: true } }
      }
    }) : []
  ]);
  
  // Combine all bookings
  const allBookings = [
    ...propertyBookings.map(b => ({ ...b, bookingType: 'PROPERTY' })),
    ...vehicleBookings.map(b => ({ ...b, bookingType: 'VEHICLE' })),
    ...tourBookings.map(b => ({ ...b, bookingType: 'TOUR' }))
  ];
  
  // Get booking statistics
  const stats = {
    total: allBookings.length,
    confirmed: allBookings.filter(b => b.status === 'CONFIRMED').length,
    pending: allBookings.filter(b => b.status === 'PENDING').length,
    cancelled: allBookings.filter(b => b.status === 'CANCELLED').length,
    totalRevenue: allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  };
  
  // Get daily booking counts
  const dailyCounts = {};
  allBookings.forEach(booking => {
    const date = new Date(booking.createdAt).toISOString().split('T')[0];
    if (!dailyCounts[date]) {
      dailyCounts[date] = { count: 0, revenue: 0, bookings: [] };
    }
    dailyCounts[date].count++;
    dailyCounts[date].revenue += booking.totalPrice || 0;
    dailyCounts[date].bookings.push(booking);
  });
  
  return json({
    admin,
    bookings: allBookings,
    dailyCounts,
    stats,
    currentDate: currentDate.toISOString(),
    filters: { view, date, type, status }
  });
}

export default function BookingCalendar() {
  const { admin, bookings, dailyCounts, stats, currentDate, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  
  const currentDateObj = new Date(currentDate);
  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();
  
  // Generate calendar days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    calendarDays.push(date);
  }
  
  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(b => b.id));
    }
  };
  
  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
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
  
  const getBookingColor = (type: string) => {
    switch (type) {
      case 'PROPERTY': return 'bg-blue-100 text-blue-800';
      case 'VEHICLE': return 'bg-green-100 text-green-800';
      case 'TOUR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
          <p className="text-gray-600">Visual overview of all platform bookings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Calendar
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">PKR {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Calendar Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('date', newDate.toISOString().split('T')[0]);
                  setSearchParams(newParams);
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('date', newDate.toISOString().split('T')[0]);
                  setSearchParams(newParams);
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={filters.view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('view', 'month');
                  setSearchParams(newParams);
                }}
              >
                Month
              </Button>
              <Button
                variant={filters.view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('view', 'week');
                  setSearchParams(newParams);
                }}
              >
                Week
              </Button>
              <Button
                variant={filters.view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('view', 'day');
                  setSearchParams(newParams);
                }}
              >
                Day
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
                <option value="properties">Properties</option>
                <option value="vehicles">Vehicles</option>
                <option value="tours">Tours</option>
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
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Calendar Grid */}
      <Card className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const isCurrentMonth = date.getMonth() === month;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dayBookings = dailyCounts[dateStr] || { count: 0, revenue: 0, bookings: [] };
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </span>
                  {dayBookings.count > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {dayBookings.count}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayBookings.bookings.slice(0, 3).map((booking) => {
                    const BookingIcon = getBookingIcon(booking.bookingType);
                    return (
                      <div
                        key={booking.id}
                        className={`p-1 rounded text-xs cursor-pointer hover:bg-gray-100 ${
                          getBookingColor(booking.bookingType)
                        }`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <div className="flex items-center space-x-1">
                          <BookingIcon className="w-3 h-3" />
                          <span className="truncate">
                            {booking.bookingType === 'PROPERTY' && booking.property?.name}
                            {booking.bookingType === 'VEHICLE' && `${booking.vehicle?.brand} ${booking.vehicle?.model}`}
                            {booking.bookingType === 'TOUR' && booking.tour?.title}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          PKR {booking.totalPrice.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayBookings.bookings.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayBookings.bookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Selected Date Bookings */}
      {selectedDate && dailyCounts[selectedDate] && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Bookings for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <div className="text-sm text-gray-600">
              {dailyCounts[selectedDate].count} bookings • PKR {dailyCounts[selectedDate].revenue.toLocaleString()} revenue
            </div>
          </div>
          
          <div className="space-y-4">
            {dailyCounts[selectedDate].bookings.map((booking) => {
              const BookingIcon = getBookingIcon(booking.bookingType);
              return (
                <div key={booking.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BookingIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {booking.bookingType === 'PROPERTY' && booking.property?.name}
                        {booking.bookingType === 'VEHICLE' && `${booking.vehicle?.brand} ${booking.vehicle?.model}`}
                        {booking.bookingType === 'TOUR' && booking.tour?.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingColor(booking.bookingType)}`}>
                        {booking.bookingType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{booking.user?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <LocationIcon className="w-4 h-4" />
                        <span>
                          {booking.bookingType === 'PROPERTY' && booking.property?.city}
                          {booking.bookingType === 'VEHICLE' && booking.vehicle?.city}
                          {booking.bookingType === 'TOUR' && booking.tour?.city}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>PKR {booking.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/bookings/${booking.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
