import React, { useState } from "react";
import { Link } from "@remix-run/react";
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Heart, 
  Share2, 
  Eye,
  Car,
  Home,
  Plane,
  Package,
  Zap,
  Fuel,
  Settings,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface SearchResult {
  id: string;
  type: 'property' | 'vehicle' | 'tour';
  title: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  location: string;
  distance?: number;
  category: string;
  features: string[];
  isAvailable: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  // Property specific
  propertyType?: string;
  amenities?: string[];
  maxGuests?: number;
  // Vehicle specific
  vehicleModel?: string;
  year?: number;
  transmission?: string;
  fuelType?: string;
  passengerCapacity?: number;
  // Tour specific
  duration?: string;
  difficulty?: string;
  languages?: string[];
  maxGroupSize?: number;
  guide?: {
    name: string;
    rating: number;
    isVerified: boolean;
  };
}

interface SearchResultsProps {
  results: SearchResult[];
  serviceType: 'accommodations' | 'vehicles' | 'tours' | 'packages';
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
  onToggleFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onQuickView?: (id: string) => void;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getServiceIcon = (type: string) => {
  const icons = {
    accommodations: Home,
    vehicles: Car,
    tours: Plane,
    packages: Package
  };
  return icons[type as keyof typeof icons] || Home;
};

const getCategoryColor = (_category: string) => 'bg-orange-500';

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    Easy: 'text-[#01502E]',
    Moderate: 'text-orange-600',
    Hard: 'text-orange-700'
  };
  return colors[difficulty as keyof typeof colors] || 'text-[#01502E]';
};

// ========================================
// SEARCH RESULTS COMPONENT
// ========================================

export default function SearchResults({ 
  results, 
  serviceType, 
  viewMode, 
  isLoading = false,
  onToggleFavorite,
  onShare,
  onQuickView
}: SearchResultsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
    onToggleFavorite?.(id);
  };

  const handleShare = (id: string) => {
    onShare?.(id);
  };

  const handleQuickView = (id: string) => {
    onQuickView?.(id);
  };

  if (isLoading) {
    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="h-48 bg-gray-300 rounded mb-4" />
            <div className="h-4 bg-gray-300 rounded mb-2" />
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4" />
            <div className="h-6 bg-gray-300 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {React.createElement(getServiceIcon(serviceType), { className: "w-12 h-12 text-gray-400" })}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your search criteria or browse all {serviceType}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1'
    }`}>
      {results.map((result) => (
        <SearchResultCard
          key={result.id}
          result={result}
          serviceType={serviceType}
          viewMode={viewMode}
          isFavorite={favorites.has(result.id)}
          onToggleFavorite={handleFavoriteToggle}
          onShare={handleShare}
          onQuickView={handleQuickView}
        />
      ))}
    </div>
  );
}

// ========================================
// SEARCH RESULT CARD COMPONENT
// ========================================

interface SearchResultCardProps {
  result: SearchResult;
  serviceType: string;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onShare: (id: string) => void;
  onQuickView: (id: string) => void;
}

function SearchResultCard({ 
  result, 
  serviceType, 
  viewMode, 
  isFavorite,
  onToggleFavorite,
  onShare,
  onQuickView
}: SearchResultCardProps) {
  const getResultUrl = () => {
    switch (serviceType) {
      case 'accommodations':
        return `/property/${result.id}`;
      case 'vehicles':
        return `/vehicles/${result.id}`;
      case 'tours':
        return `/tours/${result.id}`;
      default:
        return `/${serviceType}/${result.id}`;
    }
  };

  const getPriceLabel = () => {
    switch (serviceType) {
      case 'accommodations':
        return 'per night';
      case 'vehicles':
        return 'per day';
      case 'tours':
        return 'per person';
      default:
        return 'per item';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <Link to={getResultUrl().replace('/tours/', '/tour/').replace('/vehicles/', '/vehicle/')} className="block">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Image */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <img
                  src={result.images[0] || '/placeholder.jpg'}
                  alt={result.title}
                  className="w-full h-full rounded-lg object-cover"
                />
                {result.isFeatured && (
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </span>
                )}
                {result.isNew && (
                  <span className="absolute top-2 right-2 bg-[#01502E] text-white text-xs font-bold px-2 py-1 rounded">
                    New
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {result.description}
                    </p>
                    
                    {/* Service-specific info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{result.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                        <span>{result.rating.toFixed(1)}</span>
                        <span>({result.reviewCount})</span>
                      </div>
                      {result.distance && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{result.distance} km away</span>
                        </div>
                      )}
                    </div>

                    {/* Service-specific details */}
                    {serviceType === 'accommodations' && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {result.maxGuests && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{result.maxGuests} guests</span>
                          </div>
                        )}
                        {result.propertyType && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {result.propertyType}
                          </span>
                        )}
                      </div>
                    )}

                    {serviceType === 'vehicles' && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {result.passengerCapacity && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{result.passengerCapacity} passengers</span>
                          </div>
                        )}
                        {result.transmission && (
                          <div className="flex items-center space-x-1">
                            <Settings className="w-4 h-4" />
                            <span>{result.transmission}</span>
                          </div>
                        )}
                        {result.fuelType && (
                          <div className="flex items-center space-x-1">
                            <Fuel className="w-4 h-4" />
                            <span>{result.fuelType}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {serviceType === 'tours' && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {result.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{result.duration}</span>
                          </div>
                        )}
                        {result.difficulty && (
                          <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(result.difficulty)}`}>
                            {result.difficulty}
                          </span>
                        )}
                        {result.guide && (
                          <div className="flex items-center space-x-1">
                            <span>{result.guide.name}</span>
                            {result.guide.isVerified && (
                              <Shield className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${result.price}
                      </div>
                      {result.originalPrice && result.originalPrice > result.price && (
                        <div className="text-sm text-gray-500 line-through">
                          ${result.originalPrice}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {getPriceLabel()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite(result.id);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onShare(result.id);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onQuickView(result.id);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group relative bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
      <Link to={getResultUrl().replace('/tours/', '/tour/').replace('/vehicles/', '/vehicle/')} className="block">
        {/* Image */}
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={result.images[0] || '/placeholder.jpg'}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {result.isFeatured && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                Featured
              </span>
            )}
            {result.isNew && (
              <span className="bg-[#01502E] text-white text-xs font-bold px-2 py-1 rounded">
                New
              </span>
            )}
            {result.isPopular && (
              <span className="bg-orange-700 text-white text-xs font-bold px-2 py-1 rounded">
                Popular
              </span>
            )}
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <span className={`${getCategoryColor(result.category)} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
              {result.category}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(result.id);
              }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare(result.id);
              }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick View Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(result.id);
              }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
            >
              <Eye className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-[#01502E] transition-colors">
            {result.title}
          </h3>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{result.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>{result.rating.toFixed(1)}</span>
            </div>
            {result.distance && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{result.distance} km</span>
              </div>
            )}
          </div>

          {/* Service-specific info */}
          {serviceType === 'accommodations' && result.maxGuests && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{result.maxGuests} guests</span>
            </div>
          )}

          {serviceType === 'vehicles' && result.passengerCapacity && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{result.passengerCapacity} passengers</span>
            </div>
          )}

          {serviceType === 'tours' && result.duration && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{result.duration}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">
                  ${result.price}
                </span>
                {result.originalPrice && result.originalPrice > result.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${result.originalPrice}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{getPriceLabel()}</span>
            </div>
            
            <button className="bg-[#01502E] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#013d23] transition-colors">
              View Details
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
import React from 'react';
