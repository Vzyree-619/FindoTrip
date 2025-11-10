import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { prisma } from "~/lib/db/db.server";
import PropertyCard from "~/components/features/accommodations/PropertyCard";
import PriceRangeSlider from "~/components/common/PriceRangeSlider";
import { ChevronLeft, ChevronRight, Search, MapPin, Filter } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  const city = url.searchParams.get("city") || undefined;
  const country = url.searchParams.get("country") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const name = url.searchParams.get("name") || undefined;
  const minPrice = url.searchParams.get("minPrice") 
    ? parseFloat(url.searchParams.get("minPrice")!) 
    : undefined;
  const maxPrice = url.searchParams.get("maxPrice") 
    ? parseFloat(url.searchParams.get("maxPrice")!) 
    : undefined;
  const guests = url.searchParams.get("guests") 
    ? parseInt(url.searchParams.get("guests")!) 
    : undefined;
  const checkIn = url.searchParams.get("checkIn") 
    ? new Date(url.searchParams.get("checkIn")!) 
    : undefined;
  const checkOut = url.searchParams.get("checkOut") 
    ? new Date(url.searchParams.get("checkOut")!) 
    : undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  // Server-side validation for dates
  if (checkIn && checkOut) {
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      throw new Response('Invalid date range for stay search', { status: 400 });
    }
  }

  try {
    // Build base where clause (without price) for computing bounds
    const baseWhere: any = {
      approvalStatus: 'APPROVED',
      available: true
    };

    if (city) {
      baseWhere.city = { contains: city, mode: 'insensitive' };
    }

    if (country) {
      baseWhere.country = { contains: country, mode: 'insensitive' };
    }

    if (type) {
      baseWhere.type = type;
    }

    if (name) {
      baseWhere.name = { contains: name, mode: 'insensitive' };
    }

    // Smart search: if we have a search term but no specific name/city, search both
    const searchTerm = url.searchParams.get("search");
    if (searchTerm && !name && !city) {
      baseWhere.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    if (guests) {
      baseWhere.maxGuests = { gte: guests };
    }

    // Compute dynamic price bounds for the current filter context
    const priceAgg = await prisma.property.aggregate({
      where: baseWhere,
      _min: { basePrice: true },
      _max: { basePrice: true },
    });
    let boundsMin = (priceAgg._min.basePrice as number | null) ?? 0;
    let boundsMax = (priceAgg._max.basePrice as number | null) ?? 50000;
    if (boundsMin === boundsMax) {
      // Expand trivial range slightly for a usable slider
      boundsMin = Math.max(0, boundsMin - 1000);
      boundsMax = boundsMax + 1000;
    }

    // Apply price filters to the actual query where clause
    const where: any = { ...baseWhere };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    // Get accommodations
    // Safe room type counts even if prisma client is stale or delegate unsupported
    const roomTypeCountsPromise = (async () => {
      try {
        const anyPrisma: any = prisma as any;
        if (anyPrisma.roomType && typeof anyPrisma.roomType.groupBy === 'function') {
          return await anyPrisma.roomType.groupBy({ by: ['propertyId'], _count: { _all: true } });
        }
      } catch {}
      return [] as any[];
    })();

    const [accommodationsRaw, total, types, cities, roomTypeCounts] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              businessName: true,
              verified: true,
              user: {
                select: {
                  name: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: { rating: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.property.count({ where }),
      prisma.property.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { type: true },
        distinct: ['type']
      }),
      prisma.property.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { city: true, country: true },
        distinct: ['city', 'country']
      }),
      roomTypeCountsPromise
    ]);
    const countsMap = new Map(
      (roomTypeCounts as any[]).map((r: any) => {
        const cnt = ((r._count?._all ?? r?._count) || 0);
        return [r.propertyId, cnt];
      })
    );
    const accommodations = accommodationsRaw.map((p: any) => ({ ...p, roomTypeCount: countsMap.get(p.id) || 0 }));
    // Fallback only when no filters are active; otherwise return empty results
    const hasActiveFilters = Boolean(
      city || country || type || name || searchTerm || (minPrice !== undefined) || (maxPrice !== undefined) || guests || checkIn || checkOut
    );
    if ((accommodations.length === 0 || total === 0) && !hasActiveFilters) {
      const demoCities = [
        { city: 'Islamabad', country: 'Pakistan' },
        { city: 'Lahore', country: 'Pakistan' },
        { city: 'Karachi', country: 'Pakistan' },
        { city: 'Murree', country: 'Pakistan' },
        { city: 'Hunza', country: 'Pakistan' }
      ];
      const adjectives = ['Sunrise', 'Emerald', 'Oakwood', 'Cedar', 'Blue Sky'];
      const nouns = ['Hotel', 'Suites', 'Residency', 'Lodge'];
      const typesDemo = ['HOTEL','APARTMENT','VILLA','RESORT','HOSTEL','LODGE'];
      const mkName = (i: number) => `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${demoCities[i % demoCities.length].city}`;
      const demo = Array.from({ length: 8 }).map((_, i) => {
        const basePrice = 5000 + (i * 750);
        const loc = demoCities[i % demoCities.length];
        return {
          id: `demo-${i+1}`,
          name: mkName(i),
          description: 'A lovely stay with comfortable rooms and friendly service.',
          type: typesDemo[i % typesDemo.length],
          address: 'Main Road',
          city: loc.city,
          country: loc.country,
          maxGuests: 4,
          bedrooms: 2,
          bathrooms: 1,
          basePrice,
          rating: 4.2 + (i % 3) * 0.2,
          reviewCount: 10 + i,
          images: ['/landingPageImg.jpg'],
          owner: {
            id: `owner-demo-${i+1}`,
            businessName: 'Demo Hospitality Co.',
            verified: true,
            user: { name: 'Demo Owner', avatar: null }
          },
          roomTypeCount: 3
        };
      });
      const filtersOut = {
        types: Array.from(new Set(demo.map(d => d.type))),
        cities: Array.from(new Set(demo.map(d => `${d.city}, ${d.country}`)))
      };
      return json({
        accommodations: demo,
        total: demo.length,
        page: 1,
        limit,
        totalPages: 1,
        filters: filtersOut,
        priceBounds: { min: 0, max: 50000 },
        searchParams: {
          city,
          country,
          type,
          name,
          search: url.searchParams.get("search") || undefined,
          minPrice,
          maxPrice,
          guests,
          checkIn: checkIn?.toISOString().split('T')[0],
          checkOut: checkOut?.toISOString().split('T')[0]
        }
      });
    }
    if ((accommodations.length === 0 || total === 0) && hasActiveFilters) {
      return json({
        accommodations: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        filters: {
          types: types.map(t => t.type),
          cities: cities.map(c => `${c.city}, ${c.country}`)
        },
        priceBounds: { min: boundsMin, max: boundsMax },
        searchParams: {
          city,
          country,
          type,
          name,
          search: url.searchParams.get("search") || undefined,
          minPrice,
          maxPrice,
          guests,
          checkIn: checkIn?.toISOString().split('T')[0],
          checkOut: checkOut?.toISOString().split('T')[0]
        }
      });
    }

    return json({
      accommodations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        types: types.map(t => t.type),
        cities: cities.map(c => `${c.city}, ${c.country}`)
      },
      priceBounds: { min: boundsMin, max: boundsMax },
      searchParams: {
        city,
        country,
        type,
        name,
        search: url.searchParams.get("search") || undefined,
        minPrice,
        maxPrice,
        guests,
        checkIn: checkIn?.toISOString().split('T')[0],
        checkOut: checkOut?.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error loading accommodations:', error);
    throw new Response('Failed to load accommodations', { status: 500 });
  }
}

export default function AccommodationsPage() {
  const { accommodations, total, page, totalPages, filters, priceBounds } = useLoaderData<typeof loader>();
  const [searchParams_, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Update search input when URL parameters change
  useEffect(() => {
    const searchValue = searchParams_.get("search") || searchParams_.get("name") || searchParams_.get("city") || '';
    setSearchInput(searchValue);
  }, [searchParams_]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (key: string, value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const newParams = new URLSearchParams(searchParams_);
          if (value && value.trim()) {
            newParams.set(key, value.trim());
          } else {
            newParams.delete(key);
          }
          newParams.set('page', '1');
          setSearchParams(newParams);
        }, 300);
      };
    })(),
    [searchParams_, setSearchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    // Validate numeric inputs
    if (key === 'minPrice' || key === 'maxPrice') {
      const numValue = parseFloat(value);
      if (value && (isNaN(numValue) || numValue < 0)) {
        return; // Don't update if invalid
      }
    }

    // For guests, allow empty string and positive integers
    if (key === 'guests') {
      if (value && value.trim()) {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 20) {
          return; // Don't update if invalid
        }
      }
    }

    const newParams = new URLSearchParams(searchParams_);
    if (value && value.trim()) {
      newParams.set(key, value.trim());
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    // Use smart search that searches both name and city
    if (value.trim()) {
      debouncedSearch('search', value);
    } else {
      // Clear all search parameters if empty
      const newParams = new URLSearchParams(searchParams_);
      newParams.delete('search');
      newParams.delete('name');
      newParams.delete('city');
      newParams.set('page', '1');
      setSearchParams(newParams);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const activeFilters = useMemo(() => 
    Array.from(searchParams_.entries()).filter(([key, value]) => 
      key !== 'page' && value && value.trim()
    ), [searchParams_]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#01502E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Discover amazing accommodations across Pakistan with FindoTrip
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <span className="bg-white text-[#01502E] text-xs rounded-full px-2 py-1">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className={`w-full lg:w-80 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Filters</h2>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="City or hotel name..."
                    value={searchInput}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mb-6">
                <PriceRangeSlider
                  minPrice={priceBounds?.min ?? 0}
                  maxPrice={priceBounds?.max ?? 50000}
                  currentMin={(() => {
                    const v = parseInt(searchParams_.get("minPrice") || "");
                    if (isNaN(v)) return priceBounds?.min ?? 0;
                    return Math.max(priceBounds?.min ?? 0, Math.min(v, priceBounds?.max ?? v));
                  })()}
                  currentMax={(() => {
                    const v = parseInt(searchParams_.get("maxPrice") || "");
                    if (isNaN(v)) return priceBounds?.max ?? 50000;
                    return Math.min(priceBounds?.max ?? 50000, Math.max(v, priceBounds?.min ?? 0));
                  })()}
                  onRangeChange={(min, max) => {
                    const newParams = new URLSearchParams(searchParams_);
                    newParams.set("minPrice", min.toString());
                    newParams.set("maxPrice", max.toString());
                    newParams.set("page", "1");
                    setSearchParams(newParams);
                  }}
                  currency="PKR"
                  step={Math.max(100, Math.round(((priceBounds?.max ?? 50000) - (priceBounds?.min ?? 0)) / 40))}
                />
              </div>

              {/* Guests */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  placeholder="Number of guests"
                  value={searchParams_.get("guests") || ""}
                  onChange={(e) => handleFilterChange("guests", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              {/* Property Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  value={searchParams_.get("type") || ""}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {filters.types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={searchParams_.get("country") || ""}
                  onChange={(e) => handleFilterChange("country", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {filters.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content - Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {total} properties found
                </h2>
                {activeFilters.length > 0 && (
                  <p className="text-gray-600">
                    Filtered by {activeFilters.map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Properties Grid */}
            {accommodations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or browse all properties
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-[#01502E] text-white px-6 py-2 rounded-lg hover:bg-[#013d23] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accommodations.map((property) => (
                  <PropertyCard 
                    key={property.id}
                    id={property.id}
                    name={property.name}
                    city={property.city}
                    country={property.country}
                    type={property.type}
                    pricePerNight={property.basePrice}
                    maxGuests={property.maxGuests}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    images={property.images}
                    rating={property.rating}
                    reviewCount={property.reviewCount}
                    amenities={property.amenities}
                    roomTypeCount={property.roomTypeCount}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams_);
                      newParams.set('page', (page - 1).toString());
                      setSearchParams(newParams);
                    }}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams_);
                      newParams.set('page', (page + 1).toString());
                      setSearchParams(newParams);
                    }}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
