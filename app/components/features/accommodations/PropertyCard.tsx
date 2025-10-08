import { Link } from "@remix-run/react";
import { MapPin, Users, Bed, Bath, Star } from "lucide-react";

interface PropertyCardProps {
  id: string;
  name: string;
  city: string;
  country: string;
  type: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  rating: number;
  reviewCount: number;
  amenities?: string[];
}

export default function PropertyCard({
  id,
  name,
  city,
  country,
  type,
  pricePerNight,
  maxGuests,
  bedrooms,
  bathrooms,
  images,
  rating,
  reviewCount,
  amenities = [],
}: PropertyCardProps) {
  const mainImage = images[0] || "/placeholder-hotel.jpg";
  
  // Format price
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(pricePerNight);

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "bg-green-600";
    if (rating >= 8) return "bg-green-500";
    if (rating >= 7) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Link
      to={`/accommodations/${id}`}
      className="bg-white shadow-md rounded-lg overflow-hidden transition transform hover:scale-105 hover:shadow-xl block"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-semibold text-gray-700">
          {type}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Location */}
        <h3 className="text-[#01502E] font-semibold text-lg mb-1 line-clamp-1">
          {name}
        </h3>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin size={14} className="mr-1" />
          <span className="line-clamp-1">
            {city}, {country}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Users size={14} className="mr-1" />
            <span>{maxGuests}</span>
          </div>
          <div className="flex items-center">
            <Bed size={14} className="mr-1" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Bath size={14} className="mr-1" />
            <span>{bathrooms}</span>
          </div>
        </div>

        {/* Amenities Preview */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and Rating */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-[#01502E]">
              {formattedPrice}
            </span>
            <span className="text-sm text-gray-600"> /night</span>
          </div>
          
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <span
                className={`${getRatingColor(
                  rating
                )} text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1`}
              >
                <Star size={12} fill="white" />
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-600">
                ({reviewCount})
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
