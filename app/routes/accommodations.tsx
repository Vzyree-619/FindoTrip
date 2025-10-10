import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { useState, useCallback, useMemo } from "react";
import { prisma } from "~/lib/db/db.server";
import PropertyCard from "~/components/features/accommodations/PropertyCard";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Search, MapPin, Calendar, Users } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  const city = url.searchParams.get("city") || undefined;
  const country = url.searchParams.get("country") || undefined;
  const type = url.searchParams.get("type") || undefined;
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
    // Build where clause
    const where: any = {
      approvalStatus: 'APPROVED',
      available: true
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (country) {
      where.country = { contains: country, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (guests) {
      where.maxGuests = { gte: guests };
    }

    // Get accommodations
    const [accommodations, total, types, cities] = await Promise.all([
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
      })
    ]);

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
      searchParams: {
        city,
        country,
        type,
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
  const { accommodations, total, page, totalPages, filters, searchParams } = useLoaderData<typeof loader>();
  const [searchParams_, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.city || '');

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
    if (key === 'minPrice' || key === 'maxPrice' || key === 'guests') {
      const numValue = parseFloat(value);
      if (value && (isNaN(numValue) || numValue < 0)) {
        return; // Don't update if invalid
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
    debouncedSearch('city', value);
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
      <div className="bg-gradient-to-r from-[#01502E] to-[#047857] text-white">
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
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by city, country, or property name..."
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="bg-[#01502E] text-white text-xs rounded-full px-2 py-1">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    value={searchParams.type || ""}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {filters.types.map(type => (
                      <option key={type} value={type}>{type}</option>
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
                      min="0"
                      step="100"
                      placeholder="Min Price"
                      value={searchParams.minPrice || ""}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="Max Price"
                      value={searchParams.maxPrice || ""}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    placeholder="Number of guests"
                    value={searchParams.guests || ""}
                    onChange={(e) => handleFilterChange("guests", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={searchParams.country || ""}
                    onChange={(e) => handleFilterChange("country", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {filters.cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilters.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-[#01502E] hover:text-[#013d23] font-medium"
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
  );
}
