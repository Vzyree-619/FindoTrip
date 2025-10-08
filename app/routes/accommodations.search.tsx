import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { useState } from "react";
import { getProperties } from "~/lib/db/db.server";
import PropertyCard from "~/components/features/accommodations/PropertyCard";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

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
  
  const checkInStr = url.searchParams.get("checkIn");
  const checkOutStr = url.searchParams.get("checkOut");
  const checkIn = checkInStr ? new Date(checkInStr) : undefined;
  const checkOut = checkOutStr ? new Date(checkOutStr) : undefined;

  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    const accommodations = await getProperties({
      city,
      country,
      type,
      minPrice,
      maxPrice,
      checkIn,
      checkOut,
      guests,
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = accommodations.slice(startIndex, endIndex);

    return json({
      accommodations: paginatedResults,
      pagination: {
        page,
        limit,
        total: accommodations.length,
        totalPages: Math.ceil(accommodations.length / limit),
      },
      filters: { 
        city: city || null, 
        country: country || null, 
        type: type || null, 
        minPrice: minPrice || null, 
        maxPrice: maxPrice || null, 
        guests: guests || null, 
        checkIn: checkInStr || null, 
        checkOut: checkOutStr || null 
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return json({
      accommodations: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
      filters: { 
        city: null, 
        country: null, 
        type: null, 
        minPrice: null, 
        maxPrice: null, 
        guests: null, 
        checkIn: null, 
        checkOut: null 
      },
    });
  }
}

export default function AccommodationSearch() {
  const { accommodations, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {filters.city || "All"} Stays
              </h1>
              <p className="text-gray-600 mt-1">
                {pagination.total} properties found
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-lg"
            >
              <SlidersHorizontal size={20} />
              Filters
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#01502E]">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900">Search Results</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } md:block w-full md:w-64 bg-white rounded-lg shadow-md p-6 h-fit sticky top-4`}
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Filters</h2>

            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={filters.type || ""}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="HOTEL">Hotel</option>
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa</option>
                <option value="RESORT">Resort</option>
                <option value="HOSTEL">Hostel</option>
                <option value="LODGE">Lodge</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (per night)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guests
              </label>
              <input
                type="number"
                min="1"
                placeholder="Number of guests"
                value={filters.guests || ""}
                onChange={(e) => handleFilterChange("guests", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setSearchParams({})}
              className="w-full py-2 text-sm text-[#01502E] border border-[#01502E] rounded-md hover:bg-[#01502E] hover:text-white transition"
            >
              Clear All Filters
            </button>
          </aside>

          {/* Results Grid */}
          <main className="flex-1">
            {accommodations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23]"
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <>
                {/* Property Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {accommodations.map((property: any) => (
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            pageNum === pagination.page
                              ? "bg-[#01502E] text-white"
                              : "border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
