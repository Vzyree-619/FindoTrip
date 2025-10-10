import React, { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { ChevronLeft, ChevronRight, Star, MapPin, Clock, Users, Heart } from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface FeaturedTour {
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
  location: string;
  isFavorite?: boolean;
  onToggleFavorite?: (tourId: string) => void;
}

interface FeaturedToursProps {
  tours: FeaturedTour[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  autoSlide?: boolean;
  slideInterval?: number;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getCategoryColor = (_category: string) => 'bg-orange-500';

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    Easy: 'text-[#01502E]',
    Moderate: 'text-orange-600',
    Hard: 'text-orange-700'
  };
  return colors[difficulty as keyof typeof colors] || 'text-[#01502E]';
};

const getAvailabilityColor = (availability: string) => {
  const colors = {
    Available: 'bg-[#01502E]',
    Limited: 'bg-orange-500',
    'Fully Booked': 'bg-orange-700'
  };
  return colors[availability as keyof typeof colors] || 'bg-[#01502E]';
};

// ========================================
// FEATURED TOURS COMPONENT
// ========================================

export default function FeaturedTours({ 
  tours, 
  title = "Featured Tours",
  subtitle = "Discover the most popular and highly-rated experiences",
  showViewAll = true,
  autoSlide = true,
  slideInterval = 5000
}: FeaturedToursProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Auto-slide functionality
  useEffect(() => {
    if (autoSlide && !isHovered && tours.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % tours.length);
      }, slideInterval);
      return () => clearInterval(interval);
    }
  }, [autoSlide, isHovered, tours.length, slideInterval]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % tours.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + tours.length) % tours.length);
  };

  const handleFavoriteToggle = (tourId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(tourId)) {
        newFavorites.delete(tourId);
      } else {
        newFavorites.add(tourId);
      }
      return newFavorites;
    });
  };

  if (tours.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-[#01502E]/5 via-white to-orange-50">
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
              to="/tours"
              className="inline-flex items-center mt-6 text-[#01502E] hover:text-orange-600 font-medium transition-colors"
            >
              View all tours
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Tours Carousel */}
        <div className="relative">
          {/* Main Carousel */}
          <div
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex transition-transform duration-500 ease-in-out"
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {tours.map((tour, index) => (
                <div key={tour.id} className="w-full flex-shrink-0">
                  <div className="relative h-96 lg:h-[500px] overflow-hidden">
                    {/* Background Image */}
                    <img
                      src={tour.images[0] || '/placeholder-tour.jpg'}
                      alt={tour.title}
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
                            {tour.isFeatured && (
                              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                ⭐ Featured
                              </span>
                            )}
                            {tour.isPopular && (
                              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                🔥 Popular
                              </span>
                            )}
                            {tour.isNew && (
                              <span className="bg-gradient-to-r from-[#01502E] to-green-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                ✨ New
                              </span>
                            )}
                            <span className={`${getCategoryColor(tour.category)} text-white text-sm font-semibold px-3 py-1 rounded-full`}>
                              {tour.category}
                            </span>
                          </div>

                          {/* Tour Title */}
                          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                            {tour.title}
                          </h3>

                          {/* Tour Info */}
                          <div className="flex flex-wrap items-center gap-4 mb-6 text-white">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{tour.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{tour.duration}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">{tour.groupSize.min}-{tour.groupSize.max} people</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm">{tour.rating.toFixed(1)} ({tour.reviewCount})</span>
                            </div>
                          </div>

                          {/* Guide Info */}
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {tour.guide.name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-white font-medium">{tour.guide.name}</span>
                              {tour.guide.isVerified && (
                                <span className="text-[#01502E]">✓</span>
                              )}
                            </div>
                          </div>

                          {/* Bottom Section */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-3xl font-bold text-white">
                                  PKR {tour.price.toLocaleString()}
                                </span>
                                {tour.originalPrice && tour.originalPrice > tour.price && (
                                  <span className="text-lg text-white/70 line-through">
                                    PKR {tour.originalPrice.toLocaleString()}
                                  </span>
                                )}
                                <span className="text-sm text-white/70">per person</span>
                              </div>
                              <div className={`${getAvailabilityColor(tour.availability)} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                                {tour.availability === 'Available' && '✓ Available'}
                                {tour.availability === 'Limited' && '⚠ Limited'}
                                {tour.availability === 'Fully Booked' && '✗ Full'}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFavoriteToggle(tour.id);
                                }}
                                className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                              >
                                <Heart
                                  className={`w-5 h-5 transition-colors ${
                                    favorites.has(tour.id) ? 'text-red-500 fill-red-500' : 'text-white'
                                  }`}
                                />
                              </button>
                              <Link
                                to={`/tour/${tour.id}`}
                                className="bg-[#01502E] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#013d23] transition-all duration-200 transform hover:scale-105 shadow-lg"
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
          {tours.length > 1 && (
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
          {tours.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {tours.map((_, index) => (
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

        {/* Tour Cards Grid (Alternative Layout) */}
        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.slice(0, 6).map((tour) => (
              <div
                key={tour.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer"
              >
                <Link to={`/tours/${tour.id}`} className="block">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={tour.images[0] || '/placeholder-tour.jpg'}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2">
                      {tour.isFeatured && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                      <span className={`${getCategoryColor(tour.category)} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                        {tour.category}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFavoriteToggle(tour.id);
                      }}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          favorites.has(tour.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{tour.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`text-sm font-medium ${getDifficultyColor(tour.difficulty)}`}>
                          {tour.difficulty}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-[#01502E] transition-colors">
                      {tour.title}
                    </h3>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {tour.guide.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{tour.guide.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {tour.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-gray-900">
                          PKR {tour.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">per person</span>
                      </div>
                      <button className="bg-[#01502E] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#013d23] transition-all duration-200 transform hover:scale-105">
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
import React from 'react';
