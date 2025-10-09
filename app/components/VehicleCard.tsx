import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { 
  Star, 
  MapPin, 
  Users, 
  Luggage, 
  Fuel, 
  Settings, 
  Shield, 
  CheckCircle, 
  Clock, 
  Zap, 
  Car, 
  Heart, 
  Share2, 
  Eye, 
  GitCompare,
  Phone,
  Calendar,
  Navigation,
  Camera,
  Wifi,
  Baby,
  Wind,
  Gauge
} from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface VehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    model: string;
    year: number;
    mileage?: number;
    images: string[];
    price: number;
    originalPrice?: number;
    category: 'Economy' | 'SUV' | 'Luxury' | 'Van' | 'Sports' | 'Electric';
    transmission: 'Automatic' | 'Manual';
    fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
    isElectric?: boolean;
    owner: {
      id: string;
      name: string;
      avatar?: string;
      rating: number;
      reviewCount: number;
      isVerified: boolean;
    };
    rating: number;
    reviewCount: number;
    specs: {
      passengers: number;
      luggage: number;
      fuelEfficiency: number; // MPG or km/L
      transmission: string;
    };
    features: string[];
    location: string;
    distance?: number; // Distance from user in km
    availability: 'Available' | 'Limited' | 'Fully Booked';
    isSpecialOffer?: boolean;
    hasDelivery?: boolean;
    deliveryRadius?: number;
    insuranceOptions?: boolean;
    instantBooking?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: (vehicleId: string) => void;
    onCompare?: (vehicleId: string) => void;
  };
  showCompare?: boolean;
  selectedDates?: {
    start: string;
    end: string;
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getCategoryColor = (_category: string) => 'bg-orange-500';
const getCategoryGradient = (_category: string) => 'from-[#01502E] to-orange-500';

const getFuelIcon = (fuelType: string) => {
  const icons = {
    Gasoline: <Fuel className="w-4 h-4" />,
    Diesel: <Fuel className="w-4 h-4" />,
    Electric: <Zap className="w-4 h-4" />,
    Hybrid: <Zap className="w-4 h-4" />
  };
  return icons[fuelType as keyof typeof icons] || <Fuel className="w-4 h-4" />;
};

const getTransmissionIcon = (transmission: string) => {
  return transmission === 'Automatic' ? 
    <Settings className="w-4 h-4" /> : 
    <Gauge className="w-4 h-4" />;
};

// ========================================
// VEHICLE CARD COMPONENT
// ========================================

export default function VehicleCard({ vehicle, showCompare = false, selectedDates }: VehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(vehicle.isFavorite || false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    vehicle.onToggleFavorite?.(vehicle.id);
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInCompare(!isInCompare);
    vehicle.onCompare?.(vehicle.id);
  };

  // Removed image click interception to allow navigation when clicking the image

  const calculatePrice = () => {
    if (selectedDates) {
      const start = new Date(selectedDates.start);
      const end = new Date(selectedDates.end);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return vehicle.price * days;
    }
    return vehicle.price;
  };

  const getAvailabilityColor = (availability: string) => {
    const colors = {
      Available: 'bg-[#01502E]',
      Limited: 'bg-orange-500',
      'Fully Booked': 'bg-orange-700'
    };
    return colors[availability as keyof typeof colors] || 'bg-[#01502E]';
  };

  const visibleFeatures = vehicle.features.slice(0, 3);
  const hiddenFeaturesCount = vehicle.features.length - 3;

  return (
    <div
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden cursor-pointer ${
        isHovered ? 'ring-2 ring-[#01502E]/20' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'perspective(1000px) rotateX(2deg) rotateY(2deg)' : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Link to={`/vehicle/${vehicle.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Main Image */}
          <img
            src={vehicle.images[currentImageIndex] || '/placeholder-vehicle.jpg'}
            alt={`${vehicle.name} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Glass-morphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {/* Category Badge */}
            <span className={`${getCategoryColor(vehicle.category)} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm`}>
              {vehicle.category}
            </span>
            
            {/* Electric Badge */}
            {vehicle.isElectric && (
              <span className="bg-gradient-to-r from-[#01502E] to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                ⚡ Electric
              </span>
            )}
            
            {/* Special Offer Badge */}
            {vehicle.isSpecialOffer && (
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                🔥 Special Offer
              </span>
            )}
          </div>

          {/* Top Right Badges */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            {/* Transmission Type */}
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              {getTransmissionIcon(vehicle.transmission)}
            </div>
            
            {/* Fuel Type */}
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              {getFuelIcon(vehicle.fuelType)}
            </div>
          </div>

          {/* Bottom Right - Availability */}
          <div className="absolute bottom-3 right-3">
            <div className={`${getAvailabilityColor(vehicle.availability)} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm`}>
              {vehicle.availability === 'Available' && '✓ Available'}
              {vehicle.availability === 'Limited' && '⚠ Limited'}
              {vehicle.availability === 'Fully Booked' && '✗ Full'}
            </div>
          </div>

          {/* Image Indicators */}
          {vehicle.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {vehicle.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={handleFavoriteToggle}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'
                }`}
              />
            </button>
            <button className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick View Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors">
              <Eye className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Vehicle Name & Model */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#01502E] transition-colors">
              {vehicle.name} {vehicle.model}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{vehicle.year}</span>
              {vehicle.mileage && (
                <>
                  <span>•</span>
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                </>
              )}
            </div>
          </div>

          {/* Owner Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {vehicle.owner.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{vehicle.owner.name}</span>
              {vehicle.owner.isVerified && (
                <Shield className="w-4 h-4 text-[#01502E]" />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {vehicle.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">({vehicle.reviewCount})</span>
            </div>
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{vehicle.specs.passengers} passengers</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Luggage className="w-4 h-4 text-gray-500" />
              <span>{vehicle.specs.luggage} bags</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Fuel className="w-4 h-4 text-gray-500" />
              <span>{vehicle.specs.fuelEfficiency} MPG</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {getTransmissionIcon(vehicle.specs.transmission)}
              <span>{vehicle.specs.transmission}</span>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {visibleFeatures.map((feature, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
              >
                {feature}
              </span>
            ))}
            {hiddenFeaturesCount > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                +{hiddenFeaturesCount} more
              </span>
            )}
          </div>

          {/* Location & Distance */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{vehicle.location}</span>
            </div>
            {vehicle.distance && (
              <span>{vehicle.distance} km away</span>
            )}
          </div>

          {/* Special Features */}
          <div className="flex items-center space-x-4 text-sm">
            {vehicle.instantBooking && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Instant booking</span>
              </div>
            )}
            {vehicle.hasDelivery && (
            <div className="flex items-center space-x-1 text-[#01502E]">
                <Navigation className="w-4 h-4" />
                <span>Delivery available</span>
              </div>
            )}
            {vehicle.insuranceOptions && (
            <div className="flex items-center space-x-1 text-orange-600">
                <Shield className="w-4 h-4" />
                <span>Insurance options</span>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  ${calculatePrice()}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedDates ? 'total' : 'per day'}
                </span>
              </div>
              {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 line-through">
                    ${vehicle.originalPrice}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    Save ${vehicle.originalPrice - vehicle.price}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showCompare && (
                <button
                  onClick={handleCompareToggle}
                  className={`p-2 rounded-full transition-colors ${
                    isInCompare 
                      ? 'bg-[#01502E]/10 text-[#01502E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                </button>
              )}
              <button className="bg-[#01502E] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#013d23] transition-all duration-200 transform hover:scale-105 shadow-lg">
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        {isHovered && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#01502E]/10 to-orange-500/10 pointer-events-none" />
        )}
      </Link>
    </div>
  );
}

// ========================================
// VEHICLE GRID COMPONENT
// ========================================

interface VehicleGridProps {
  vehicles: VehicleCardProps['vehicle'][];
  columns?: 1 | 2 | 3 | 4;
  showCompare?: boolean;
  selectedDates?: {
    start: string;
    end: string;
  };
}

export function VehicleGrid({ vehicles, columns = 3, showCompare = false, selectedDates }: VehicleGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {vehicles.map((vehicle) => (
        <VehicleCard 
          key={vehicle.id} 
          vehicle={vehicle} 
          showCompare={showCompare}
          selectedDates={selectedDates}
        />
      ))}
    </div>
  );
}

// ========================================
// VEHICLE CARD SKELETON (Loading State)
// ========================================

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <Car className="w-16 h-16 text-gray-400" />
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
        
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full" />
          <div className="h-4 bg-gray-300 rounded w-20" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded" />
        </div>
        
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-300 rounded-full w-16" />
          <div className="h-6 bg-gray-300 rounded-full w-20" />
          <div className="h-6 bg-gray-300 rounded-full w-14" />
        </div>
        
        <div className="flex justify-between items-center pt-4">
          <div className="h-8 bg-gray-300 rounded w-20" />
          <div className="h-10 bg-gray-300 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

// ========================================
// VEHICLE COMPARISON COMPONENT
// ========================================

interface VehicleComparisonProps {
  vehicles: VehicleCardProps['vehicle'][];
  onRemove: (vehicleId: string) => void;
  onClear: () => void;
}

export function VehicleComparison({ vehicles, onRemove, onClear }: VehicleComparisonProps) {
  if (vehicles.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-50">
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium text-gray-700">
          Comparing {vehicles.length} vehicles
        </div>
        <div className="flex space-x-2">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <img
                src={vehicle.images[0] || '/placeholder-vehicle.jpg'}
                alt={vehicle.name}
                className="w-8 h-8 rounded object-cover"
              />
              <span className="text-sm font-medium">{vehicle.name}</span>
              <button
                onClick={() => onRemove(vehicle.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onClear}
          className="text-[#01502E] hover:text-orange-600 font-medium"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
