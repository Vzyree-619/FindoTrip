import { Link } from "@remix-run/react";
import { MapPin, Users, Bed, Bath, Star, Heart, Wifi, Car, Dumbbell, Utensils } from "lucide-react";
import { useState, useEffect } from "react";

interface PropertyCardProps {
  id: string;
  name: string;
  city: string;
  country: string;
  type: string;
  pricePerNight: number;
  currency?: string;
  nights?: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  rating: number;
  reviewCount: number;
  amenities?: string[];
  roomTypeCount?: number;
  isRoomBased?: boolean;
  starRating?: number;
  mainImage?: string;
}

// Amenity icon mapping
const amenityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Free WiFi': Wifi,
  'Parking': Car,
  'Free Parking': Car,
  'Gym': Dumbbell,
  'Fitness Center': Dumbbell,
  'Restaurant': Utensils,
  'Pool': '🏊',
  'Spa': '💆',
  'Air Conditioning': '❄️',
  'Pet Friendly': '🐾',
};

export default function PropertyCard({
  id,
  name,
  city,
  country,
  type,
  pricePerNight,
  currency = "PKR",
  nights,
  maxGuests,
  bedrooms,
  bathrooms,
  images,
  rating,
  reviewCount,
  amenities = [],
  roomTypeCount,
  isRoomBased = false,
  starRating,
  mainImage,
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const mainImageUrl = mainImage || images[0] || "/landingPageImg.jpg";
  const fallbackImage = "/landingPageImg.jpg";

  // Load initial favorite state
  useEffect(() => {
    const loadFavoriteState = async () => {
      try {
        const response = await fetch('/dashboard/favorites', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const propertyIds = data.favorites?.properties?.map((p: any) => p.id) || [];
          setIsFavorite(propertyIds.includes(id));
        }
      } catch (error) {
        // Silently fail - user might not be logged in
      }
    };
    loadFavoriteState();
  }, [id]);
  
  // Format price
  const formattedPrice = `${currency} ${pricePerNight.toLocaleString()}`;
  const perNightPrice = nights && nights > 0 ? Math.round(pricePerNight / nights) : pricePerNight;
  const formattedPerNight = `${currency} ${perNightPrice.toLocaleString()}`;

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "bg-green-600";
    if (rating >= 8) return "bg-green-500";
    if (rating >= 7) return "bg-orange-500";
    return "bg-red-500";
  };

  // Get rating text
  const getRatingText = (rating: number) => {
    if (rating >= 9) return "Exceptional";
    if (rating >= 8) return "Excellent";
    if (rating >= 7) return "Very Good";
    if (rating >= 6) return "Good";
    return "Fair";
  };

  // Get top 4 amenities with icons
  const topAmenities = amenities.slice(0, 4).map(amenity => {
    const normalized = amenity.toLowerCase();
    const icon = Object.keys(amenityIcons).find(key => 
      normalized.includes(key.toLowerCase())
    );
    return {
      name: amenity,
      icon: icon ? amenityIcons[icon] : null,
      isEmoji: typeof amenityIcons[icon] === 'string'
    };
  });

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState); // Optimistic update
    
    try {
      const response = await fetch('/api/wishlist-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceType: 'property',
          serviceId: id,
          action: newFavoriteState ? 'add' : 'remove'
        })
      });

      if (!response.ok) {
        // Revert on error
        setIsFavorite(!newFavoriteState);
        const errorData = await response.json().catch(() => ({ error: 'Failed to update favorites' }));
        console.error('Failed to update favorites:', errorData.error);
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(!newFavoriteState);
      console.error('Error updating favorites:', error);
    }
  };

  return (
    <Link
      to={`/accommodations/${id}`}
      className="group bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] block border border-gray-100"
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden bg-gray-200">
        <img
          src={imageError ? fallbackImage : mainImageUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-md"
          aria-label="Add to favorites"
        >
          <Heart 
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </button>

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
          {type}
        </div>

        {/* Star Rating Badge (if available) */}
        {starRating && (
          <div className="absolute bottom-3 left-3 bg-[#01502E]/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {starRating}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Hotel Name with Star Rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1 flex-1 group-hover:text-[#01502E] transition-colors">
            {name}
          </h3>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">
            {city}, {country}
          </span>
        </div>

        {/* Guest Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`${getRatingColor(rating)} text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1`}
            >
              <Star className="w-3 h-3 fill-white" />
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-700 font-medium">
              {getRatingText(rating)}
            </span>
            <span className="text-xs text-gray-500">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Key Amenities (Icons) */}
        {topAmenities.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {topAmenities.map((amenity, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                {amenity.icon ? (
                  amenity.isEmoji ? (
                    <span className="text-base">{amenity.icon}</span>
                  ) : (
                    <amenity.icon className="w-4 h-4" />
                  )
                ) : (
                  <span className="text-green-600">✓</span>
                )}
                <span className="hidden sm:inline">{amenity.name}</span>
              </div>
            ))}
            {amenities.length > 4 && (
              <span className="text-xs text-gray-500">
                +{amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Room Types Count (for multi-room properties) */}
        {isRoomBased && roomTypeCount !== undefined && roomTypeCount > 0 && (
          <div className="mb-4">
            <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {roomTypeCount} {roomTypeCount === 1 ? 'room type' : 'room types'} available
            </span>
          </div>
        )}

        {/* Property Details (for single-unit) */}
        {!isRoomBased && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{maxGuests} guests</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Price Section - PROMINENT */}
        <div className="border-t border-gray-200 pt-4">
          {isRoomBased && (
            <div className="text-xs text-gray-600 mb-1 font-medium">
              Starting from
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-[#01502E]">
                {formattedPrice}
              </div>
              {nights && nights > 0 ? (
                <div className="text-sm text-gray-600 mt-1">
                  total · {nights} night{nights > 1 ? 's' : ''}
                </div>
              ) : (
                <div className="text-sm text-gray-600 mt-1">
                  /night
                </div>
              )}
              {nights && nights > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {formattedPerNight} /night
                </div>
              )}
            </div>
          </div>

          {/* View Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/accommodations/${id}`;
            }}
            className="w-full mt-4 bg-[#01502E] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-[#013d23] transition-colors text-sm"
          >
            {isRoomBased ? 'View Rooms & Rates' : 'View Details'}
          </button>
        </div>
      </div>
    </Link>
  );
}
