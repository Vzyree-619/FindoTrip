import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useRevalidator, useNavigate, useSearchParams, useOutlet } from "@remix-run/react";
import ShareModal from "~/components/common/ShareModal";
import FloatingShareButton from "~/components/common/FloatingShareButton";
import PropertyDetailTabs from "~/components/property/PropertyDetailTabs";
import PropertySearchWidget from "~/components/property/PropertySearchWidget";
import { ChatInterface } from "~/components/chat/ChatInterface";
import { useEffect, useState } from "react";
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
                  pricing: {
                    nights: [],
                    subtotal: room.basePrice * numberOfNights,
                    cleaningFee: 0,
                    serviceFee: 0,
                    taxAmount: 0,
                    total: room.basePrice * numberOfNights,
                    averagePricePerNight: room.basePrice
                  },
                  numberOfNights: dateRangeAvailability.numberOfNights
                };
              } else {
                dateRangeInfo = {
                  isAvailable: false,
                  conflicts: dateRangeAvailability.conflicts,
                  reason: dateRangeAvailability.reason,
                  suggestions: []
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
              availabilityCalendar: [],
              dateRangeInfo
            };
          } catch (error) {
            console.error(`Error checking availability for room ${room.id}:`, error);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
              message: error.message,
              name: error.name,
              code: error.code
            });
            return {
              ...room,
              availabilityCalendar: [],
              dateRangeInfo: {
                isAvailable: false,
                reason: `Unable to check availability`
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
  const outlet = useOutlet();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [urlSearchParams] = useSearchParams();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // Read roomTypeId from URL
  const urlRoomTypeId = urlSearchParams.get("roomTypeId");
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(urlRoomTypeId || undefined);

  // Derive the most up-to-date dates/guests from the URL (fallback to loader data)
  const urlCheckIn = urlSearchParams.get("checkIn");
  const urlCheckOut = urlSearchParams.get("checkOut");
  const urlAdults = urlSearchParams.get("adults");
  const urlChildren = urlSearchParams.get("children");

  const checkInDate = urlCheckIn
    ? new Date(urlCheckIn)
    : searchParams?.checkIn
      ? new Date(searchParams.checkIn)
      : null;
  const checkOutDate = urlCheckOut
    ? new Date(urlCheckOut)
    : searchParams?.checkOut
      ? new Date(searchParams.checkOut)
      : null;

  const parsedAdults = Number.isNaN(parseInt(urlAdults || "", 10)) ? undefined : parseInt(urlAdults || "0", 10);
  const parsedChildren = Number.isNaN(parseInt(urlChildren || "", 10)) ? undefined : parseInt(urlChildren || "0", 10);
  const totalGuests =
    (searchParams?.adults ?? parsedAdults ?? 0) +
    (searchParams?.children ?? parsedChildren ?? 0);

  // Force a revalidation when URL dates change so availability/pricing refreshes
  useEffect(() => {
    const loaderCheckIn = searchParams?.checkIn || null;
    const loaderCheckOut = searchParams?.checkOut || null;

    if (urlCheckIn !== loaderCheckIn || urlCheckOut !== loaderCheckOut) {
      revalidator.revalidate();
    }
  }, [urlCheckIn, urlCheckOut, searchParams?.checkIn, searchParams?.checkOut, revalidator]);

  // Sync roomTypeId from URL and scroll to rooms section
  useEffect(() => {
    if (urlRoomTypeId && urlRoomTypeId !== roomTypeId) {
      setRoomTypeId(urlRoomTypeId);
      // Scroll to rooms section after a brief delay to ensure rendering
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const roomsSection = document.getElementById("rooms-section");
          if (roomsSection) {
            roomsSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }, 300);
    }
  }, [urlRoomTypeId]);

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
    
    const checkInValue = checkInDate
      ? checkInDate.toISOString().split("T")[0]
      : urlCheckIn || searchParams?.checkIn || "";
    const checkOutValue = checkOutDate
      ? checkOutDate.toISOString().split("T")[0]
      : urlCheckOut || searchParams?.checkOut || "";

    const params = new URLSearchParams({
      checkIn: checkInValue,
      checkOut: checkOutValue,
      guests: Math.max(totalGuests, 1).toString(),
    });
    if (roomTypeId) params.set('roomTypeId', roomTypeId);
    navigate(`/book/property/${accommodation.id}?${params.toString()}`);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) return 0;
    const start = checkInDate;
    const end = checkOutDate;
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const selectedRoomType = (accommodation.roomTypes || []).find((rt: any) => rt.id === roomTypeId);
  const pricePerNight = selectedRoomType?.basePrice || accommodation.pricePerNight;
  const totalPrice = nights * pricePerNight;

  const handleBookRoom = (roomId: string) => {
    if (!checkInDate || !checkOutDate) return;
    const params = new URLSearchParams({
      roomTypeId: roomId,
      checkIn: checkInDate.toISOString().split("T")[0],
      checkOut: checkOutDate.toISOString().split("T")[0],
      guests: Math.max(totalGuests, 1).toString(),
    });
    navigate(`/book/property/${accommodation.id}?${params.toString()}`);
  };

  const handleViewRoomDetails = (roomId: string) => {
    console.log('handleViewRoomDetails called with roomId:', roomId);
    
    const checkInValue = checkInDate
      ? checkInDate.toISOString().split("T")[0]
      : urlCheckIn || "";
    const checkOutValue = checkOutDate
      ? checkOutDate.toISOString().split("T")[0]
      : urlCheckOut || "";

    const params = new URLSearchParams();
    if (checkInValue) params.set('checkIn', checkInValue);
    if (checkOutValue) params.set('checkOut', checkOutValue);
    params.set('adults', urlAdults || searchParams?.adults?.toString() || '2');
    params.set('children', urlChildren || searchParams?.children?.toString() || '0');
    
    const targetUrl = `/accommodations/${accommodation.id}/rooms/${roomId}?${params.toString()}`;
    console.log('Navigating to:', targetUrl);
    
    navigate(targetUrl);
  };

  // If a nested route is active (e.g., room details), render it instead of the parent page
  if (outlet) return outlet;

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
              onClick={() => accommodation?.owner?.user?.id && user?.id && setChatOpen(true)}
              disabled={!accommodation?.owner?.user?.id || !user?.id}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#01502E] rounded-lg bg-[#01502E] text-white hover:bg-[#013d23] hover:border-[#013d23] transition-all duration-200 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-5 h-5" />
              {user?.id ? "Contact Host" : "Login to message"}
            </button>
          </div>
        </div>

        {/* Property Search Widget - Sticky */}
        <PropertySearchWidget propertyId={accommodation.id} />

        {/* Main Content with Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Tabs Content */}
          <div id="rooms-section" data-rooms-tab>
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
            checkIn={checkInDate}
            checkOut={checkOutDate}
            numberOfNights={nights || 1}
              numberOfRooms={numberOfRooms}
              selectedRoomId={roomTypeId || null}
              onRoomSelect={(roomId) => setRoomTypeId(roomId)}
            onBook={handleBookRoom}
            onViewDetails={handleViewRoomDetails}
            />
          </div>
        </div>

        {/* Image Gallery */}
        <div id="accommodation-gallery" className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 h-[300px] md:h-[400px]" data-gallery-top>
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
      {/* Chat Interface */}
      {accommodation?.owner?.user?.id && user?.id && chatOpen && (
        <ChatInterface
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          targetUserId={accommodation.owner.user.id}
          targetUserName={accommodation.owner.user.name || "Property Owner"}
          targetUserAvatar={accommodation.owner.user.avatar || undefined}
          currentUserId={user.id}
          variant="modal"
          fetchConversation={async ({ conversationId, targetUserId }) => {
            try {
              // If we have a conversationId, fetch it directly
              if (conversationId) {
                const response = await fetch(`/api/chat/conversations/${conversationId}`);
                if (!response.ok) throw new Error("Failed to fetch conversation");
                const data = await response.json();
                const conversationData = data.data;
                
                if (!conversationData) {
                  return { conversation: null, messages: [] };
                }
                
                // Format messages properly
                const messages = conversationData.messages || [];
                const formattedMessages = messages.map((m: any) => {
                  const senderName = m.senderName || m.sender?.name || "Unknown";
                  const senderAvatar = m.senderAvatar || m.sender?.avatar || null;
                  const messageType = m.type ? (typeof m.type === 'string' ? m.type.toLowerCase() : m.type.toString().toLowerCase()) : "text";
                  const createdAt = m.createdAt instanceof Date 
                    ? m.createdAt.toISOString() 
                    : (typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString());
                  
                  return {
                    id: m.id,
                    conversationId: conversationId,
                    senderId: m.senderId,
                    senderName,
                    senderAvatar,
                    content: m.content || "",
                    type: messageType,
                    attachments: Array.isArray(m.attachments) ? m.attachments : [],
                    createdAt,
                    status: "sent" as const,
                  };
                });
                
                return { 
                  conversation: conversationData.conversation || conversationData, 
                  messages: formattedMessages 
                };
              }

              // Otherwise, try to get or create conversation
              if (targetUserId) {
                const response = await fetch("/api/chat/conversations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    targetUserId,
                    type: "CUSTOMER_PROVIDER",
                    relatedServiceId: accommodation.id,
                    relatedServiceType: "PROPERTY",
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || "Failed to create conversation");
                }

                const data = await response.json();
                const conv = data.data;

                // Now fetch messages for this conversation
                if (conv?.id) {
                  const messagesResponse = await fetch(`/api/chat/conversations/${conv.id}`);
                  if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    const conversationData = messagesData.data || conv;
                    
                    // Ensure messages are properly formatted from MessageWithSender to Message
                    // The conversationData should have a messages array
                    let messages = conversationData.messages || [];
                    
                    // If messages array is empty or missing, try to fetch them separately
                    if (!messages || messages.length === 0) {
                      try {
                        const messagesOnlyResponse = await fetch(`/api/chat/conversations/${conv.id}/messages?limit=100`);
                        if (messagesOnlyResponse.ok) {
                          const messagesOnlyData = await messagesOnlyResponse.json();
                          messages = messagesOnlyData.data?.messages || [];
                        }
                      } catch (err) {
                        console.error("Error fetching messages separately:", err);
                      }
                    }
                    
                    // Sort messages by createdAt to ensure chronological order
                    messages.sort((a: any, b: any) => {
                      const dateA = new Date(a.createdAt || a.createdAt).getTime();
                      const dateB = new Date(b.createdAt || b.createdAt).getTime();
                      return dateA - dateB;
                    });
                    
                    const formattedMessages = messages.map((m: any) => {
                      // Handle both MessageWithSender and Message formats
                      const senderName = m.senderName || m.sender?.name || "Unknown";
                      const senderAvatar = m.senderAvatar || m.sender?.avatar || null;
                      const messageType = m.type ? (typeof m.type === 'string' ? m.type.toLowerCase() : m.type.toString().toLowerCase()) : "text";
                      const createdAt = m.createdAt instanceof Date 
                        ? m.createdAt.toISOString() 
                        : (typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString());
                      
                      return {
                        id: m.id,
                        conversationId: conv.id,
                        senderId: m.senderId,
                        senderName,
                        senderAvatar,
                        content: m.content || "",
                        type: messageType,
                        attachments: Array.isArray(m.attachments) ? m.attachments : [],
                        createdAt,
                        status: "sent" as const,
                        isEdited: m.isEdited || false,
                        editedAt: m.editedAt ? (m.editedAt instanceof Date ? m.editedAt.toISOString() : m.editedAt) : undefined,
                        isDeleted: m.isDeleted || false,
                      };
                    });
                    
                    // Ensure conversation has participants
                    const conversation = conversationData.conversation || conversationData;
                    if (!conversation.participants || conversation.participants.length === 0) {
                      // If participants are missing, add them from the property owner
                      conversation.participants = [
                        { id: user.id, name: user.name, avatar: user.avatar, role: user.role },
                        { id: accommodation.owner.user.id, name: accommodation.owner.user.name, avatar: accommodation.owner.user.avatar, role: "PROPERTY_OWNER" }
                      ];
                    }
                    
                    return { 
                      conversation, 
                      messages: formattedMessages 
                    };
                  }
                }

                return { conversation: conv, messages: [] };
              }

              return { conversation: null, messages: [] };
            } catch (error) {
              console.error("Error fetching conversation:", error);
              return { conversation: null, messages: [] };
            }
          }}
          onSendMessage={async ({ conversationId, targetUserId, text, files }) => {
            try {
              let response;
              let jsonData;

              // If we have a conversationId, send to that conversation
              if (conversationId) {
                response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: text }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || "Failed to send message");
                }

                jsonData = await response.json();
                const m = jsonData.data || jsonData;
                
                // Normalize message format
                return {
                  id: m.id,
                  conversationId: conversationId,
                  senderId: m.senderId,
                  senderName: m.senderName || m.sender?.name || "Unknown",
                  senderAvatar: m.senderAvatar || m.sender?.avatar || null,
                  content: m.content,
                  type: (m.type || "text").toString().toLowerCase(),
                  attachments: Array.isArray(m.attachments) ? m.attachments : [],
                  createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt || new Date().toISOString()),
                  status: "sent",
                };
              }

              // Otherwise, use the chat.send endpoint which creates conversation if needed
              const formData = new FormData();
              if (targetUserId) formData.append("targetUserId", targetUserId);
              formData.append("text", text);
              if (files) {
                files.forEach((file) => formData.append("files", file));
              }

              response = await fetch("/api/chat/send", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to send message");
              }

              jsonData = await response.json();
              const m = jsonData.data || jsonData;
              
              // Normalize message format
              const normalizedMessage = {
                id: m.id,
                conversationId: m.conversationId || conversationId,
                senderId: m.senderId,
                senderName: m.senderName || "Unknown",
                senderAvatar: m.senderAvatar || null,
                content: m.content,
                type: (m.type || "text").toString().toLowerCase(),
                attachments: Array.isArray(m.attachments) ? m.attachments : [],
                createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt || new Date().toISOString()),
                status: "sent" as const,
              };
              
              return normalizedMessage;
            } catch (error) {
              console.error("Error sending message:", error);
              throw error;
            }
          }}
          onLoadMore={async ({ conversationId, before }) => {
            if (!conversationId) return [];
            try {
              const url = new URL(`/api/chat/conversations/${conversationId}/messages`, window.location.origin);
              if (before) url.searchParams.set("before", before);
              
              const response = await fetch(url.toString());
              if (!response.ok) throw new Error("Failed to load messages");
              const data = await response.json();
              return data.data?.messages || [];
            } catch (error) {
              console.error("Error loading more messages:", error);
              return [];
            }
          }}
        />
      )}

      {/* Fallback for non-logged-in users */}
      {(!user?.id || !accommodation?.owner?.user?.id) && chatOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4"
          onClick={() => setChatOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contact Host</h3>
                <p className="text-sm text-gray-600">Send a message or email the host.</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setChatOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              {!user?.id ? (
                <div>
                  <p className="mb-4">Please log in to message the host.</p>
                  <Link
                    to={`/login?redirectTo=/accommodations/${accommodation.id}`}
                    className="inline-block px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] font-semibold"
                  >
                    Log In
                  </Link>
                </div>
              ) : (
                <p>Unable to load chat. Please try again later.</p>
              )}
              {accommodation.owner.user.email && (
                <p className="mt-4">
                  Or email:{" "}
                  <a className="text-[#01502E] font-semibold hover:underline" href={`mailto:${accommodation.owner.user.email}`}>
                    {accommodation.owner.user.email}
                  </a>
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23]"
                onClick={() => setChatOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
