import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Users } from "lucide-react";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;
  const roomId = params.roomId;

  if (!propertyId || !roomId) {
    throw new Response("Property ID and Room ID are required", { status: 400 });
  }

  // Verify ownership
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      owner: { userId }
    }
  });

  if (!property) {
    throw new Response("Property not found or unauthorized", { status: 403 });
  }

  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    include: {
      property: true
    }
  });

  if (!room || room.propertyId !== propertyId) {
    throw new Response("Room not found", { status: 404 });
  }

  // Get bookings for this room
  const bookings = await prisma.propertyBooking.findMany({
    where: {
      roomTypeId: roomId,
      status: { not: 'CANCELLED' }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      checkInDate: 'asc'
    }
  });

  // Calculate stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const thisMonthBookings = bookings.filter(b => 
    b.checkInDate >= startOfMonth && b.checkInDate <= endOfMonth
  );

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const avgRate = bookings.length > 0 ? totalRevenue / bookings.length : 0;

  return json({
    property,
    room,
    bookings,
    stats: {
      totalBookings: bookings.length,
      thisMonthBookings: thisMonthBookings.length,
      totalRevenue,
      avgRate
    }
  });
}

export default function RoomAvailability() {
  const { property, room, bookings, stats } = useLoaderData<typeof loader>();
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Group bookings by date for calendar display
  const bookingsByDate = new Map<string, any[]>();
  bookings.forEach(booking => {
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    const current = new Date(start);
    
    while (current < end) {
      const key = current.toISOString().split('T')[0];
      if (!bookingsByDate.has(key)) {
        bookingsByDate.set(key, []);
      }
      bookingsByDate.get(key)!.push(booking);
      current.setDate(current.getDate() + 1);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/dashboard/provider/properties/${property.id}/rooms`}
            className="flex items-center gap-2 text-[#01502E] hover:text-[#013d23] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Room Availability Calendar</h1>
          <p className="text-gray-600 mt-2">{room.name} - {property.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Total Bookings</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalBookings}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">This Month</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.thisMonthBookings}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-[#01502E]">
              {room.currency} {stats.totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Avg Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {room.currency} {Math.round(stats.avgRate).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Calendar</h2>
          <p className="text-sm text-gray-600 mb-4">
            View all bookings for this room type. Dates with bookings are highlighted.
          </p>
          
          {/* Simple month view - in production, use a proper calendar component */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
            {/* Calendar days would go here - simplified for now */}
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No bookings yet for this room type</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {booking.guestName || booking.user?.name || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''} • {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#01502E]">
                        {room.currency} {booking.totalAmount?.toLocaleString() || '0'}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Block Dates Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Block Dates</h2>
          <p className="text-sm text-gray-600 mb-4">
            Block specific dates for maintenance or other reasons
          </p>
          <Form method="post" className="flex gap-4">
            <input type="hidden" name="intent" value="blockDate" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23]"
              >
                Block Date
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

