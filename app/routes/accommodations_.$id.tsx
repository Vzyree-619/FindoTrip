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
import { calculateStayPrice } from "~/lib/pricing.server";
import { checkRoomAvailability, getRoomAvailabilityCalendar, checkDateRangeAvailability, suggestAlternativeDates } from "~/lib/availability.server";
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

  // Fetch similar properties with room types for starting price
  const similarPropertiesRaw = await prisma.property.findMany({
    where: {
      id: { not: id },
      city: property.city,
      type: property.type,
      available: true,
      approvalStatus: "APPROVED",
    },
    include: {
      roomTypes: {
        where: { available: true },
        select: { basePrice: true },
        orderBy: { basePrice: 'asc' },
        take: 1
      }
    },
    take: 4,
    orderBy: { rating: "desc" },
  });

  // Calculate starting price for similar properties
  const similarProperties = similarPropertiesRaw.map(p => {
    const lowestRoom = p.roomTypes[0];
    const startingPrice = lowestRoom ? lowestRoom.basePrice : p.basePrice;
    return {
      ...p,
      startingPrice,
      images: p.images || [],
      basePrice: p.basePrice || 0,
      currency: (p as any).currency || 'PKR'
    };
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

      // For each room, get 12 months of availability data and check specific dates
      roomsWithAvailability = await Promise.all(
        roomTypes.map(async (room) => {
          try {
            // Get availability calendar for next 12 months
            const availabilityCalendar = await getRoomAvailabilityCalendar(
              room.id,
              new Date(),
              12
            );

            // Check specific date range availability
            const dateRangeAvailability = await checkDateRangeAvailability(
              room.id,
              checkInDate,
              checkOutDate,
              1 // Check for 1 room
            );

            let dateRangeInfo = null;

            try {
              if (dateRangeAvailability.isAvailable) {
                // Calculate dynamic pricing for the stay
                const dynamicPricing = await calculateStayPrice(
                  room.id,
                  checkInDate,
                  checkOutDate
                );

                dateRangeInfo = {
                  isAvailable: true,
                  pricing: dynamicPricing,
                  numberOfNights: dateRangeAvailability.numberOfNights
                };
              } else {
                // Get alternative date suggestions
                const suggestions = await suggestAlternativeDates(
                  room.id,
                  checkInDate,
                  numberOfNights,
                  5 // Limit suggestions for performance
                );

                dateRangeInfo = {
                  isAvailable: false,
                  conflicts: dateRangeAvailability.conflicts,
                  reason: dateRangeAvailability.reason,
                  suggestions
                };
              }
            } catch (error) {
              console.error(`Error processing availability for room ${room.id}:`, error);
              // Always provide some dateRangeInfo so the UI knows dates were processed
              dateRangeInfo = {
                isAvailable: false,
                reason: 'Unable to check availability'
              };
            }

            return {
              ...room,
              availabilityCalendar,
              dateRangeInfo
            };
          } catch (error) {
            console.error(`Error checking availability for room ${room.id}:`, error);
            return {
              ...room,
              availabilityCalendar: [],
              dateRangeInfo: {
                isAvailable: false,
                reason: 'Availability check failed'
              }
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
  const { accommodation, user, isWishlisted, reviews, ratingBreakdown, similarProperties, searchParams } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(undefined);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

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
      checkIn: searchParams?.checkIn || '',
      checkOut: searchParams?.checkOut || '',
      guests: guests.toString(),
    });
    if (roomTypeId) params.set('roomTypeId', roomTypeId);
    navigate(`/book/property/${accommodation.id}?${params.toString()}`);
  };

  const calculateNights = () => {
    if (!searchParams?.checkIn || !searchParams?.checkOut) return 0;
    const start = new Date(searchParams.checkIn);
    const end = new Date(searchParams.checkOut);
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
            src={imageErrors[currentImageIndex] ? "/landingPageImg.jpg" : images[currentImageIndex]}
            alt={`${accommodation.name} - Image ${currentImageIndex + 1}`}
            onError={() => setImageErrors(prev => ({ ...prev, [currentImageIndex]: true }))}
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
        <PropertySearchWidget propertyId={accommodation.id} />

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
              checkIn={searchParams?.checkIn ? new Date(searchParams.checkIn) : null}
              checkOut={searchParams?.checkOut ? new Date(searchParams.checkOut) : null}
              numberOfNights={searchParams?.numberOfNights || 1}
              numberOfRooms={numberOfRooms}
              selectedRoomId={roomTypeId || null}
              onRoomSelect={(roomId) => setRoomTypeId(roomId)}
            />
          </div>

          {/* Quick Booking Card (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="mb-4">
                {roomTypeId && accommodation.roomTypes?.find((rt: any) => rt.id === roomTypeId) ? (() => {
                  const selectedRoom = accommodation.roomTypes.find((rt: any) => rt.id === roomTypeId);
                  const displayPrice = nights > 0 && selectedRoom?.avgPricePerNight 
                    ? selectedRoom.avgPricePerNight 
                    : selectedRoom?.basePrice || 0;
                  const isDynamicPrice = nights > 0 && selectedRoom?.dynamicPricing;
                  
                  return (
                    <>
                      <div className="text-xs text-gray-600 mb-1">Selected Room</div>
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        {selectedRoom?.name}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[#01502E]">
                          {accommodation.currency} {displayPrice.toLocaleString()}
                        </span>
                        <span className="text-gray-600">/ night</span>
                      </div>
                      {isDynamicPrice && (
                        <div className="text-xs text-gray-500 mt-1">
                          Average price for selected dates
                        </div>
                      )}
                    </>
                  );
                })() : (
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

              {nights > 0 && roomTypeId && (() => {
                const selectedRoom = accommodation.roomTypes?.find((rt: any) => rt.id === roomTypeId);
                const dynamicPricing = selectedRoom?.dynamicPricing;
                const displayTotal = dynamicPricing?.total || selectedRoom?.totalPrice || totalPrice;
                const displayAvg = dynamicPricing?.averagePricePerNight || selectedRoom?.avgPricePerNight || pricePerNight;
                
                return (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-3">
                      {nights} night{nights !== 1 ? 's' : ''}: {searchParams?.checkIn && searchParams?.checkOut ? `${new Date(searchParams.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(searchParams.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </div>
                    
                    {dynamicPricing && dynamicPricing.nights ? (
                      <>
                        {/* Per-night breakdown */}
                        <div className="space-y-1 mb-3 text-sm">
                          {dynamicPricing.nights.slice(0, 3).map((night: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-gray-600">
                                Night {idx + 1} ({new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}):
                              </span>
                              <span className="font-medium">
                                {accommodation.currency} {night.finalPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {dynamicPricing.nights.length > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              ... and {dynamicPricing.nights.length - 3} more night{dynamicPricing.nights.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <div className="border-t pt-2 mb-2"></div>
                        
                        {/* Fees breakdown */}
                        <div className="space-y-1 mb-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>{accommodation.currency} {dynamicPricing.subtotal.toLocaleString()}</span>
                          </div>
                          {dynamicPricing.cleaningFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cleaning fee:</span>
                              <span>{accommodation.currency} {dynamicPricing.cleaningFee.toLocaleString()}</span>
                            </div>
                          )}
                          {dynamicPricing.serviceFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Service fee:</span>
                              <span>{accommodation.currency} {dynamicPricing.serviceFee.toLocaleString()}</span>
                            </div>
                          )}
                          {dynamicPricing.taxAmount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Taxes:</span>
                              <span>{accommodation.currency} {dynamicPricing.taxAmount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="border-t pt-2 mb-2"></div>
                        
                        {/* Total and average */}
                        <div className="flex justify-between text-lg font-bold mb-2">
                          <span>Total:</span>
                          <span className="text-[#01502E]">
                            {accommodation.currency} {displayTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 text-center">
                          Avg: {accommodation.currency} {displayAvg.toLocaleString()}/night
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total:</span>
                          <span className="text-[#01502E]">
                            {accommodation.currency} {displayTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 text-center mt-2">
                          Avg: {accommodation.currency} {displayAvg.toLocaleString()}/night
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={handleBooking}
                disabled={!searchParams?.checkIn || !searchParams?.checkOut || guests < 1 || !roomTypeId}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 h-[300px] md:h-[400px]">
          <div
            className="col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-l-lg"
            onClick={() => {
              setCurrentImageIndex(0);
              setShowGallery(true);
            }}
          >
            <img
              src={imageErrors[0] ? "/landingPageImg.jpg" : images[0]}
              alt={accommodation.name}
              onError={() => setImageErrors(prev => ({ ...prev, [0]: true }))}
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
                src={imageErrors[idx + 1] ? "/landingPageImg.jpg" : image}
                alt={`${accommodation.name} - ${idx + 2}`}
                onError={() => setImageErrors(prev => ({ ...prev, [idx + 1]: true }))}
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
                      src={(property.images && property.images.length > 0) ? property.images[0] : "/landingPageImg.jpg"}
                      alt={property.name || "Property"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/landingPageImg.jpg";
                      }}
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
                {property.currency || accommodation.currency} {(property.startingPrice || property.basePrice || 0).toLocaleString()}
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
          fetchConversation={async ({ targetUserId, conversationId }) => {
            console.log('🔵 [Accommodation] Fetching conversation:', { targetUserId, conversationId });
            
            // Get owner name from accommodation data as fallback
            const ownerName = accommodation?.owner?.user?.name;
            const ownerAvatar = accommodation?.owner?.user?.avatar;
            const ownerId = accommodation?.owner?.user?.id;
            
            // If we have conversationId, fetch it directly
            if (conversationId) {
              const response = await fetch(`/api/chat/conversations/${conversationId}`);
              if (!response.ok) throw new Error("Failed to fetch conversation");
              const json = await response.json();
              
              // Ensure owner name is correct in participants
              const participants = (json.data?.participants || []).map((p: any) => {
                if (p.id === ownerId && ownerName) {
                  return { ...p, name: ownerName, avatar: ownerAvatar || p.avatar };
                }
                return p;
              });
              
              return {
                conversation: {
                  id: json.data?.id,
                  participants: participants,
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
              
              // Ensure owner name is correct in participants
              const participants = (json.data?.participants || []).map((p: any) => {
                if (p.id === ownerId && ownerName) {
                  return { ...p, name: ownerName, avatar: ownerAvatar || p.avatar };
                }
                return p;
              });
              
              return {
                conversation: {
                  id: json.data?.id,
                  participants: participants,
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
