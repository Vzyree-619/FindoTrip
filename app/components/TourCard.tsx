import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { Heart, Star, Users, Clock, MapPin, Globe, Calendar, Zap, Shield } from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface TourCardProps {
  tour: {
    id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    originalPrice?: number;
    duration: string;
    difficulty: 'Easy' | 'Moderate' | 'Hard';
    category: 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Historical' | 'Wildlife';
    groupSize: {
      min: number;
      max: number;
    };
    languages: string[];
    guide: {
      id: string;
      name: string;
      avatar?: string;
      rating: number;
      reviewCount: number;
      isVerified: boolean;
    };
    rating: number;
    reviewCount: number;
    isFeatured?: boolean;
    isPopular?: boolean;
    isNew?: boolean;
    availability: 'Available' | 'Limited' | 'Fully Booked';
    nextAvailableDate?: string;
    weather?: {
      condition: string;
      temperature: number;
      icon: string;
    };
    isFavorite?: boolean;
    onToggleFavorite?: (tourId: string) => void;
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getCategoryColor = (category: string) => {
  const colors = {
    Adventure: 'bg-orange-500',
    Cultural: 'bg-purple-500',
    Food: 'bg-red-500',
    Nature: 'bg-green-500',
    Historical: 'bg-amber-500',
    Wildlife: 'bg-teal-500'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-500';
};

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    Easy: 'text-green-600',
    Moderate: 'text-yellow-600',
    Hard: 'text-red-600'
  };
  return colors[difficulty as keyof typeof colors] || 'text-gray-600';
};

const getAvailabilityColor = (availability: string) => {
  const colors = {
    Available: 'bg-green-500',
    Limited: 'bg-yellow-500',
    'Fully Booked': 'bg-red-500'
  };
  return colors[availability as keyof typeof colors] || 'bg-gray-500';
};

const getWeatherIcon = (condition: string) => {
  const icons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    stormy: '⛈️'
  };
  return icons[condition as keyof typeof icons] || '☀️';
};

// ========================================
// TOUR CARD COMPONENT
// ========================================

export default function TourCard({ tour }: TourCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(tour.isFavorite || false);

  // Auto-slide images
  useEffect(() => {
    if (!isImageHovered && tour.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % tour.images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isImageHovered, tour.images.length]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    tour.onToggleFavorite?.(tour.id);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % tour.images.length);
  };

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/tours/${tour.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          {/* Image Carousel */}
          <div
            className="relative w-full h-full"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
            onClick={handleImageClick}
          >
            {tour.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${tour.title} - Image ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Image Indicators */}
            {tour.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {tour.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {/* Featured Badge */}
            {tour.isFeatured && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                ⭐ Featured
              </span>
            )}
            
            {/* Category Badge */}
            <span className={`${getCategoryColor(tour.category)} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg`}>
              {tour.category}
            </span>
          </div>

          {/* Top Right Badges */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            {/* Popular Badge */}
            {tour.isPopular && (
              <span className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                🔥 Popular
              </span>
            )}
            
            {/* New Badge */}
            {tour.isNew && (
              <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                ✨ New
              </span>
            )}
          </div>

          {/* Bottom Right - Availability */}
          <div className="absolute bottom-3 right-3">
            <div className={`${getAvailabilityColor(tour.availability)} text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg`}>
              {tour.availability === 'Available' && '✓ Available'}
              {tour.availability === 'Limited' && '⚠ Limited'}
              {tour.availability === 'Fully Booked' && '✗ Full'}
            </div>
          </div>

          {/* Weather Icon (if today) */}
          {tour.weather && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <span className="text-lg">{getWeatherIcon(tour.weather.condition)}</span>
              <span className="text-xs font-semibold ml-1">{tour.weather.temperature}°</span>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors duration-200"
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${
                isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Top Section - Duration & Difficulty */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{tour.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className={`w-4 h-4 ${getDifficultyColor(tour.difficulty)}`} />
              <span className={`text-sm font-medium ${getDifficultyColor(tour.difficulty)}`}>
                {tour.difficulty}
              </span>
            </div>
          </div>

          {/* Tour Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {tour.title}
          </h3>

          {/* Guide Info */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {tour.guide.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{tour.guide.name}</span>
              {tour.guide.isVerified && (
                <Shield className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {tour.guide.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">({tour.guide.reviewCount})</span>
            </div>
          </div>

          {/* Quick Info Row */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{tour.groupSize.min}-{tour.groupSize.max}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>{tour.languages.length} lang{tour.languages.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{tour.nextAvailableDate || 'Check dates'}</span>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">
                  ${tour.price}
                </span>
                {tour.originalPrice && tour.originalPrice > tour.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${tour.originalPrice}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">per person</span>
            </div>
            
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
              Book Now
            </button>
          </div>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        )}
      </Link>
    </div>
  );
}

// ========================================
// TOUR GRID COMPONENT
// ========================================

interface TourGridProps {
  tours: TourCardProps['tour'][];
  columns?: 1 | 2 | 3 | 4;
}

export function TourGrid({ tours, columns = 3 }: TourGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {tours.map((tour) => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
}

// ========================================
// TOUR CARD SKELETON (Loading State)
// ========================================

export function TourCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-64 bg-gray-300" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-300 rounded w-16" />
          <div className="h-4 bg-gray-300 rounded w-12" />
        </div>
        
        <div className="h-6 bg-gray-300 rounded w-3/4" />
        <div className="h-6 bg-gray-300 rounded w-1/2" />
        
        <div className="flex justify-between">
          <div className="h-4 bg-gray-300 rounded w-20" />
          <div className="h-4 bg-gray-300 rounded w-16" />
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-300 rounded w-16" />
          <div className="h-8 bg-gray-300 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
