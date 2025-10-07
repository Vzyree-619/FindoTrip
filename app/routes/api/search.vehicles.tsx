import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const location = url.searchParams.get("location");
  const pickupDate = url.searchParams.get("pickupDate");
  const returnDate = url.searchParams.get("returnDate");
  const pickupTime = url.searchParams.get("pickupTime");

  try {
    // Build search criteria
    const whereClause: any = {
      isActive: true,
      approvalStatus: "APPROVED",
    };

    // Add location filter if provided
    if (location) {
      whereClause.$or = [
        {
          city: {
            $regex: location,
            $options: "i", // case insensitive
          },
        },
        {
          pickupLocation: {
            $regex: location,
            $options: "i",
          },
        },
      ];
    }

    // Search vehicles
    const vehicles = await prisma.vehicle.findMany({
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
        features: true,
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
    const vehiclesWithRatings = vehicles.map(vehicle => {
      const avgRating = vehicle.reviews.length > 0
        ? vehicle.reviews.reduce((sum, review) => sum + review.rating, 0) / vehicle.reviews.length
        : 0;

      return {
        ...vehicle,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: vehicle.reviews.length,
      };
    });

    return json({
      success: true,
      vehicles: vehiclesWithRatings,
      total: vehiclesWithRatings.length,
      searchParams: {
        location,
        pickupDate,
        returnDate,
        pickupTime,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return json(
      {
        success: false,
        error: "Failed to search vehicles",
        vehicles: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
