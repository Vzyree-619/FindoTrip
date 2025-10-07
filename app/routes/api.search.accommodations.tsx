import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getAccommodations } from "~/lib/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Extract search parameters
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
  
  // Parse details
  const checkInStr = url.searchParams.get("checkIn");
  const checkOutStr = url.searchParams.get("checkOut");
  const checkIn = checkInStr ? new Date(checkInStr) : undefined;
  const checkOut = checkOutStr ? new Date(checkOutStr) : undefined;

  // Pagination
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "12");

  try {
    const accommodations = await getAccommodations({
      city,
      country,
      type,
      minPrice,
      maxPrice,
      checkIn,
      checkOut,
      guests,
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = accommodations.slice(startIndex, endIndex);

    return json({
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total: accommodations.length,
        totalPages: Math.ceil(accommodations.length / limit),
        hasMore: endIndex < accommodations.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return json(
      { success: false, error: "Failed to search accommodations" },
      { status: 500 }
    );
  }
}
