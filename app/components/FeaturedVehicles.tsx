import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, MapPin, Users, Luggage, Fuel, Settings, Shield, CheckCircle, Navigation, Zap, Car, Heart, Share2, Eye } from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface FeaturedVehicle {
  id: string;
  name: string;
  model: string;
  year: number;
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
    fuelEfficiency: number;
    transmission: string;
  };
  features: string[];
  location: string;
  distance?: number;
  availability: 'Available' | 'Limited' | 'Fully Booked';
  isSpecialOffer?: boolean;
  hasDelivery?: boolean;
  deliveryRadius?: number;
  insuranceOptions?: boolean;
  instantBooking?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (vehicleId: string) => void;
  onCompare?: (vehicleId: string) => void;
}

interface FeaturedVehiclesProps {
  vehicles: FeaturedVehicle[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  autoSlide?: boolean;
  slideInterval?: number;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getCategoryColor = (category: string) => {
  const colors = {
    Economy: 'bg-gray-500',
    SUV: 'bg-blue-500',
    Luxury: 'bg-purple-500',
    Van: 'bg-orange-500',
    Sports: 'bg-red-500',
    Electric: 'bg-green-500'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-500';
};

const getCategoryGradient = (category: string) => {
  const gradients = {
    Economy: 'from-gray-500 to-gray-600',
    SUV: 'from-blue-500 to-blue-600',
    Luxury: 'from-purple-500 to-purple-600',
    Van: 'from-orange-500 to-orange-600',
    Sports: 'from-red-500 to-red-600',
    Electric: 'from-green-500 to-green-600'
  };
  return gradients[category as keyof typeof gradients] || 'from-gray-500 to-gray-600';
};

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
    <Settings className="w-4 h-4" />;
};

// ========================================
// FEATURED VEHICLES COMPONENT
// ========================================

export default function FeaturedVehicles({ 
  vehicles, 
  title = "Featured Vehicles",
  subtitle = "Discover our premium selection of vehicles for your next adventure",
  showViewAll = true,
  autoSlide = true,
  slideInterval = 5000
}: FeaturedVehiclesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Auto-slide functionality
  useEffect(() => {
    if (autoSlide && !isHovered && vehicles.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % vehicles.length);
      }, slideInterval);
      return () => clearInterval(interval);
    }
  }, [autoSlide, isHovered, vehicles.length, slideInterval]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % vehicles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + vehicles.length) % vehicles.length);
  };

  const handleFavoriteToggle = (vehicleId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(vehicleId)) {
        newFavorites.delete(vehicleId);
      } else {
        newFavorites.add(vehicleId);
      }
      return newFavorites;
    });
  };

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
          {showViewAll && (
            <Link
              to="/vehicles"
              className="inline-flex items-center mt-6 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View all vehicles
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Vehicles Carousel */}
        <div className="relative">
          {/* Main Carousel */}
          <div
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex transition-transform duration-500 ease-in-out"
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {vehicles.map((vehicle, index) => (
                <div key={vehicle.id} className="w-full flex-shrink-0">
                  <div className="relative h-96 lg:h-[500px] overflow-hidden">
                    {/* Background Image */}
                    <img
                      src={vehicle.images[0] || '/placeholder-vehicle.jpg'}
                      alt={`${vehicle.name} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex items-end">
                      <div className="w-full p-8 lg:p-12">
                        <div className="max-w-4xl">
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {vehicle.isSpecialOffer && (
                              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                🔥 Special Offer
                              </span>
                            )}
                            {vehicle.isElectric && (
                              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                ⚡ Electric
                              </span>
                            )}
                            <span className={`${getCategoryColor(vehicle.category)} text-white text-sm font-semibold px-3 py-1 rounded-full`}>
                              {vehicle.category}
                            </span>
                          </div>

                          {/* Vehicle Title */}
                          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                            {vehicle.name} {vehicle.model}
                          </h3>

                          {/* Vehicle Info */}
                          <div className="flex flex-wrap items-center gap-4 mb-6 text-white">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-5 h-5" />
                              <span>{vehicle.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-5 h-5" />
                              <span>{vehicle.specs.passengers} passengers</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Luggage className="w-5 h-5" />
                              <span>{vehicle.specs.luggage} bags</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              <span>{vehicle.rating.toFixed(1)} ({vehicle.reviewCount})</span>
                            </div>
                          </div>

                          {/* Owner Info */}
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {vehicle.owner.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium">{vehicle.owner.name}</span>
                                  {vehicle.owner.isVerified && (
                                    <Shield className="w-4 h-4 text-blue-400" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  <span className="text-sm text-white/80">
                                    {vehicle.owner.rating.toFixed(1)} ({vehicle.owner.reviewCount} reviews)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Special Features */}
                          <div className="flex items-center space-x-4 mb-6 text-sm">
                            {vehicle.instantBooking && (
                              <div className="flex items-center space-x-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span>Instant booking</span>
                              </div>
                            )}
                            {vehicle.hasDelivery && (
                              <div className="flex items-center space-x-1 text-blue-400">
                                <Navigation className="w-4 h-4" />
                                <span>Delivery available</span>
                              </div>
                            )}
                            {vehicle.insuranceOptions && (
                              <div className="flex items-center space-x-1 text-purple-400">
                                <Shield className="w-4 h-4" />
                                <span>Insurance options</span>
                              </div>
                            )}
                          </div>

                          {/* Bottom Section */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-3xl font-bold text-white">
                                  ${vehicle.price}
                                </span>
                                {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
                                  <span className="text-lg text-white/70 line-through">
                                    ${vehicle.originalPrice}
                                  </span>
                                )}
                                <span className="text-sm text-white/70">per day</span>
                              </div>
                              <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                ✓ Available
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleFavoriteToggle(vehicle.id)}
                                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                              >
                                <Heart
                                  className={`w-5 h-5 transition-colors ${
                                    favorites.has(vehicle.id) ? 'text-red-500 fill-red-500' : 'text-white'
                                  }`}
                                />
                              </button>
                              <Link
                                to={`/vehicles/${vehicle.id}`}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {vehicles.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Slide Indicators */}
          {vehicles.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {vehicles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Cards Grid (Alternative Layout) */}
        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.slice(0, 6).map((vehicle) => (
              <div
                key={vehicle.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer"
              >
                <Link to={`/vehicles/${vehicle.id}`} className="block">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={vehicle.images[0] || '/placeholder-vehicle.jpg'}
                      alt={`${vehicle.name} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2">
                      {vehicle.isSpecialOffer && (
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          🔥 Special
                        </span>
                      )}
                      {vehicle.isElectric && (
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ⚡ Electric
                        </span>
                      )}
                      <span className={`${getCategoryColor(vehicle.category)} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                        {vehicle.category}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFavoriteToggle(vehicle.id);
                      }}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          favorites.has(vehicle.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{vehicle.specs.passengers}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getFuelIcon(vehicle.fuelType)}
                        <span className="text-sm font-medium text-gray-700">{vehicle.fuelType}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {vehicle.name} {vehicle.model}
                    </h3>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {vehicle.owner.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{vehicle.owner.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {vehicle.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-gray-900">
                          ${vehicle.price}
                        </span>
                        <span className="text-xs text-gray-500">per day</span>
                      </div>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                        Book Now
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
