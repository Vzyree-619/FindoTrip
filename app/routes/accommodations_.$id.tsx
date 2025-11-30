import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useRevalidator, useNavigate } from "@remix-run/react";
import { ChatInterface } from "~/components/chat";
import ShareModal from "~/components/common/ShareModal";
import FloatingShareButton from "~/components/common/FloatingShareButton";
import PropertyDetailTabs from "~/components/property/PropertyDetailTabs";
import PropertySearchWidget from "~/components/property/PropertySearchWidget";
import { useState } from "react";
import { prisma } from "~/lib/db/db.server";
import { getUser, getUserId } from "~/lib/auth/auth.server";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Star,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  MessageCircle,
} from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  const { id } = params;
  
  if (!id) {
    throw new Response("Property ID is required", { status: 400 });
  }

  const user = await getUser(request);
  const url = new URL(request.url);

  // Get search parameters
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');
  const adults = parseInt(url.searchParams.get('adults') || '2');
  const children = parseInt(url.searchParams.get('children') || '0');

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, avatar: true } } },
        take: 10,
      },
    },
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  // Check if user has wishlisted this property
  let isWishlisted = false;
  if (user) {
    const wishlist = await prisma.wishlist.findFirst({
      where: { userId: user.id, propertyIds: { has: id } },
    });
    isWishlisted = !!wishlist;
  }

  // Fetch reviews with user data
  const reviews = property.reviews;

  // Calculate rating breakdown
  const ratingBreakdown = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  // Fetch similar properties
  const similarProperties = await prisma.property.findMany({
    where: {
      id: { not: id },
      city: property.city,
      type: property.type,
      available: true,
      approvalStatus: "APPROVED",
    },
    take: 4,
    orderBy: { rating: "desc" },
  });

  // Fetch room types with full details
  let roomTypes: any[] = [];
  try {
    roomTypes = await prisma.roomType.findMany({ 
      where: { 
        propertyId: id,
        available: true
      },
      orderBy: {
        basePrice: 'asc'
      }
    });
  } catch (error) {
    console.error("Error fetching room types:", error);
  }

  // If dates provided, check availability for each room
  let roomsWithAvailability = roomTypes;
  let numberOfNights = 0;
  
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Validate dates
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      // Invalid dates, return rooms without availability
    } else {
      numberOfNights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // For each room, check how many units are available
      roomsWithAvailability = await Promise.all(
        roomTypes.map(async (room) => {
          try {
            const bookedUnits = await prisma.propertyBooking.count({
              where: {
                roomTypeId: room.id,
                status: { not: 'CANCELLED' },
                OR: [
                  {
                    checkInDate: {
                      gte: checkInDate,
                      lt: checkOutDate
                    }
                  },
                  {
                    checkOutDate: {
                      gt: checkInDate,
                      lte: checkOutDate
                    }
                  },
                  {
                    AND: [
                      { checkInDate: { lte: checkInDate } },
                      { checkOutDate: { gte: checkOutDate } }
                    ]
                  }
                ]
              }
            });

            const availableUnits = (room.totalUnits || 1) - bookedUnits;

            return {
              ...room,
              availableUnits,
              isAvailable: availableUnits > 0
            };
          } catch (error) {
            console.error(`Error checking availability for room ${room.id}:`, error);
            return {
              ...room,
              availableUnits: room.totalUnits || 1,
              isAvailable: true
            };
          }
        })
      );
    }
  }

  // Map property -> accommodation shape used by UI
  const accommodation = { 
    ...property, 
    roomTypes: roomsWithAvailability, 
    pricePerNight: property.basePrice, 
    currency: (property as any).currency || 'PKR' 
  } as any;

  return json({ 
    accommodation, 
    user, 
    isWishlisted, 
    reviews,
    ratingBreakdown,
    similarProperties,
    searchParams: checkIn && checkOut ? {
      checkIn,
      checkOut,
      adults,
      children,
      numberOfNights
    } : null
  });
}

export default function AccommodationDetail() {
  const { accommodation, user, isWishlisted, reviews, ratingBreakdown, similarProperties } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(undefined);
  const [numberOfRooms, setNumberOfRooms] = useState(1);

  const images = accommodation.images.length > 0 
    ? accommodation.images 
    : ["/landingPageImg.jpg"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBooking = () => {
    if (!user) {
      navigate(`/login?redirectTo=/accommodations/${accommodation.id}`);
      return;
    }
    
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
    });
    if (roomTypeId) params.set('roomTypeId', roomTypeId);
    navigate(`/book/property/${accommodation.id}?${params.toString()}`);
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const selectedRoomType = (accommodation.roomTypes || []).find((rt: any) => rt.id === roomTypeId);
  const pricePerNight = selectedRoomType?.basePrice || accommodation.pricePerNight;
  const totalPrice = nights * pricePerNight;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300"
          >
            <ChevronLeft size={48} />
          </button>
          
          <img
            src={images[currentImageIndex]}
            alt={`${accommodation.name} - Image ${currentImageIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          
          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-4 text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-[#01502E]">
            Home
          </Link>
          <span>/</span>
          <Link to="/accommodations" className="hover:text-[#01502E]">
            Search
          </Link>
          <span>/</span>
          <span className="text-gray-900">{accommodation.name}</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {accommodation.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin size={18} />
                <span>
                  {accommodation.city}, {accommodation.country}
                </span>
              </div>
              {accommodation.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="bg-[#01502E] text-white px-2 py-1 rounded text-sm font-semibold flex items-center gap-1">
                    <Star size={14} fill="white" />
                    {accommodation.rating.toFixed(1)}
                  </span>
                  <span className="text-sm">
                    ({accommodation.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
              <button 
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Share2 size={18} />
                Share
              </button>
            <button
              onClick={async () => {
                const next = !wishlisted;
                setWishlisted(next); // optimistic
                try {
                  await fetch('/api/wishlist-toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serviceType: 'property', serviceId: accommodation.id, action: next ? 'add' : 'remove' })
                  });
                  revalidator.revalidate();
                } catch {
                  setWishlisted(!next); // revert on error
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
                wishlisted
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
              Save
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#01502E] rounded-lg bg-[#01502E] text-white hover:bg-[#013d23] hover:border-[#013d23] transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Host
            </button>
          </div>
        </div>

        {/* Property Search Widget - Sticky */}
        {accommodation.roomTypes && accommodation.roomTypes.length > 0 && (
          <PropertySearchWidget propertyId={accommodation.id} />
        )}

        {/* Main Content with Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Tabs Content */}
          <div className="lg:col-span-2" data-rooms-tab>
            <PropertyDetailTabs
              property={{
                id: accommodation.id,
                name: accommodation.name,
                description: accommodation.description,
                address: accommodation.address,
                city: accommodation.city,
                country: accommodation.country,
                amenities: accommodation.amenities || [],
                latitude: accommodation.latitude,
                longitude: accommodation.longitude,
                cleaningFee: accommodation.cleaningFee || 0,
                serviceFee: accommodation.serviceFee || 0,
                taxRate: accommodation.taxRate || 0,
                currency: accommodation.currency || 'PKR'
              }}
              roomTypes={accommodation.roomTypes || []}
              reviews={reviews}
              checkIn={checkIn ? new Date(checkIn) : null}
              checkOut={checkOut ? new Date(checkOut) : null}
              numberOfNights={nights}
              numberOfRooms={numberOfRooms}
              selectedRoomId={roomTypeId || null}
              onRoomSelect={(roomId) => setRoomTypeId(roomId)}
              onDateChange={(newCheckIn, newCheckOut) => {
                setCheckIn(newCheckIn ? newCheckIn.toISOString().split('T')[0] : '');
                setCheckOut(newCheckOut ? newCheckOut.toISOString().split('T')[0] : '');
              }}
              onGuestsChange={(adults, children) => {
                setGuests(adults + children);
              }}
            />
          </div>

          {/* Quick Booking Card (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="mb-4">
                {roomTypeId && accommodation.roomTypes?.find((rt: any) => rt.id === roomTypeId) ? (
                  <>
                    <div className="text-xs text-gray-600 mb-1">Selected Room</div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      {accommodation.roomTypes.find((rt: any) => rt.id === roomTypeId)?.name}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#01502E]">
                        {accommodation.currency} {accommodation.roomTypes.find((rt: any) => rt.id === roomTypeId)?.basePrice.toLocaleString()}
                      </span>
                      <span className="text-gray-600">/ night</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-600 mb-1">Starting from</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#01502E]">
                        {accommodation.currency} {accommodation.basePrice.toLocaleString()}
                      </span>
                      <span className="text-gray-600">/ night</span>
                    </div>
                  </>
                )}
              </div>

              {nights > 0 && roomTypeId && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#01502E]">
                      {accommodation.currency} {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!checkIn || !checkOut || guests < 1 || !roomTypeId}
                className="w-full py-3 bg-[#01502E] text-white rounded-lg font-semibold hover:bg-[#013d23] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {!roomTypeId ? "Select a Room First" : user ? "Reserve Now" : "Sign in to book"}
              </button>

              <p className="text-center text-sm text-gray-600 mt-3">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-2 mb-8 h-[400px]">
          <div
            className="col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-l-lg"
            onClick={() => {
              setCurrentImageIndex(0);
              setShowGallery(true);
            }}
          >
            <img
              src={images[0]}
              alt={accommodation.name}
              className="w-full h-full object-cover hover:scale-105 transition"
            />
          </div>
          {images.slice(1, 5).map((image: string, idx: number) => (
            <div
              key={idx}
              className={`cursor-pointer overflow-hidden ${
                idx === 3 ? "rounded-tr-lg" : ""
              } ${idx === 1 ? "rounded-br-lg" : ""}`}
              onClick={() => {
                setCurrentImageIndex(idx + 1);
                setShowGallery(true);
              }}
            >
              <img
                src={image}
                alt={`${accommodation.name} - ${idx + 2}`}
                className="w-full h-full object-cover hover:scale-105 transition"
              />
            </div>
          ))}
          {images.length > 5 && (
            <button
              onClick={() => setShowGallery(true)}
              className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-50"
            >
              Show all {images.length} photos
            </button>
          )}
        </div>

        {/* Reviews Section - Keep separate for now, will be in tabs */}
        <div className="mt-12">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#01502E]">
                    {accommodation.currency} {accommodation.basePrice.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/ night</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={accommodation.maxGuests}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {nights > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">
                      {accommodation.currency} {accommodation.pricePerNight.toLocaleString()} × {nights} nights
                    </span>
                    <span className="font-semibold">{accommodation.currency} {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#01502E]">{accommodation.currency} {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!checkIn || !checkOut || guests < 1}
                className="w-full py-3 bg-[#01502E] text-white rounded-lg font-semibold hover:bg-[#013d23] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {user ? "Reserve" : "Sign in to book"}
              </button>

              <p className="text-center text-sm text-gray-600 mt-3">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Guest Reviews</h2>
          
          {reviews.length > 0 ? (
            <>
              {/* Rating Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Overall Rating */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-[#01502E]">
                        {accommodation.rating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            fill={i < Math.round(accommodation.rating) ? "#01502E" : "none"}
                            className={i < Math.round(accommodation.rating) ? "text-[#01502E]" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {accommodation.reviewCount} reviews
                      </p>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-12">{rating} stars</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#01502E]"
                            style={{
                              width: `${reviews.length > 0 ? (ratingBreakdown[rating as keyof typeof ratingBreakdown] / reviews.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {ratingBreakdown[rating as keyof typeof ratingBreakdown]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {review.user?.avatar ? (
                          <img
                            src={review.user.avatar}
                            alt={review.user.name || "User"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#01502E] flex items-center justify-center text-white font-bold">
                            {review.user?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{review.user?.name || "Anonymous"}</h3>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                fill={i < review.rating ? "#01502E" : "none"}
                                className={i < review.rating ? "text-[#01502E]" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">No reviews yet. Be the first to review this property!</p>
            </div>
          )}
        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Similar Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/accommodations/${property.id}`}
                  className="bg-white shadow-md rounded-lg overflow-hidden transition transform hover:scale-105 hover:shadow-xl block"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.images[0] || "/landingPageImg.jpg"}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-semibold text-gray-700">
                      {property.type}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-[#01502E] font-semibold text-lg mb-1 line-clamp-1">
                      {property.name}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span className="line-clamp-1">
                        {property.city}, {property.country}
                      </span>
                    </div>

                    {/* Price and Rating */}
          <div className="flex justify-between items-center mt-3">
            <div>
              <span className="text-xl font-bold text-[#01502E]">
                {accommodation.currency} {property.basePrice.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600"> /night</span>
            </div>
                      
                      {property.reviewCount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="bg-[#01502E] text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Star size={12} fill="white" />
                            {property.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Chat Interface Modal */}
      {accommodation?.owner?.user?.id && (
        <ChatInterface
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          targetUserId={accommodation.owner.user.id}
          currentUserId={user?.id}
          initialMessage={`Hi, I'm interested in ${accommodation.name}${checkIn && checkOut ? ` for ${checkIn} to ${checkOut}` : ''}.`}
          fetchConversation={async ({ targetUserId, conversationId }) => {
            console.log('🔵 [Accommodation] Fetching conversation:', { targetUserId, conversationId });
            
            // If we have conversationId, fetch it directly
            if (conversationId) {
              const response = await fetch(`/api/chat/conversations/${conversationId}`);
              if (!response.ok) throw new Error("Failed to fetch conversation");
              const json = await response.json();
              return {
                conversation: {
                  id: json.data?.id,
                  participants: json.data?.participants || [],
                  updatedAt: json.data?.lastMessageAt,
                  lastMessage: json.data?.messages?.[json.data.messages.length - 1],
                  unreadCount: 0
                },
                messages: json.data?.messages || []
              };
            }
            
            // Otherwise create/get conversation by targetUserId
            if (targetUserId) {
              const createRes = await fetch(`/api/chat/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, type: 'CUSTOMER_PROVIDER' })
              });
              if (!createRes.ok) throw new Error("Failed to create conversation");
              const createJson = await createRes.json();
              const convId = createJson.data?.id;
              
              console.log('🟢 [Accommodation] Conversation created:', convId);
              
              // Fetch the full conversation details
              const response = await fetch(`/api/chat/conversations/${convId}`);
              if (!response.ok) throw new Error("Failed to fetch conversation");
              const json = await response.json();
              
              return {
                conversation: {
                  id: json.data?.id,
                  participants: json.data?.participants || [],
                  updatedAt: json.data?.lastMessageAt,
                  lastMessage: json.data?.messages?.[json.data.messages.length - 1],
                  unreadCount: 0
                },
                messages: json.data?.messages || []
              };
            }
            
            throw new Error('No conversationId or targetUserId provided');
          }}
          onSendMessage={async ({ conversationId, targetUserId, text }) => {
            console.log('🔵 [Accommodation] Sending message:', { conversationId, targetUserId, text: text?.substring(0, 20) });
            let cid = conversationId;
            
            // Create conversation if needed
            if (!cid && targetUserId) {
              const convRes = await fetch(`/api/chat/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, type: 'CUSTOMER_PROVIDER' })
              });
              if (!convRes.ok) throw new Error('Failed to create conversation');
              const convJson = await convRes.json();
              cid = convJson?.data?.id;
              console.log('🟢 [Accommodation] Conversation created:', cid);
            }
            
            if (!cid) throw new Error('Missing conversation ID');
            
            const res = await fetch(`/api/chat/conversations/${cid}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: text })
            });
            
            if (!res.ok) {
              const errorText = await res.text();
              console.error('🔴 [Accommodation] Failed to send message:', res.status, errorText);
              throw new Error('Failed to send message');
            }
            
            const json = await res.json();
            if (!json?.success) throw new Error('Failed to send message');
            
            const m = json.data;
            console.log('🟢 [Accommodation] Message sent:', m.id);
            
            return {
              id: m.id,
              conversationId: m.conversationId || cid,
              senderId: m.senderId,
              senderName: m.senderName || m.sender?.name || 'Unknown',
              senderAvatar: m.senderAvatar || m.sender?.avatar,
              content: m.content,
              type: (m.type || 'text').toString().toLowerCase(),
              attachments: Array.isArray(m.attachments) ? m.attachments : [],
              createdAt: m.createdAt,
              status: 'sent',
            };
          }}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={accommodation.name}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        description={`Check out this beautiful ${accommodation.propertyType} in ${accommodation.location}! ${accommodation.amenities?.slice(0, 3).join(', ')}`}
        image={accommodation.images[0]}
      />

      {/* Floating Share Button */}
      <FloatingShareButton
        title={accommodation.name}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        description={`Check out this beautiful ${accommodation.propertyType} in ${accommodation.location}! ${accommodation.amenities?.slice(0, 3).join(', ')}`}
        image={accommodation.images[0]}
        position="bottom-right"
        variant="floating"
      />
    </div>
  );
}
