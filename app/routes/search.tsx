import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigate } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Star,
  Clock,
  Zap,
  Car,
  Home,
  Plane,
  Package,
  Sliders,
  Grid,
  List,
  SortAsc,
  Loader2
} from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface SearchFilters {
  serviceType: 'accommodations' | 'vehicles' | 'tours' | 'packages';
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  passengers: number;
  priceMin: number;
  priceMax: number;
  rating: number;
  propertyType: string[];
  amenities: string[];
  vehicleType: string[];
  transmission: string[];
  fuelType: string[];
  features: string[];
  tourCategory: string[];
  difficulty: string[];
  duration: number[];
  languages: string[];
  sortBy: 'price' | 'rating' | 'distance' | 'popularity';
  viewMode: 'grid' | 'list';
}

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
}

interface LoaderData {
  results: SearchResult[];
  total: number;
  filters: {
    locations: string[];
    propertyTypes: string[];
    amenities: string[];
    vehicleTypes: string[];
    transmissions: string[];
    fuelTypes: string[];
    features: string[];
    tourCategories: string[];
    difficulties: string[];
    languages: string[];
    priceRange: { min: number; max: number };
  };
  popularSearches: string[];
  recentSearches: string[];
}

// ========================================
// LOADER
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse search parameters
    const serviceType = (searchParams.get("serviceType") || "accommodations") as SearchFilters['serviceType'];
    const location = searchParams.get("location") || "";
    const checkIn = searchParams.get("checkIn") || "";
    const checkOut = searchParams.get("checkOut") || "";
    const guests = parseInt(searchParams.get("guests") || "2");
    const passengers = parseInt(searchParams.get("passengers") || "2");
    const priceMin = parseInt(searchParams.get("priceMin") || "0");
    const priceMax = parseInt(searchParams.get("priceMax") || "1000");
    const rating = parseInt(searchParams.get("rating") || "0");
    const propertyType = searchParams.get("propertyType")?.split(",") || [];
    const amenities = searchParams.get("amenities")?.split(",") || [];
    const vehicleType = searchParams.get("vehicleType")?.split(",") || [];
    const transmission = searchParams.get("transmission")?.split(",") || [];
    const fuelType = searchParams.get("fuelType")?.split(",") || [];
    const features = searchParams.get("features")?.split(",") || [];
    const tourCategory = searchParams.get("tourCategory")?.split(",") || [];
    const difficulty = searchParams.get("difficulty")?.split(",") || [];
    const languages = searchParams.get("languages")?.split(",") || [];
    const sortBy = (searchParams.get("sortBy") || "popularity") as SearchFilters['sortBy'];
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build where clause based on service type
    let where: any = {
      isActive: true,
      isApproved: true
    };

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (priceMin || priceMax) {
      const priceField = serviceType === 'accommodations' ? 'basePrice' : 
                        serviceType === 'vehicles' ? 'basePrice' : 'pricePerPerson';
      where[priceField] = {};
      if (priceMin) where[priceField].gte = priceMin;
      if (priceMax) where[priceField].lte = priceMax;
    }

    if (rating > 0) {
      where.averageRating = { gte: rating };
    }

    // Service-specific filters
    if (serviceType === 'accommodations') {
      if (propertyType.length > 0) {
        where.type = { in: propertyType };
      }
      if (amenities.length > 0) {
        where.amenities = { hasSome: amenities };
      }
      if (guests > 0) {
        where.maxGuests = { gte: guests };
      }
    } else if (serviceType === 'vehicles') {
      if (vehicleType.length > 0) {
        where.category = { in: vehicleType };
      }
      if (transmission.length > 0) {
        where.transmission = { in: transmission };
      }
      if (fuelType.length > 0) {
        where.fuelType = { in: fuelType };
      }
      if (features.length > 0) {
        where.features = { hasSome: features };
      }
      if (passengers > 0) {
        where.passengerCapacity = { gte: passengers };
      }
    } else if (serviceType === 'tours') {
      if (tourCategory.length > 0) {
        where.category = { in: tourCategory };
      }
      if (difficulty.length > 0) {
        where.difficulty = { in: difficulty };
      }
      if (languages.length > 0) {
        where.languages = { hasSome: languages };
      }
      if (guests > 0) {
        where.maxGroupSize = { gte: guests };
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price') {
      const priceField = serviceType === 'accommodations' ? 'basePrice' : 
                        serviceType === 'vehicles' ? 'basePrice' : 'pricePerPerson';
      orderBy = { [priceField]: 'asc' };
    } else if (sortBy === 'rating') {
      orderBy = { averageRating: 'desc' };
    } else if (sortBy === 'distance') {
      // Would need location-based sorting in production
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'popularity') {
      orderBy = [{ isFeatured: 'desc' }, { averageRating: 'desc' }];
    }

    // Get results based on service type
    let results: any[] = [];
    let total = 0;

    if (serviceType === 'accommodations') {
      const properties = await prisma.property.findMany({
        where,
        include: {
          owner: {
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

      total = await prisma.property.count({ where });
      results = properties.map(property => ({
        id: property.id,
        type: 'property' as const,
        title: property.name,
        description: property.description,
        images: property.images || ['/placeholder-property.jpg'],
        price: property.basePrice,
        originalPrice: property.originalPrice,
        rating: property.averageRating || 0,
        reviewCount: property.totalReviews || 0,
        location: property.location,
        distance: Math.floor(Math.random() * 50) + 1,
        category: property.type,
        features: property.amenities || [],
        isAvailable: true,
        isFeatured: property.isFeatured || false,
        isPopular: property.totalBookings > 10,
        isNew: new Date(property.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }));
    } else if (serviceType === 'vehicles') {
      const vehicles = await prisma.vehicle.findMany({
        where,
        include: {
          owner: {
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

      total = await prisma.vehicle.count({ where });
      results = vehicles.map(vehicle => ({
        id: vehicle.id,
        type: 'vehicle' as const,
        title: `${vehicle.name} ${vehicle.model}`,
        description: vehicle.description,
        images: vehicle.images || ['/placeholder-vehicle.jpg'],
        price: vehicle.basePrice,
        originalPrice: vehicle.originalPrice,
        rating: vehicle.averageRating || 0,
        reviewCount: vehicle.totalReviews || 0,
        location: vehicle.location,
        distance: Math.floor(Math.random() * 50) + 1,
        category: vehicle.category,
        features: vehicle.features || [],
        isAvailable: true,
        isFeatured: vehicle.isFeatured || false,
        isPopular: vehicle.totalBookings > 10,
        isNew: new Date(vehicle.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }));
    } else if (serviceType === 'tours') {
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

      total = await prisma.tour.count({ where });
      results = tours.map(tour => ({
        id: tour.id,
        type: 'tour' as const,
        title: tour.title,
        description: tour.description,
        images: tour.images || ['/placeholder-tour.jpg'],
        price: tour.pricePerPerson,
        originalPrice: tour.originalPrice,
        rating: tour.averageRating || 0,
        reviewCount: tour.totalReviews || 0,
        location: tour.location,
        distance: Math.floor(Math.random() * 50) + 1,
        category: tour.category,
        features: tour.features || [],
        isAvailable: true,
        isFeatured: tour.isFeatured || false,
        isPopular: tour.totalBookings > 10,
        isNew: new Date(tour.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }));
    }

    // Get filter options
    const locations = await prisma.property.findMany({
      where: { isActive: true, isApproved: true },
      select: { location: true },
      distinct: ['location']
    });

    const propertyTypes = await prisma.property.findMany({
      where: { isActive: true, isApproved: true },
      select: { type: true },
      distinct: ['type']
    });

    const amenitiesData = await prisma.property.findMany({
      where: { isActive: true, isApproved: true },
      select: { amenities: true }
    });

    const vehicleTypes = await prisma.vehicle.findMany({
      where: { isActive: true, isApproved: true },
      select: { category: true },
      distinct: ['category']
    });

    const transmissions = await prisma.vehicle.findMany({
      where: { isActive: true, isApproved: true },
      select: { transmission: true },
      distinct: ['transmission']
    });

    const fuelTypes = await prisma.vehicle.findMany({
      where: { isActive: true, isApproved: true },
      select: { fuelType: true },
      distinct: ['fuelType']
    });

    const tourCategories = await prisma.tour.findMany({
      where: { isActive: true, isApproved: true },
      select: { category: true },
      distinct: ['category']
    });

    const difficulties = await prisma.tour.findMany({
      where: { isActive: true, isApproved: true },
      select: { difficulty: true },
      distinct: ['difficulty']
    });

    const availableLanguages = await prisma.tour.findMany({
      where: { isActive: true, isApproved: true },
      select: { languages: true }
    });

    const priceStats = await prisma.property.aggregate({
      where: { isActive: true, isApproved: true },
      _min: { basePrice: true },
      _max: { basePrice: true }
    });

    const loaderData: LoaderData = {
      results,
      total,
      filters: {
        locations: locations.map(l => l.location),
        propertyTypes: propertyTypes.map(p => p.type),
        amenities: [...new Set(amenitiesData.flatMap(a => a.amenities || []))],
        vehicleTypes: vehicleTypes.map(v => v.category),
        transmissions: transmissions.map(t => t.transmission),
        fuelTypes: fuelTypes.map(f => f.fuelType),
        features: [...new Set(vehicles.flatMap(v => v.features || []))],
        tourCategories: tourCategories.map(t => t.category),
        difficulties: difficulties.map(d => d.difficulty),
        languages: [...new Set(availableLanguages.flatMap(l => l.languages || []))],
        priceRange: {
          min: priceStats._min.basePrice || 0,
          max: priceStats._max.basePrice || 1000
        }
      },
      popularSearches: [
        "Beachfront properties",
        "Luxury cars",
        "City tours",
        "Mountain cabins",
        "Adventure tours"
      ],
      recentSearches: [
        "Downtown apartments",
        "SUV rentals",
        "Food tours"
      ]
    };

    return json(loaderData);
  } catch (error) {
    console.error("Error in search loader:", error);
    throw new Response("Failed to load search results", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function SearchPage() {
  const { results, total, filters, popularSearches, recentSearches } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("serviceType") || "accommodations");
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  // Service type tabs
  const serviceTypes = [
    { id: 'accommodations', label: 'Accommodations', icon: Home },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'tours', label: 'Tours', icon: Plane },
    { id: 'packages', label: 'Packages', icon: Package }
  ];

  // Handle tab switching
  const handleTabChange = (serviceType: string) => {
    setActiveTab(serviceType);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('serviceType', serviceType);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | string[] | number) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        newParams.set(key, value.join(','));
      } else {
        newParams.delete(key);
      }
    } else if (value) {
      newParams.set(key, value.toString());
    } else {
      newParams.delete(key);
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set('serviceType', activeTab);
    setSearchParams(newParams);
  };

  // Get current filter values
  const currentFilters = {
    location: searchParams.get("location") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: parseInt(searchParams.get("guests") || "2"),
    passengers: parseInt(searchParams.get("passengers") || "2"),
    priceMin: parseInt(searchParams.get("priceMin") || "0"),
    priceMax: parseInt(searchParams.get("priceMax") || "1000"),
    rating: parseInt(searchParams.get("rating") || "0"),
    propertyType: searchParams.get("propertyType")?.split(",") || [],
    amenities: searchParams.get("amenities")?.split(",") || [],
    vehicleType: searchParams.get("vehicleType")?.split(",") || [],
    transmission: searchParams.get("transmission")?.split(",") || [],
    fuelType: searchParams.get("fuelType")?.split(",") || [],
    features: searchParams.get("features")?.split(",") || [],
    tourCategory: searchParams.get("tourCategory")?.split(",") || [],
    difficulty: searchParams.get("difficulty")?.split(",") || [],
    languages: searchParams.get("languages")?.split(",") || [],
    sortBy: searchParams.get("sortBy") || "popularity",
    viewMode: searchParams.get("viewMode") || "grid"
  };

  // Update applied filters
  useEffect(() => {
    const applied: string[] = [];
    if (currentFilters.location) applied.push(`Location: ${currentFilters.location}`);
    if (currentFilters.priceMin > 0) applied.push(`Min Price: $${currentFilters.priceMin}`);
    if (currentFilters.priceMax < 1000) applied.push(`Max Price: $${currentFilters.priceMax}`);
    if (currentFilters.rating > 0) applied.push(`Rating: ${currentFilters.rating}+ stars`);
    if (currentFilters.propertyType.length > 0) applied.push(`Type: ${currentFilters.propertyType.join(', ')}`);
    if (currentFilters.amenities.length > 0) applied.push(`Amenities: ${currentFilters.amenities.length} selected`);
    setAppliedFilters(applied);
  }, [currentFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Service Type Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {serviceTypes.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => handleTabChange(service.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === service.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{service.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar - Sticky */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Location Input */}
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={currentFilters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex space-x-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={currentFilters.checkIn}
                  onChange={(e) => handleFilterChange("checkIn", e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={currentFilters.checkOut}
                  onChange={(e) => handleFilterChange("checkOut", e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Guests/Passengers */}
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={activeTab === 'vehicles' ? currentFilters.passengers : currentFilters.guests}
                onChange={(e) => handleFilterChange(
                  activeTab === 'vehicles' ? 'passengers' : 'guests', 
                  parseInt(e.target.value)
                )}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {activeTab === 'vehicles' ? 'passengers' : 'guests'}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={() => setIsLoading(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Applied Filters */}
              {appliedFilters.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {appliedFilters.map((filter, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center space-x-2"
                      >
                        <span>{filter}</span>
                        <button
                          onClick={() => {
                            // Remove specific filter logic would go here
                            console.log('Remove filter:', filter);
                          }}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service-specific filters */}
              {activeTab === 'accommodations' && (
                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={filters.priceRange.min}
                        max={filters.priceRange.max}
                        value={currentFilters.priceMin}
                        onChange={(e) => handleFilterChange("priceMin", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>${currentFilters.priceMin}</span>
                        <span>${currentFilters.priceMax}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <div className="space-y-2">
                      {filters.propertyTypes.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.propertyType.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...currentFilters.propertyType, type]
                                : currentFilters.propertyType.filter(t => t !== type);
                              handleFilterChange("propertyType", newTypes);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Star Rating
                    </label>
                    <div className="flex space-x-1">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <button
                          key={stars}
                          onClick={() => handleFilterChange("rating", stars)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded ${
                            currentFilters.rating === stars
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                          <span className="text-sm">{stars}+</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filters.amenities.slice(0, 10).map((amenity) => (
                        <label key={amenity} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.amenities.includes(amenity)}
                            onChange={(e) => {
                              const newAmenities = e.target.checked
                                ? [...currentFilters.amenities, amenity]
                                : currentFilters.amenities.filter(a => a !== amenity);
                              handleFilterChange("amenities", newAmenities);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vehicles' && (
                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Day
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={filters.priceRange.min}
                        max={filters.priceRange.max}
                        value={currentFilters.priceMin}
                        onChange={(e) => handleFilterChange("priceMin", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>${currentFilters.priceMin}</span>
                        <span>${currentFilters.priceMax}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <div className="space-y-2">
                      {filters.vehicleTypes.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.vehicleType.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...currentFilters.vehicleType, type]
                                : currentFilters.vehicleType.filter(t => t !== type);
                              handleFilterChange("vehicleType", newTypes);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transmission
                    </label>
                    <div className="space-y-2">
                      {filters.transmissions.map((transmission) => (
                        <label key={transmission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.transmission.includes(transmission)}
                            onChange={(e) => {
                              const newTransmissions = e.target.checked
                                ? [...currentFilters.transmission, transmission]
                                : currentFilters.transmission.filter(t => t !== transmission);
                              handleFilterChange("transmission", newTransmissions);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{transmission}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type
                    </label>
                    <div className="space-y-2">
                      {filters.fuelTypes.map((fuel) => (
                        <label key={fuel} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.fuelType.includes(fuel)}
                            onChange={(e) => {
                              const newFuelTypes = e.target.checked
                                ? [...currentFilters.fuelType, fuel]
                                : currentFilters.fuelType.filter(f => f !== fuel);
                              handleFilterChange("fuelType", newFuelTypes);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{fuel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tours' && (
                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={filters.priceRange.min}
                        max={filters.priceRange.max}
                        value={currentFilters.priceMin}
                        onChange={(e) => handleFilterChange("priceMin", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>${currentFilters.priceMin}</span>
                        <span>${currentFilters.priceMax}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tour Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="space-y-2">
                      {filters.tourCategories.map((category) => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.tourCategory.includes(category)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...currentFilters.tourCategory, category]
                                : currentFilters.tourCategory.filter(c => c !== category);
                              handleFilterChange("tourCategory", newCategories);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <div className="space-y-2">
                      {filters.difficulties.map((difficulty) => (
                        <label key={difficulty} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.difficulty.includes(difficulty)}
                            onChange={(e) => {
                              const newDifficulties = e.target.checked
                                ? [...currentFilters.difficulty, difficulty]
                                : currentFilters.difficulty.filter(d => d !== difficulty);
                              handleFilterChange("difficulty", newDifficulties);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{difficulty}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filters.languages.slice(0, 8).map((language) => (
                        <label key={language} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentFilters.languages.includes(language)}
                            onChange={(e) => {
                              const newLanguages = e.target.checked
                                ? [...currentFilters.languages, language]
                                : currentFilters.languages.filter(l => l !== language);
                              handleFilterChange("languages", newLanguages);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{language}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {total} results found
                </h2>
                <p className="text-gray-600">
                  {activeTab === 'accommodations' && 'Properties'}
                  {activeTab === 'vehicles' && 'Vehicles'}
                  {activeTab === 'tours' && 'Tours'}
                  {activeTab === 'packages' && 'Packages'}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFilterChange("viewMode", "grid")}
                    className={`p-2 rounded ${
                      currentFilters.viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleFilterChange("viewMode", "list")}
                    className={`p-2 rounded ${
                      currentFilters.viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={currentFilters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Sliders className="w-5 h-5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                    <div className="h-48 bg-gray-300 rounded mb-4" />
                    <div className="h-4 bg-gray-300 rounded mb-2" />
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4" />
                    <div className="h-6 bg-gray-300 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className={`grid gap-6 ${
                currentFilters.viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={result.images[0] || '/placeholder.jpg'}
                          alt={result.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {result.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {result.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{result.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span>{result.rating.toFixed(1)}</span>
                            </div>
                            {result.distance && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{result.distance} km away</span>
                              </div>
                            )}
                          </div>
                        </div>
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
                            {activeTab === 'accommodations' && 'per night'}
                            {activeTab === 'vehicles' && 'per day'}
                            {activeTab === 'tours' && 'per person'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or browse all {activeTab}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {results.length > 0 && results.length < total && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', (parseInt(searchParams.get("page") || "1") + 1).toString());
                    setSearchParams(newParams);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Load More Results
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
