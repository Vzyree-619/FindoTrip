import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city");
  const name = url.searchParams.get("name");
  const checkIn = url.searchParams.get("checkIn");
  const checkOut = url.searchParams.get("checkOut");
  const adults = url.searchParams.get("adults");
  const children = url.searchParams.get("children");
  const rooms = url.searchParams.get("rooms");

  try {
    // Build search criteria
    const whereClause: any = {
      isActive: true,
      approvalStatus: "APPROVED",
    };

    // Add city filter if provided
    if (city) {
      whereClause.city = {
        $regex: city,
        $options: "i", // case insensitive
      };
    }

    // Add name filter if provided
    if (name) {
      whereClause.name = {
        $regex: name,
        $options: "i", // case insensitive
      };
    }

    // Add guest capacity filter if provided
    if (adults || children) {
      const totalGuests = (parseInt(adults || "0") + parseInt(children || "0"));
      if (totalGuests > 0) {
        whereClause.maxGuests = {
          $gte: totalGuests,
        };
      }
    }

    // Search accommodations
    const accommodations = await prisma.property.findMany({
      where: whereClause,
      include: {
        owner: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        amenities: true,
        images: true,
        reviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average ratings
    const accommodationsWithRatings = accommodations.map(accommodation => {
      const avgRating = accommodation.reviews.length > 0
        ? accommodation.reviews.reduce((sum, review) => sum + review.rating, 0) / accommodation.reviews.length
        : 0;

      return {
        ...accommodation,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: accommodation.reviews.length,
      };
    });

    return json({
      success: true,
      accommodations: accommodationsWithRatings,
      total: accommodationsWithRatings.length,
      searchParams: {
        city,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return json(
      {
        success: false,
        error: "Failed to search accommodations",
        accommodations: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}