import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { VehicleGrid, VehicleCardSkeleton, VehicleComparison } from "~/components/VehicleCard";
import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Search, Filter, MapPin, Calendar, Users, Star, Car, Zap, Fuel } from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface Vehicle {
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

interface LoaderData {
  vehicles: Vehicle[];
  total: number;
  filters: {
    categories: string[];
    fuelTypes: string[];
    transmissions: string[];
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
    const fuelType = searchParams.get("fuelType") || "";
    const transmission = searchParams.get("transmission") || "";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minPrice = minPriceParam ? parseInt(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseInt(maxPriceParam) : undefined;
    const location = searchParams.get("location") || "";
    const sortBy = searchParams.get("sortBy") || "featured";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build where clause (aligned with current schema)
    const where: any = {
      available: true,
      approvalStatus: 'APPROVED'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (fuelType) {
      where.fuelType = fuelType;
    }

    if (transmission) {
      where.transmission = transmission;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_low') orderBy = { basePrice: 'asc' };
    if (sortBy === 'price_high') orderBy = { basePrice: 'desc' };
    if (sortBy === 'rating') orderBy = { rating: 'desc' };
    // No explicit featured flag in schema; prioritize bookings and rating
    if (sortBy === 'featured') orderBy = [{ totalBookings: 'desc' }, { rating: 'desc' }];

    // Try to get vehicles from database; fallback to mock data if DB unavailable
    let vehicles, total, categories, fuelTypes, transmissions, priceStats, locations;
    try {
      // Get vehicles
      vehicles = await prisma.vehicle.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              averageRating: true,
              totalReviews: true,
              verified: true
            }
          },
          reviews: {
            select: { rating: true }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      });

      // Get total count
      total = await prisma.vehicle.count({ where });

      // Get filter options
      categories = await prisma.vehicle.findMany({
        where: { available: true, approvalStatus: 'APPROVED' },
        select: { category: true },
        distinct: ['category']
      });

      fuelTypes = await prisma.vehicle.findMany({
        where: { available: true, approvalStatus: 'APPROVED' },
        select: { fuelType: true },
        distinct: ['fuelType']
      });

      transmissions = await prisma.vehicle.findMany({
        where: { available: true, approvalStatus: 'APPROVED' },
        select: { transmission: true },
        distinct: ['transmission']
      });

      priceStats = await prisma.vehicle.aggregate({
        where: { available: true, approvalStatus: 'APPROVED' },
        _min: { basePrice: true },
        _max: { basePrice: true }
      });

      locations = await prisma.vehicle.findMany({
        where: { available: true, approvalStatus: 'APPROVED' },
        select: { location: true },
        distinct: ['location']
      });
    } catch (dbError) {
      console.warn('Database connection failed for vehicles. Using fallback data:', dbError);
      // Fallback mock data
      vehicles = [
        {
          id: 'v1',
          name: 'Toyota Corolla',
          model: 'Corolla',
          year: 2020,
          mileage: 25000,
          images: ['/car.jpg', '/placeholder-vehicle.jpg'],
          basePrice: 8000,
          originalPrice: 9500,
          category: 'Economy',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          passengerCapacity: 5,
          luggageCapacity: 3,
          fuelEfficiency: 14,
          location: 'Skardu, Pakistan',
          createdAt: new Date(),
          totalBookings: 22,
          isFeatured: true,
          owner: {
            id: 'owner-1',
            name: 'Ali Raza',
            avatar: null,
            averageRating: 4.7,
            totalReviews: 34,
            isVerified: true
          },
          reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }]
        },
        {
          id: 'v2',
          name: 'Toyota Land Cruiser Prado',
          model: 'Prado',
          year: 2019,
          mileage: 40000,
          images: ['/prado.png', '/placeholder-vehicle.jpg'],
          basePrice: 18000,
          originalPrice: 20000,
          category: 'SUV',
          transmission: 'Automatic',
          fuelType: 'Diesel',
          passengerCapacity: 7,
          luggageCapacity: 5,
          fuelEfficiency: 9,
          location: 'Hunza, Pakistan',
          createdAt: new Date(),
          totalBookings: 41,
          isFeatured: false,
          owner: {
            id: 'owner-2',
            name: 'Sara Khan',
            avatar: null,
            averageRating: 4.6,
            totalReviews: 28,
            isVerified: true
          },
          reviews: [{ rating: 4 }, { rating: 5 }, { rating: 4 }]
        }
      ];

      total = vehicles.length;
      categories = [{ category: 'Economy' }, { category: 'SUV' }, { category: 'Luxury' }];
      fuelTypes = [{ fuelType: 'Gasoline' }, { fuelType: 'Diesel' }, { fuelType: 'Electric' }];
      transmissions = [{ transmission: 'Automatic' }, { transmission: 'Manual' }];
      priceStats = { _min: { basePrice: 6000 }, _max: { basePrice: 25000 } } as any;
      locations = [{ location: 'Skardu, Pakistan' }, { location: 'Hunza, Pakistan' }];
    }

    // Format vehicles
    const formattedVehicles: Vehicle[] = vehicles.map(vehicle => {
      // Prefer stored rating; fallback to computed from reviews
      const storedRating = (vehicle as any).rating ?? 0;
      const reviewsArray = (vehicle as any).reviews || [];
      const computedRating = reviewsArray.length > 0
        ? reviewsArray.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewsArray.length
        : 0;
      const averageRating = storedRating || computedRating;

      const isNew = new Date((vehicle as any).createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isPopular = ((vehicle as any).totalBookings || 0) > 10;

      // Availability based on actual flag
      const availability = ((vehicle as any).available ? 'Available' : 'Fully Booked') as 'Available' | 'Limited' | 'Fully Booked';

      // Basic features fallback (until features UI is finalized)
      const features = Array.isArray((vehicle as any).features) && (vehicle as any).features.length
        ? (vehicle as any).features
        : [
            'GPS Navigation', 'Bluetooth', 'Backup Camera', 'Child Seat Available',
            'Air Conditioning', 'USB Charging'
          ];

      return {
        id: (vehicle as any).id,
        name: (vehicle as any).name,
        model: (vehicle as any).model,
        year: (vehicle as any).year,
        mileage: (vehicle as any).mileage,
        images: (vehicle as any).images || ['/placeholder-vehicle.jpg'],
        price: (vehicle as any).basePrice,
        originalPrice: (vehicle as any).originalPrice,
        category: (vehicle as any).category as 'Economy' | 'SUV' | 'Luxury' | 'Van' | 'Sports' | 'Electric',
        transmission: (vehicle as any).transmission as 'Automatic' | 'Manual',
        fuelType: (vehicle as any).fuelType as 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid',
        isElectric: (vehicle as any).fuelType === 'Electric',
        owner: {
          id: (vehicle as any).owner.id,
          name: (vehicle as any).owner.name,
          avatar: null,
          rating: (vehicle as any).owner.averageRating || 0,
          reviewCount: (vehicle as any).owner.totalReviews || 0,
          isVerified: (vehicle as any).owner.verified || false
        },
        rating: averageRating,
        reviewCount: reviewsArray.length,
        specs: {
          passengers: (vehicle as any).seats,
          luggage: 3,
          fuelEfficiency: (vehicle as any).mileage || 0,
          transmission: (vehicle as any).transmission
        },
        features,
        location: (vehicle as any).location,
        distance: Math.floor(Math.random() * 50) + 1, // Mock distance
        availability,
        isSpecialOffer: Math.random() > 0.8,
        hasDelivery: Math.random() > 0.6,
        deliveryRadius: Math.floor(Math.random() * 20) + 5,
        insuranceOptions: Math.random() > 0.3,
        instantBooking: Math.random() > 0.4,
        isFavorite: false,
        onToggleFavorite: (vehicleId: string) => {
          console.log('Toggle favorite:', vehicleId);
        },
        onCompare: (vehicleId: string) => {
          console.log('Add to compare:', vehicleId);
        }
      };
    });

    const loaderData: LoaderData = {
      vehicles: formattedVehicles,
      total,
      filters: {
        categories: categories.map(c => c.category),
        fuelTypes: fuelTypes.map(f => f.fuelType),
        transmissions: transmissions.map(t => t.transmission),
        priceRange: {
          min: priceStats._min.basePrice || 0,
          max: priceStats._max.basePrice || 1000
        },
        locations: locations.map(l => l.location)
      }
    };

    return json(loaderData);
  } catch (error) {
    console.error("Error in vehicles loader:", error);
    throw new Response("Failed to load vehicles", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function VehiclesPage() {
  const { vehicles, total, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);

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

  const handleCompare = (vehicleId: string) => {
    if (compareList.includes(vehicleId)) {
      setCompareList(compareList.filter(id => id !== vehicleId));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, vehicleId]);
    }
  };

  const removeFromCompare = (vehicleId: string) => {
    setCompareList(compareList.filter(id => id !== vehicleId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const activeFilters = Array.from(searchParams.entries()).filter(([key, value]) => 
    key !== 'page' && key !== 'limit' && value
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Find Your Perfect Vehicle
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Choose from our premium selection of vehicles for your next adventure
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
                  placeholder="Search vehicles, models, or locations..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                {/* Fuel Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    value={searchParams.get("fuelType") || ""}
                    onChange={(e) => handleFilterChange("fuelType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Fuel Types</option>
                    {filters.fuelTypes.map(fuelType => (
                      <option key={fuelType} value={fuelType}>{fuelType}</option>
                    ))}
                  </select>
                </div>

                {/* Transmission Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    value={searchParams.get("transmission") || ""}
                    onChange={(e) => handleFilterChange("transmission", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Transmissions</option>
                    {filters.transmissions.map(transmission => (
                      <option key={transmission} value={transmission}>{transmission}</option>
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
              {total} vehicles found
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

        {/* Vehicles Grid */}
        <Card className="p-4">
          {isLoading ? (
            <VehicleGrid vehicles={Array(12).fill(null).map((_, i) => ({ id: i.toString() } as any))} columns={3} />
          ) : (
            <VehicleGrid 
              vehicles={vehicles} 
              columns={3} 
              showCompare={true}
              selectedDates={{
                start: '2024-01-15',
                end: '2024-01-17'
              }}
            />
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => (window.location.href = '/vehicles')}>Browse All Vehicles</Button>
          </div>
        </Card>

        {/* Empty State */}
        {vehicles.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all vehicles
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
        {vehicles.length > 0 && vehicles.length < total && (
          <div className="text-center mt-8">
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (parseInt(searchParams.get("page") || "1") + 1).toString());
                setSearchParams(newParams);
              }}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Load More Vehicles
            </button>
          </div>
        )}
      </div>

      {/* Comparison Bar */}
      {compareList.length > 0 && (
        <VehicleComparison
          vehicles={vehicles.filter(v => compareList.includes(v.id))}
          onRemove={removeFromCompare}
          onClear={clearCompare}
        />
      )}
    </div>
  );
}
