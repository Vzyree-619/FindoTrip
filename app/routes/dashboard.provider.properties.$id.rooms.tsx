import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Plus, Edit, Trash2, Calendar, Bed, Users, DollarSign, TrendingUp, Eye, CheckCircle } from "lucide-react";
import RoomManagement from "~/components/property/RoomManagement";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;

  if (!propertyId) {
    throw new Response("Property ID is required", { status: 400 });
  }

  // Verify user owns this property
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      owner: {
        userId: userId
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          businessName: true
        }
      }
    }
  });

  if (!property) {
    throw new Response("Property not found or unauthorized", { status: 403 });
  }

  // Fetch all room types for this property
  const roomTypes = await prisma.roomType.findMany({
    where: {
      propertyId: propertyId
    },
    orderBy: {
      basePrice: 'asc'
    }
  });

  // Get booking statistics for each room
  const roomsWithStats = await Promise.all(
    roomTypes.map(async (room) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // This month's bookings
      const thisMonthBookings = await prisma.propertyBooking.count({
        where: {
          roomTypeId: room.id,
          status: { not: 'CANCELLED' },
          checkInDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      // Total bookings
      const totalBookings = await prisma.propertyBooking.count({
        where: {
          roomTypeId: room.id,
          status: { not: 'CANCELLED' }
        }
      });

      // Current availability
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookedToday = await prisma.propertyBooking.count({
        where: {
          roomTypeId: room.id,
          status: { not: 'CANCELLED' },
          OR: [
            {
              checkInDate: { lte: today },
              checkOutDate: { gt: today }
            }
          ]
        }
      });

      const availableUnits = (room.totalUnits || 1) - bookedToday;
      const occupancyRate = room.totalUnits > 0 
        ? ((room.totalUnits - availableUnits) / room.totalUnits) * 100 
        : 0;

      return {
        ...room,
        thisMonthBookings,
        totalBookings,
        availableUnits,
        occupancyRate: Math.round(occupancyRate)
      };
    })
  );

  return json({ property, rooms: roomsWithStats });
}

export default function PropertyRoomsManagement() {
  const { property, rooms } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const created = searchParams.get("created") === "1";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {created && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Property created successfully!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Now add room types with pricing, capacity, and amenities to make your property bookable.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchParams({});
              }}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              ×
            </button>
          </div>
        )}
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/provider"
            className="text-[#01502E] hover:text-[#013d23] mb-4 inline-block"
          >
            ← Back to Properties
          </Link>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Room Management</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Property: {property.name}</p>
            </div>
            <Link
              to={`/dashboard/provider/properties/${property.id}/rooms/new`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Add New Room Type</span>
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Room Types</div>
            <div className="text-2xl font-bold text-gray-900">{rooms.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Units</div>
            <div className="text-2xl font-bold text-gray-900">
              {rooms.reduce((sum, r) => sum + (r.totalUnits || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">This Month Bookings</div>
            <div className="text-2xl font-bold text-gray-900">
              {rooms.reduce((sum, r) => sum + (r.thisMonthBookings || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Avg Occupancy</div>
            <div className="text-2xl font-bold text-gray-900">
              {rooms.length > 0
                ? Math.round(rooms.reduce((sum, r) => sum + (r.occupancyRate || 0), 0) / rooms.length)
                : 0}%
            </div>
          </div>
        </div>

        {/* Room Types List */}
        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bed className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No room types yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first room type for this property</p>
            <Link
              to={`/dashboard/provider/properties/${property.id}/rooms/new`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add First Room Type
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 sm:p-6">
                  {/* Room Image */}
                  <div className="relative h-48 sm:h-64 md:h-full md:min-h-[300px] rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 md:w-[300px]">
                    {room.mainImage || (room.images && room.images[0]) ? (
                      <img
                        src={room.mainImage || room.images[0]}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Bed className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {room.specialOffer && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {room.specialOffer}
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                      room.available 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {room.available ? '● Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{room.name}</h3>
                      
                      {/* Room Specs */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{room.bedConfiguration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Sleeps {room.maxOccupancy}</span>
                        </div>
                        {room.roomSize && (
                          <span>📐 {room.roomSize} {room.roomSizeUnit}</span>
                        )}
                        {room.floor && (
                          <span>🏢 {room.floor}</span>
                        )}
                        {room.view && (
                          <span>🌅 {room.view}</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 line-clamp-2 mb-4">{room.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Price/Night</div>
                        <div className="text-lg font-bold text-[#01502E]">
                          {room.currency} {room.basePrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Total Units</div>
                        <div className="text-lg font-bold text-gray-900">{room.totalUnits}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Available Now</div>
                        <div className="text-lg font-bold text-gray-900">{room.availableUnits}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Occupancy</div>
                        <div className="text-lg font-bold text-gray-900">{room.occupancyRate}%</div>
                      </div>
                    </div>

                    {/* Booking Stats */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">This Month:</span> {room.thisMonthBookings} bookings
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> {room.totalBookings} bookings
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Link
                        to={`/dashboard/provider/properties/${property.id}/rooms/${room.id}/availability`}
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Manage Availability</span>
                        <span className="sm:hidden">Availability</span>
                      </Link>
                      <Link
                        to={`/dashboard/provider/properties/${property.id}/rooms/${room.id}/edit`}
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        Edit
                      </Link>
                      <Link
                        to={`/dashboard/provider/inventory/${room.id}`}
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs sm:text-sm"
                      >
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Calendar</span>
                        <span className="sm:hidden">Cal</span>
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to deactivate this room type?")) return;
                          // TODO: Implement deactivate action
                          alert("Deactivate functionality to be implemented");
                        }}
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Deactivate</span>
                        <span className="sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

