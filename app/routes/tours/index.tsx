import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { TourGrid, TourCardSkeleton } from "~/components/TourCard";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Search, Filter, MapPin, Calendar, Users, Star, Clock } from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface Tour {
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
  location: string;
  createdAt: string;
}

interface LoaderData {
  tours: Tour[];
  total: number;
  filters: {
    categories: string[];
    difficulties: string[];
    priceRange: { min: number; max: number };
    locations: string[];
  };
}

// ========================================
// LOADER
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse filters
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const minPrice = parseInt(searchParams.get("minPrice") || "0");
    const maxPrice = parseInt(searchParams.get("maxPrice") || "1000");
    const location = searchParams.get("location") || "";
    const sortBy = searchParams.get("sortBy") || "featured";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build where clause
    const where: any = {
      isActive: true,
      isApproved: true
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (minPrice || maxPrice) {
      where.pricePerPerson = {};
      if (minPrice) where.pricePerPerson.gte = minPrice;
      if (maxPrice) where.pricePerPerson.lte = maxPrice;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_low') orderBy = { pricePerPerson: 'asc' };
    if (sortBy === 'price_high') orderBy = { pricePerPerson: 'desc' };
    if (sortBy === 'rating') orderBy = { averageRating: 'desc' };
    if (sortBy === 'featured') orderBy = [{ isFeatured: 'desc' }, { averageRating: 'desc' }];

    // Get tours
    const tours = await prisma.tour.findMany({
      where,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            avatar: true,
            averageRating: true,
            totalReviews: true,
            isVerified: true
          }
        },
        images: true,
        reviews: {
          where: { isActive: true },
          select: { rating: true }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count
    const total = await prisma.tour.count({ where });

    // Get filter options
    const categories = await prisma.tour.findMany({
      where: { isActive: true, isApproved: true },
      select: { category: true },
      distinct: ['category']
    });

    const difficulties = await prisma.tour.findMany({
      where: { isActive: true, isApproved: true },
      select: { difficulty: true },
      distinct: ['difficulty']
    });

    const priceStats = await prisma.tour.aggregate({
      where: { isActive: true, isApproved: true },
      _min: { pricePerPerson: true },
      _max: { pricePerPerson: true }
    });

    const locations = await prisma.tour.findMany({
      where: { isActive: true, isApproved: true },
      select: { location: true },
      distinct: ['location']
    });

    // Format tours
    const formattedTours: Tour[] = tours.map(tour => {
      const averageRating = tour.reviews.length > 0 
        ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
        : 0;

      const isNew = new Date(tour.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isPopular = tour.totalBookings > 10;
      const isFeatured = tour.isFeatured || false;

      // Mock availability (would be real data in production)
      const availabilityOptions = ['Available', 'Limited', 'Fully Booked'];
      const availability = availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)] as 'Available' | 'Limited' | 'Fully Booked';

      // Mock weather (would be real data in production)
      const weatherConditions = ['sunny', 'cloudy', 'rainy'];
      const weather = Math.random() > 0.7 ? {
        condition: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
        temperature: Math.floor(Math.random() * 20) + 15,
        icon: '☀️'
      } : undefined;

      return {
        id: tour.id,
        title: tour.title,
        description: tour.description,
        images: tour.images || ['/placeholder-tour.jpg'],
        price: tour.pricePerPerson,
        originalPrice: tour.originalPrice,
        duration: tour.duration,
        difficulty: tour.difficulty as 'Easy' | 'Moderate' | 'Hard',
        category: tour.category as 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Historical' | 'Wildlife',
        groupSize: {
          min: tour.minGroupSize,
          max: tour.maxGroupSize
        },
        languages: tour.languages || ['English'],
        guide: {
          id: tour.guide.id,
          name: tour.guide.name,
          avatar: tour.guide.avatar,
          rating: tour.guide.averageRating || 0,
          reviewCount: tour.guide.totalReviews || 0,
          isVerified: tour.guide.isVerified || false
        },
        rating: averageRating,
        reviewCount: tour.reviews.length,
        isFeatured,
        isPopular,
        isNew,
        availability,
        nextAvailableDate: 'Tomorrow',
        weather,
        location: tour.location,
        createdAt: tour.createdAt.toISOString()
      };
    });

    const loaderData: LoaderData = {
      tours: formattedTours,
      total,
      filters: {
        categories: categories.map(c => c.category),
        difficulties: difficulties.map(d => d.difficulty),
        priceRange: {
          min: priceStats._min.pricePerPerson || 0,
          max: priceStats._max.pricePerPerson || 1000
        },
        locations: locations.map(l => l.location)
      }
    };

    return json(loaderData);
  } catch (error) {
    console.error("Error in tours loader:", error);
    throw new Response("Failed to load tours", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function ToursPage() {
  const { tours, total, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilters = Array.from(searchParams.entries()).filter(([key, value]) => 
    key !== 'page' && key !== 'limit' && value
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Tours
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore the world with local guides and create unforgettable memories
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tours, destinations, or guides..."
                  value={searchParams.get("search") || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={searchParams.get("category") || ""}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {filters.categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={searchParams.get("difficulty") || ""}
                    onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    {filters.difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={searchParams.get("minPrice") || ""}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={searchParams.get("maxPrice") || ""}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={searchParams.get("location") || ""}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {filters.locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilters.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {total} tours found
            </h2>
            {activeFilters.length > 0 && (
              <p className="text-gray-600">
                Filtered by {activeFilters.map(([key, value]) => `${key}: ${value}`).join(', ')}
              </p>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={searchParams.get("sortBy") || "featured"}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
          </div>
        </div>

        {/* Tours Grid */}
        <Card className="p-4">
          {isLoading ? (
            <TourGrid tours={Array(12).fill(null).map((_, i) => ({ id: i.toString() } as any))} columns={3} />
          ) : (
            <TourGrid tours={tours} columns={3} />
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => (window.location.href = '/tours')}>Browse All Tours</Button>
          </div>
        </Card>

        {/* Empty State */}
        {tours.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all tours
            </p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {tours.length > 0 && tours.length < total && (
          <div className="text-center mt-8">
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (parseInt(searchParams.get("page") || "1") + 1).toString());
                setSearchParams(newParams);
              }}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Load More Tours
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
