import { prisma } from "~/lib/db/db.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface SearchFilters {
  query?: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  propertyType?: string;
  vehicleType?: string;
  tourType?: string;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest';
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  type: 'property' | 'vehicle' | 'tour';
  title: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  location: string;
  provider: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
  availability: boolean;
  distance?: number;
  amenities?: string[];
  features?: string[];
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  filters: {
    priceRange: { min: number; max: number };
    ratingRange: { min: number; max: number };
    locations: string[];
    types: string[];
  };
}

// ========================================
// SEARCH FUNCTIONS
// ========================================

/**
 * Main search function with rating integration
 */
export async function searchServices(filters: SearchFilters): Promise<SearchResponse> {
  try {
    const {
      query,
      location,
      checkIn,
      checkOut,
      guests,
      minRating = 0,
      maxPrice,
      minPrice,
      propertyType,
      vehicleType,
      tourType,
      sortBy = 'relevance',
      limit = 20,
      offset = 0
    } = filters;

    // Build where clauses for each service type
    const propertyWhere = buildPropertyWhere({
      query,
      location,
      checkIn,
      checkOut,
      guests,
      minRating,
      maxPrice,
      minPrice,
      propertyType
    });

    const vehicleWhere = buildVehicleWhere({
      query,
      location,
      checkIn,
      checkOut,
      guests,
      minRating,
      maxPrice,
      minPrice,
      vehicleType
    });

    const tourWhere = buildTourWhere({
      query,
      location,
      checkIn,
      checkOut,
      guests,
      minRating,
      maxPrice,
      minPrice,
      tourType
    });

    // Execute searches in parallel
    const [properties, vehicles, tours] = await Promise.all([
      searchProperties(propertyWhere, sortBy, limit, offset),
      searchVehicles(vehicleWhere, sortBy, limit, offset),
      searchTours(tourWhere, sortBy, limit, offset)
    ]);

    // Combine and sort results
    const allResults = [...properties, ...vehicles, ...tours];
    const sortedResults = sortSearchResults(allResults, sortBy);

    // Apply pagination
    const paginatedResults = sortedResults.slice(offset, offset + limit);

    // Get filter options
    const filterOptions = await getFilterOptions(filters);

    return {
      results: paginatedResults,
      total: allResults.length,
      hasMore: offset + limit < allResults.length,
      filters: filterOptions
    };

  } catch (error) {
    console.error("Error in searchServices:", error);
    throw new Error("Search failed");
  }
}

/**
 * Build where clause for property search
 */
function buildPropertyWhere(filters: any) {
  const where: any = {
    isActive: true,
    isApproved: true
  };

  // Text search
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { location: { contains: filters.query, mode: 'insensitive' } }
    ];
  }

  // Location filter
  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  // Rating filter
  if (filters.minRating > 0) {
    where.averageRating = { gte: filters.minRating };
  }

  // Price filter
  if (filters.minPrice || filters.maxPrice) {
    where.basePrice = {};
    if (filters.minPrice) where.basePrice.gte = filters.minPrice;
    if (filters.maxPrice) where.basePrice.lte = filters.maxPrice;
  }

  // Property type filter
  if (filters.propertyType) {
    where.type = filters.propertyType;
  }

  // Availability filter (simplified - would need actual availability check)
  if (filters.checkIn && filters.checkOut) {
    // This would need to check against existing bookings
    // For now, we'll just ensure the property is available
    where.isActive = true;
  }

  return where;
}

/**
 * Build where clause for vehicle search
 */
function buildVehicleWhere(filters: any) {
  const where: any = {
    isActive: true,
    isApproved: true
  };

  // Text search
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { location: { contains: filters.query, mode: 'insensitive' } }
    ];
  }

  // Location filter
  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  // Rating filter
  if (filters.minRating > 0) {
    where.averageRating = { gte: filters.minRating };
  }

  // Price filter
  if (filters.minPrice || filters.maxPrice) {
    where.basePrice = {};
    if (filters.minPrice) where.basePrice.gte = filters.minPrice;
    if (filters.maxPrice) where.basePrice.lte = filters.maxPrice;
  }

  // Vehicle type filter
  if (filters.vehicleType) {
    where.type = filters.vehicleType;
  }

  return where;
}

/**
 * Build where clause for tour search
 */
function buildTourWhere(filters: any) {
  const where: any = {
    isActive: true,
    isApproved: true
  };

  // Text search
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { location: { contains: filters.query, mode: 'insensitive' } }
    ];
  }

  // Location filter
  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  // Rating filter
  if (filters.minRating > 0) {
    where.averageRating = { gte: filters.minRating };
  }

  // Price filter
  if (filters.minPrice || filters.maxPrice) {
    where.pricePerPerson = {};
    if (filters.minPrice) where.pricePerPerson.gte = filters.minPrice;
    if (filters.maxPrice) where.pricePerPerson.lte = filters.maxPrice;
  }

  // Tour type filter
  if (filters.tourType) {
    where.type = filters.tourType;
  }

  return where;
}

/**
 * Search properties with rating integration
 */
async function searchProperties(where: any, sortBy: string, limit: number, offset: number): Promise<SearchResult[]> {
  const properties = await prisma.property.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
          averageRating: true
        }
      },
      images: true,
      amenities: true
    },
    take: limit,
    skip: offset
  });

  return properties.map(property => ({
    id: property.id,
    type: 'property' as const,
    title: property.title,
    description: property.description,
    price: property.basePrice,
    rating: property.averageRating || 0,
    reviewCount: property.totalReviews || 0,
    image: property.images[0] || '',
    location: property.location,
    provider: {
      id: property.owner.id,
      name: property.owner.name,
      avatar: property.owner.avatar,
      rating: property.owner.averageRating || 0
    },
    availability: true, // Simplified
    amenities: property.amenities.map(a => a.name)
  }));
}

/**
 * Search vehicles with rating integration
 */
async function searchVehicles(where: any, sortBy: string, limit: number, offset: number): Promise<SearchResult[]> {
  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
          averageRating: true
        }
      },
      images: true,
      features: true
    },
    take: limit,
    skip: offset
  });

  return vehicles.map(vehicle => ({
    id: vehicle.id,
    type: 'vehicle' as const,
    title: vehicle.name,
    description: vehicle.description,
    price: vehicle.basePrice,
    rating: vehicle.averageRating || 0,
    reviewCount: vehicle.totalReviews || 0,
    image: vehicle.images[0] || '',
    location: vehicle.location,
    provider: {
      id: vehicle.owner.id,
      name: vehicle.owner.name,
      avatar: vehicle.owner.avatar,
      rating: vehicle.owner.averageRating || 0
    },
    availability: true, // Simplified
    features: vehicle.features.map(f => f.name)
  }));
}

/**
 * Search tours with rating integration
 */
async function searchTours(where: any, sortBy: string, limit: number, offset: number): Promise<SearchResult[]> {
  const tours = await prisma.tour.findMany({
    where,
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          avatar: true,
          averageRating: true
        }
      },
      images: true,
      features: true
    },
    take: limit,
    skip: offset
  });

  return tours.map(tour => ({
    id: tour.id,
    type: 'tour' as const,
    title: tour.title,
    description: tour.description,
    price: tour.pricePerPerson,
    rating: tour.averageRating || 0,
    reviewCount: tour.totalReviews || 0,
    image: tour.images[0] || '',
    location: tour.location,
    provider: {
      id: tour.guide.id,
      name: tour.guide.name,
      avatar: tour.guide.avatar,
      rating: tour.guide.averageRating || 0
    },
    availability: true, // Simplified
    features: tour.features.map(f => f.name)
  }));
}

/**
 * Sort search results based on criteria
 */
function sortSearchResults(results: SearchResult[], sortBy: string): SearchResult[] {
  switch (sortBy) {
    case 'rating':
      return results.sort((a, b) => {
        // Sort by rating (descending), then by review count
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviewCount - a.reviewCount;
      });

    case 'price_low':
      return results.sort((a, b) => a.price - b.price);

    case 'price_high':
      return results.sort((a, b) => b.price - a.price);

    case 'newest':
      return results.sort((a, b) => {
        // This would need creation date in the results
        return 0; // Placeholder
      });

    case 'relevance':
    default:
      return results.sort((a, b) => {
        // Boost highly-rated services in default search
        const ratingBoost = (b.rating * 0.3) - (a.rating * 0.3);
        const reviewBoost = (b.reviewCount * 0.1) - (a.reviewCount * 0.1);
        return ratingBoost + reviewBoost;
      });
  }
}

/**
 * Get filter options for search
 */
async function getFilterOptions(filters: SearchFilters) {
  // Get price range
  const priceStats = await prisma.$queryRaw`
    SELECT 
      MIN(COALESCE(p.base_price, 0)) as min_price,
      MAX(COALESCE(p.base_price, 0)) as max_price
    FROM (
      SELECT base_price FROM properties WHERE is_active = true AND is_approved = true
      UNION ALL
      SELECT base_price FROM vehicles WHERE is_active = true AND is_approved = true
      UNION ALL
      SELECT price_per_person FROM tours WHERE is_active = true AND is_approved = true
    ) p
  `;

  // Get rating range
  const ratingStats = await prisma.$queryRaw`
    SELECT 
      MIN(COALESCE(p.average_rating, 0)) as min_rating,
      MAX(COALESCE(p.average_rating, 0)) as max_rating
    FROM (
      SELECT average_rating FROM properties WHERE is_active = true AND is_approved = true
      UNION ALL
      SELECT average_rating FROM vehicles WHERE is_active = true AND is_approved = true
      UNION ALL
      SELECT average_rating FROM tours WHERE is_active = true AND is_approved = true
    ) p
  `;

  // Get unique locations
  const locations = await prisma.$queryRaw`
    SELECT DISTINCT location FROM (
      SELECT location FROM properties WHERE is_active = true AND is_approved = true
      UNION ALL
      SELECT location FROM vehicles WHERE is_active = true AND is_approved = true
      UNION ALL
      SELECT location FROM tours WHERE is_active = true AND is_approved = true
    ) locations
    ORDER BY location
  `;

  return {
    priceRange: {
      min: priceStats[0]?.min_price || 0,
      max: priceStats[0]?.max_price || 1000
    },
    ratingRange: {
      min: ratingStats[0]?.min_rating || 0,
      max: ratingStats[0]?.max_rating || 5
    },
    locations: locations.map((l: any) => l.location),
    types: ['property', 'vehicle', 'tour']
  };
}

// ========================================
// RATING-BOOSTED SEARCH
// ========================================

/**
 * Boost highly-rated services in search results
 */
export function boostHighRatedServices(results: SearchResult[]): SearchResult[] {
  return results.map(result => {
    let boost = 0;

    // Boost for high ratings
    if (result.rating >= 4.5) {
      boost += 0.3;
    } else if (result.rating >= 4.0) {
      boost += 0.2;
    } else if (result.rating >= 3.5) {
      boost += 0.1;
    }

    // Boost for review count (social proof)
    if (result.reviewCount >= 50) {
      boost += 0.2;
    } else if (result.reviewCount >= 20) {
      boost += 0.1;
    } else if (result.reviewCount >= 5) {
      boost += 0.05;
    }

    // Boost for provider rating
    if (result.provider.rating >= 4.5) {
      boost += 0.1;
    }

    return {
      ...result,
      relevanceScore: boost
    };
  });
}

/**
 * Filter by minimum rating
 */
export function filterByMinimumRating(results: SearchResult[], minRating: number): SearchResult[] {
  return results.filter(result => result.rating >= minRating);
}

/**
 * Get trending services (highly rated with recent activity)
 */
export async function getTrendingServices(limit: number = 10): Promise<SearchResult[]> {
  try {
    // Get services with high ratings and recent reviews
    const trendingProperties = await prisma.property.findMany({
      where: {
        isActive: true,
        isApproved: true,
        averageRating: { gte: 4.0 },
        totalReviews: { gte: 5 }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            averageRating: true
          }
        },
        images: true
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' }
      ],
      take: limit
    });

    return trendingProperties.map(property => ({
      id: property.id,
      type: 'property' as const,
      title: property.title,
      description: property.description,
      price: property.basePrice,
      rating: property.averageRating || 0,
      reviewCount: property.totalReviews || 0,
      image: property.images[0] || '',
      location: property.location,
      provider: {
        id: property.owner.id,
        name: property.owner.name,
        avatar: property.owner.avatar,
        rating: property.owner.averageRating || 0
      },
      availability: true
    }));
  } catch (error) {
    console.error("Error getting trending services:", error);
    return [];
  }
}
