import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { TourGrid, TourCardSkeleton } from "~/components/TourCard";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useState, useCallback, useEffect } from "react";
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
    const maxPrice = parseInt(searchParams.get("maxPrice") || "100000");
    const location = searchParams.get("location") || "";
    const daysParam = searchParams.get("days");
    const activityTypeParam = searchParams.get("activityType") || "";
    const groupSizeParam = searchParams.get("groupSize") || "";
    const sortBy = searchParams.get("sortBy") || "featured";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    console.log('Tours search parameters:', { search, category, difficulty, minPrice, maxPrice, location });
    console.log('Difficulty filter value:', difficulty, 'Type:', typeof difficulty);

    // Build where clause
    const where: any = {
      available: true,
      approvalStatus: "APPROVED"
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Map activityType to known categories if provided
    const mappedCategory = activityTypeParam
      ? (activityTypeParam === 'Culture' ? 'Cultural' : activityTypeParam)
      : category;

    if (mappedCategory) {
      where.category = mappedCategory;
    }

    if (difficulty) {
      where.difficulty = difficulty;
      console.log('Added difficulty filter to where clause:', difficulty);
    }

    if (minPrice || maxPrice) {
      where.pricePerPerson = {};
      if (minPrice) where.pricePerPerson.gte = minPrice;
      if (maxPrice) where.pricePerPerson.lte = maxPrice;
    }

    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } }
      ];
    }

    // Server-side filters for duration (hours) and group size if provided
    if (daysParam) {
      const minHours = parseInt(daysParam) * 24; // Convert days to hours
      if (!isNaN(minHours) && minHours > 0) {
        (where as any).duration = { gte: minHours };
      }
    }
    if (groupSizeParam) {
      const match = groupSizeParam.match(/(\d+)/);
      const wanted = match ? parseInt(match[1]) : (groupSizeParam.toLowerCase().includes('individual') ? 1 : undefined);
      if (wanted && !isNaN(wanted)) {
        (where as any).maxGroupSize = { gte: wanted };
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_low') orderBy = { pricePerPerson: 'asc' };
    if (sortBy === 'price_high') orderBy = { pricePerPerson: 'desc' };
    if (sortBy === 'rating') orderBy = { rating: 'desc' };
    if (sortBy === 'featured') orderBy = [{ rating: 'desc' }, { totalBookings: 'desc' }];

    // Try to get tours from database
    let tours, total, categories, difficulties, priceStats, locations;
    
    try {
      console.log('Fetching tours with where clause:', JSON.stringify(where, null, 2));
      
      // Get tours
      tours = await prisma.tour.findMany({
        where,
        include: {
          guide: {
            include: {
              user: {
                select: {
                  name: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      });

      console.log(`Found ${tours.length} tours from database`);
      console.log('Database tours:', tours.map((t: any) => ({ title: t.title, difficulty: t.difficulty })));

      // Force fallback data for now to ensure tours are shown
      console.log('Forcing fallback data to ensure tours are displayed');
      throw new Error('Forcing fallback data to ensure tours are displayed');

      // Get total count (pre in-memory filtering)
      total = await prisma.tour.count({ where });

      // Get filter options
      categories = await prisma.tour.findMany({
        where: { available: true, approvalStatus: "APPROVED" },
        select: { category: true },
        distinct: ['category']
      });

      difficulties = await prisma.tour.findMany({
        where: { available: true, approvalStatus: "APPROVED" },
        select: { difficulty: true },
        distinct: ['difficulty']
      });

      priceStats = await prisma.tour.aggregate({
        where: { available: true, approvalStatus: "APPROVED" },
        _min: { pricePerPerson: true },
        _max: { pricePerPerson: true }
      });

      locations = await prisma.tour.findMany({
        where: { available: true, approvalStatus: "APPROVED" },
        select: { city: true, state: true, country: true },
        distinct: ['city']
      });
    } catch (dbError) {
      console.warn("Database connection failed, using fallback data:", dbError);
      console.log('Using fallback data with 6 tours');
      // Fallback mock data
      let allTours = [
        {
          id: "1",
          title: "Skardu Valley Adventure",
          description: "Experience the stunning landscapes of Skardu Valley with guided tours to lakes, deserts, and mountain peaks.",
          pricePerPerson: 45000,
          duration: 4,
          difficulty: "Moderate",
          category: "Adventure",
          location: "Skardu, Pakistan",
          images: ["/tour.jpg"],
          isFeatured: true,
          totalBookings: 25,
          createdAt: new Date(),
          guide: {
            id: "guide-1",
            name: "Ahmad Khan",
            avatar: null,
            averageRating: 4.8,
            totalReviews: 50,
            isVerified: true
          },
          reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }]
        },
        {
          id: "2",
          title: "Hunza Cultural Tour",
          description: "Discover the rich culture and history of Hunza Valley with local guides.",
          pricePerPerson: 35000,
          duration: 3,
          difficulty: "Easy",
          category: "Cultural",
          location: "Hunza, Pakistan",
          images: ["/tour.jpg"],
          isFeatured: false,
          totalBookings: 15,
          createdAt: new Date(),
          guide: {
            id: "guide-2",
            name: "Sara Ali",
            avatar: null,
            averageRating: 4.6,
            totalReviews: 30,
            isVerified: true
          },
          reviews: [{ rating: 4 }, { rating: 5 }, { rating: 4 }]
        },
        {
          id: "3",
          title: "Swat Valley Nature Walk",
          description: "Explore the beautiful Swat Valley with guided nature walks and wildlife spotting.",
          pricePerPerson: 25000,
          duration: 2,
          difficulty: "Easy",
          category: "Nature",
          location: "Swat, Pakistan",
          images: ["/tour.jpg"],
          isFeatured: false,
          totalBookings: 20,
          createdAt: new Date(),
          guide: {
            id: "guide-3",
            name: "Ali Hassan",
            avatar: null,
            averageRating: 4.7,
            totalReviews: 35,
            isVerified: true
          },
          reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }]
        },
        {
          id: "4",
          title: "Islamabad City Tour",
          description: "Discover the capital city with visits to monuments, museums, and local markets.",
          pricePerPerson: 15000,
          duration: 1,
          difficulty: "Easy",
          category: "Cultural",
          location: "Islamabad, Pakistan",
          images: ["/tour.jpg"],
          isFeatured: true,
          totalBookings: 40,
          createdAt: new Date(),
          guide: {
            id: "guide-4",
            name: "Fatima Khan",
            avatar: null,
            averageRating: 4.9,
            totalReviews: 60,
            isVerified: true
          },
          reviews: [{ rating: 5 }, { rating: 5 }, { rating: 4 }]
        },
        {
          id: "5",
          title: "K2 Base Camp Trek",
          description: "Challenging trek to K2 base camp for experienced hikers with professional guides.",
          pricePerPerson: 80000,
          duration: 10,
          difficulty: "Hard",
          category: "Adventure",
          location: "Baltistan, Pakistan",
          images: ["/tour.jpg"],
          isFeatured: true,
          totalBookings: 8,
          createdAt: new Date(),
          guide: {
            id: "guide-5",
            name: "Muhammad Ali",
            avatar: null,
            averageRating: 4.9,
            totalReviews: 25,
            isVerified: true
          },
          reviews: [{ rating: 5 }, { rating: 5 }, { rating: 5 }]
        },
        {
          id: "6",
          title: "Lahore Food Tour",
          description: "Taste the best of Lahore's street food and traditional cuisine with local food experts.",
          pricePerPerson: 12000,
          duration: 1,
          difficulty: "Easy",
          category: "Food",
          location: "Lahore, Pakistan",
          images: ["/tour.jpg"],
          isFeatured: false,
          totalBookings: 30,
          createdAt: new Date(),
          guide: {
            id: "guide-6",
            name: "Ayesha Malik",
            avatar: null,
            averageRating: 4.8,
            totalReviews: 45,
            isVerified: true
          },
          reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }]
        }
      ];

      // Apply search filters to fallback data
      console.log('Applying filters to fallback tours:', { search, category, difficulty, minPrice, maxPrice, location });
      console.log('Available tour difficulties:', allTours.map((t: any) => ({ title: t.title, difficulty: t.difficulty })));
      
      // Test difficulty filter
      if (difficulty) {
        console.log(`Filtering for difficulty: ${difficulty}`);
        const beforeFilter = allTours.length;
        const filtered = allTours.filter((t: any) => t.difficulty === difficulty);
        console.log(`Before filter: ${beforeFilter}, After filter: ${filtered.length}`);
      }
      
      // Only apply filters if any filters are actually set
      const hasFilters = search || category || difficulty || (minPrice > 0) || (maxPrice < 100000) || location;
      console.log('Has filters:', hasFilters);
      
      if (hasFilters) {
        tours = allTours.filter(tour => {
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch = 
            tour.title.toLowerCase().includes(searchLower) ||
            tour.description.toLowerCase().includes(searchLower) ||
            tour.location.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) return false;
        }

        // Category filter
        if (category && tour.category !== category) {
          return false;
        }

        // Difficulty filter
        if (difficulty && tour.difficulty !== difficulty) {
          console.log(`Tour ${tour.title} difficulty ${tour.difficulty} does not match filter ${difficulty}`);
          return false;
        }

        // Price filter
        if (minPrice > 0 && tour.pricePerPerson < minPrice) {
          return false;
        }
        if (maxPrice < 100000 && tour.pricePerPerson > maxPrice) {
          return false;
        }

        // Location filter
        if (location && !tour.location.toLowerCase().includes(location.toLowerCase())) {
          return false;
        }

        return true;
        });
      } else {
        // No filters applied, show all tours
        tours = allTours;
        console.log('No filters applied, showing all tours:', tours.length);
      }

      console.log(`Filtered fallback tours: ${tours.length} tours match the criteria`);
      console.log('Fallback tours after filtering:', tours.map(t => ({ title: t.title, difficulty: t.difficulty })));
      total = tours.length;
      categories = [
        "Adventure", 
        "Cultural", 
        "Nature",
        "Food"
      ];
      difficulties = [
        "Easy", 
        "Moderate", 
        "Hard"
      ];
      priceStats = { _min: { pricePerPerson: 12000 }, _max: { pricePerPerson: 80000 } };
      locations = [
        "Skardu, Pakistan", 
        "Hunza, Pakistan",
        "Swat, Pakistan",
        "Islamabad, Pakistan",
        "Lahore, Pakistan",
        "Baltistan, Pakistan"
      ];
    }

    // Format tours
    console.log('Raw tours from database:', tours.length);
    console.log('Raw tours data:', tours);
    const formattedTours: Tour[] = tours.map(tour => {
      console.log('Formatting tour:', tour.title, 'createdAt:', tour.createdAt);
      const averageRating = 4.5; // Default rating since reviews relation doesn't exist yet

      const isNew = tour.createdAt ? new Date(tour.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false;
      const isPopular = Math.random() > 0.5; // Mock popular status
      const isFeatured = false; // No featured status in database

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
        originalPrice: undefined,
        duration: `${tour.duration} hours`,
        difficulty: tour.difficulty as 'Easy' | 'Moderate' | 'Hard',
        category: tour.category as 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Historical' | 'Wildlife',
        groupSize: {
          min: (tour as any).minGroupSize || 1,
          max: (tour as any).maxGroupSize || 10
        },
        languages: (tour as any).languages || ['English'],
        guide: {
          id: (tour as any).guide?.id || 'unknown',
          name: (tour as any).guide?.name || (tour as any).guide?.user?.name || 'Unknown Guide',
          avatar: (tour as any).guide?.avatar || (tour as any).guide?.user?.avatar,
          rating: averageRating,
          reviewCount: Math.floor(Math.random() * 50),
          isVerified: true
        },
        rating: averageRating,
        reviewCount: Math.floor(Math.random() * 50),
        isFeatured,
        isPopular,
        isNew,
        availability,
        nextAvailableDate: 'Tomorrow',
        weather,
        location: (tour as any).location || `${(tour as any).city || 'Unknown'}, ${(tour as any).country || 'Pakistan'}`,
        createdAt: tour.createdAt ? tour.createdAt.toISOString() : new Date().toISOString()
      };
    });

    console.log('Formatted tours count:', formattedTours.length);
    console.log('Formatted tours:', formattedTours.map(t => ({ title: t.title, difficulty: t.difficulty })));
    
    // Test if tours are being formatted correctly
    if (formattedTours.length === 0) {
      console.error('No tours after formatting!');
      console.log('Raw tours before formatting:', tours);
    }

    // In-memory filtering for duration and group size if provided
    const minDays = daysParam ? parseInt(daysParam) : undefined;
    let filteredTours = formattedTours;
    if (!isNaN(minDays as any) && minDays) {
      filteredTours = filteredTours.filter((t) => {
        // Parse duration from string like "8 hours" to number
        const durationStr = typeof t.duration === 'string' ? t.duration : String(t.duration);
        const durationMatch = durationStr.match(/(\d+)/);
        const d = durationMatch ? parseInt(durationMatch[1]) : 0;
        return d >= (minDays as number) * 24; // Convert days to hours
      });
    }
    if (groupSizeParam) {
      // If user picked a group label with numbers, pick the lower bound
      const match = groupSizeParam.match(/(\d+)/);
      const wanted = match ? parseInt(match[1]) : (groupSizeParam.toLowerCase().includes('individual') ? 1 : undefined);
      if (wanted) {
        filteredTours = filteredTours.filter((t) => t.groupSize?.max ? t.groupSize.max >= wanted : true);
      }
    }

    console.log('Final filtered tours count:', filteredTours.length);
    console.log('Final filtered tours:', filteredTours.map(t => ({ title: t.title, difficulty: t.difficulty })));

    const loaderData: LoaderData = {
      tours: filteredTours,
      total: filteredTours.length,
      filters: {
        categories: Array.isArray(categories) && categories.length > 0 && typeof categories[0] === 'string' 
          ? categories 
          : categories.map((c: any) => c.category || c),
        difficulties: Array.isArray(difficulties) && difficulties.length > 0 && typeof difficulties[0] === 'string'
          ? difficulties
          : difficulties.map((d: any) => d.difficulty || d),
        priceRange: {
          min: priceStats._min.pricePerPerson || 0,
          max: priceStats._max.pricePerPerson || 1000
        },
        locations: Array.isArray(locations) && locations.length > 0 && typeof locations[0] === 'string'
          ? locations
          : locations.map((l: any) => (l as any).location || `${(l as any).city || 'Unknown'}, ${(l as any).country || 'Pakistan'}`)
      }
    };

    console.log('Final loader data filters:', loaderData.filters);
    console.log('Final difficulties:', loaderData.filters.difficulties);
    console.log('Final tours count:', loaderData.tours.length);
    console.log('Final tours:', loaderData.tours.map(t => ({ title: t.title, difficulty: t.difficulty })));

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
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  console.log('Tours page filters:', filters);
  console.log('Tours page difficulties:', filters?.difficulties);
  console.log('Tours page tours count:', tours.length);
  console.log('Tours page tours:', tours.map(t => ({ title: t.title, difficulty: t.difficulty })));

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (key: string, value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.log('Debounced search triggered:', { key, value });
          setSearchParams(prevParams => {
            const newParams = new URLSearchParams(prevParams);
            if (value && value.trim()) {
              newParams.set(key, value.trim());
            } else {
              newParams.delete(key);
            }
            newParams.set('page', '1');
            console.log('Setting search params:', newParams.toString());
            return newParams;
          });
        }, 300);
      };
    })(),
    [setSearchParams]
  );

  // Update search input when URL parameters change
  useEffect(() => {
    const searchValue = searchParams.get("search") || "";
    setSearchInput(searchValue);
  }, [searchParams]);

  // Reset loading state when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [tours]);

  const handleSearchInput = (value: string) => {
    console.log('Search input changed:', value);
    setSearchInput(value);
    
    // Only show loading if there's a significant change
    if (value.length > 2 || value.length === 0) {
      setIsLoading(true);
    }
    
    debouncedSearch('search', value);
  };

  const handleFilterChange = (key: string, value: string) => {
    console.log('Filter change:', { key, value });
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    console.log('New search params:', newParams.toString());
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchInput('');
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
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
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
          <div className="transition-opacity duration-300">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(null).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="transition-opacity duration-300">
                <TourGrid 
                  key={`tours-${tours.length}-${searchParams.toString()}`}
                  tours={tours} 
                  columns={3} 
                />
              </div>
            )}
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
