import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigate, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { getUser } from "~/lib/auth/auth.server";
import { calculateStayPrice } from "~/lib/pricing.server";
import { getRoomAvailabilityCalendar, checkDateRangeAvailability } from "~/lib/availability.server";
import {
  Users,
  Bed,
  Bath,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id: propertyId, roomId } = params;

  if (!propertyId || !roomId) {
    throw new Response("Property ID and Room ID are required", { status: 400 });
  }

  const user = await getUser(request);
  const url = new URL(request.url);

  // Get search parameters
  const checkIn = url.searchParams.get("checkIn");
  const checkOut = url.searchParams.get("checkOut");
  const adults = parseInt(url.searchParams.get("adults") || "2");
  const children = parseInt(url.searchParams.get("children") || "0");
  const guests = adults + children;

  // Fetch property
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  // Fetch room type
  const room = await prisma.roomType.findUnique({
    where: { id: roomId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          country: true,
          cleaningFee: true,
          serviceFee: true,
          taxRate: true,
          currency: true,
          images: true,
        },
      },
    },
  });

  if (!room || room.propertyId !== propertyId) {
    throw new Response("Room not found", { status: 404 });
  }

  // Get availability calendar (reduced to 1 month for speed)
  const availabilityCalendar = await getRoomAvailabilityCalendar(roomId, new Date(), 1);

  // Check date range availability if dates provided
  let dateRangeInfo = null;
  let pricingInfo = null;
  let numberOfNights = 0;

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      !isNaN(checkInDate.getTime()) &&
      !isNaN(checkOutDate.getTime()) &&
      checkOutDate > checkInDate
    ) {
      numberOfNights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      dateRangeInfo = await checkDateRangeAvailability(roomId, checkInDate, checkOutDate, 1);

      if (dateRangeInfo.isAvailable) {
        pricingInfo = await calculateStayPrice({
          roomTypeId: roomId,
          propertyId,
          checkInDate,
          checkOutDate,
          numberOfRooms: 1,
          guests,
        });
      }
    }
  }

  return json({
    property,
    room,
    user,
    availabilityCalendar,
    dateRangeInfo,
    pricingInfo,
    searchParams: {
      checkIn,
      checkOut,
      adults,
      children,
      numberOfNights,
    },
  });
}

export default function RoomDetail() {
  const { property, room, user, dateRangeInfo, pricingInfo, searchParams } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const images =
    room.images && room.images.length > 0
      ? room.images
      : property.images && property.images.length > 0
      ? property.images
      : ["/landingPageImg.jpg"];

  const checkInDate = searchParams.checkIn ? new Date(searchParams.checkIn) : null;
  const checkOutDate = searchParams.checkOut ? new Date(searchParams.checkOut) : null;
  const totalGuests = searchParams.adults + searchParams.children;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBookNow = () => {
    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates");
      return;
    }

    if (!user) {
      navigate(
        `/login?redirectTo=/accommodations/${property.id}/rooms/${room.id}?${urlSearchParams.toString()}`,
      );
      return;
    }

    const params = new URLSearchParams({
      roomTypeId: room.id,
      checkIn: checkInDate.toISOString().split("T")[0],
      checkOut: checkOutDate.toISOString().split("T")[0],
      guests: Math.max(totalGuests, 1).toString(),
    });

    navigate(`/book/property/${property.id}?${params.toString()}`);
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const currentImage = images[currentImageIndex];
  const hasImageError = imageErrors[currentImageIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-8">
            <button
              onClick={prevImage}
              className="absolute left-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <img
              src={hasImageError ? "/landingPageImg.jpg" : currentImage}
              alt={`${room.name} - Image ${currentImageIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              onError={() => handleImageError(currentImageIndex)}
            />

            <button
              onClick={nextImage}
              className="absolute right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to={`/accommodations/${property.id}?${urlSearchParams.toString()}`}
            className="inline-flex items-center gap-2 text-[#01502E] hover:text-[#013d23] font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to {property.name}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Max {room.maxOccupancy} guests</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{room.beds} beds</span>
            </div>
            {room.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{room.bathrooms} baths</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-96 bg-gray-200">
                <img
                  src={hasImageError ? "/landingPageImg.jpg" : currentImage}
                  alt={room.name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(currentImageIndex)}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowGallery(true)}
                  className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 font-medium"
                >
                  View all {images.length} photos
                </button>

                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>
            </div>

            {/* Room Description */}
            {room.description && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this room</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{room.description}</p>
              </div>
            )}

            {/* Room Features */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {room.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#01502E]" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Policies</h2>
              <div className="space-y-3">
                {room.cancellationPolicy && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Cancellation Policy</h3>
                    <p className="text-gray-700">{room.cancellationPolicy}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Smoking</h3>
                  <p className="text-gray-700">{room.smokingAllowed ? "Allowed" : "Not allowed"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pets</h3>
                  <p className="text-gray-700">{room.petsAllowed ? "Allowed" : "Not allowed"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-[#01502E]">
                    {room.currency} {room.basePrice.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/ night</span>
                </div>
                {checkInDate && checkOutDate && searchParams.numberOfNights > 0 && (
                  <div className="text-sm text-gray-600">
                    {searchParams.numberOfNights} night{searchParams.numberOfNights > 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Dates Summary */}
              {checkInDate && checkOutDate ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Your dates</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600">Check-in</div>
                      <div className="font-medium">{checkInDate.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Check-out</div>
                      <div className="font-medium">{checkOutDate.toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600">Guests</div>
                    <div className="font-medium">
                      {totalGuests} guest{totalGuests > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Select dates on the property page to see availability and total price
                  </p>
                </div>
              )}

              {/* Availability Status */}
              {dateRangeInfo && (
                <div className="mb-6">
                  {dateRangeInfo.isAvailable ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <Check className="w-5 h-5" />
                        <span>Available for your dates</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 font-semibold">
                        <X className="w-5 h-5" />
                        <span>Not available for your dates</span>
                      </div>
                      {dateRangeInfo.message && (
                        <p className="text-sm text-red-600 mt-2">{dateRangeInfo.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              {pricingInfo && (
                <div className="mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {room.currency} {room.basePrice.toLocaleString()} × {searchParams.numberOfNights} night
                      {searchParams.numberOfNights > 1 ? "s" : ""}
                    </span>
                    <span className="font-medium">
                      {room.currency} {pricingInfo.basePrice.toLocaleString()}
                    </span>
                  </div>
                  {pricingInfo.cleaningFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cleaning fee</span>
                      <span className="font-medium">
                        {room.currency} {pricingInfo.cleaningFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pricingInfo.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-medium">
                        {room.currency} {pricingInfo.serviceFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pricingInfo.taxes > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-medium">
                        {room.currency} {pricingInfo.taxes.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-[#01502E]">
                      {room.currency} {pricingInfo.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <Button
                onClick={handleBookNow}
                disabled={!dateRangeInfo?.isAvailable}
                className="w-full py-6 text-lg bg-[#01502E] hover:bg-[#013d23] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {dateRangeInfo?.isAvailable ? "Book Now" : "Select Available Dates"}
              </Button>

              <p className="text-center text-xs text-gray-600 mt-3">You won't be charged yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

