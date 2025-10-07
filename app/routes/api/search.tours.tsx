import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const destination = url.searchParams.get("destination");
  const date = url.searchParams.get("date");
  const guests = url.searchParams.get("guests");
  const type = url.searchParams.get("type");

  try {
    // Build search criteria
    const whereClause: any = {
      isActive: true,
      approvalStatus: "APPROVED",
    };

    // Add destination filter if provided
    if (destination) {
      whereClause.$or = [
        {
          title: {
            $regex: destination,
            $options: "i", // case insensitive
          },
        },
        {
          description: {
            $regex: destination,
            $options: "i",
          },
        },
        {
          locations: {
            $in: [new RegExp(destination, "i")],
          },
        },
      ];
    }

    // Add tour type filter if provided
    if (type) {
      whereClause.type = type.toUpperCase();
    }

    // Add guest capacity filter if provided
    if (guests) {
      const guestCount = parseInt(guests);
      if (guestCount > 0) {
        whereClause.maxParticipants = {
          $gte: guestCount,
        };
      }
    }

    // Search tours
    const tours = await prisma.tour.findMany({
      where: whereClause,
      include: {
        guide: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
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
    const toursWithRatings = tours.map(tour => {
      const avgRating = tour.reviews.length > 0
        ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
        : 0;

      return {
        ...tour,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: tour.reviews.length,
      };
    });

    return json({
      success: true,
      tours: toursWithRatings,
      total: toursWithRatings.length,
      searchParams: {
        destination,
        date,
        guests,
        type,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return json(
      {
        success: false,
        error: "Failed to search tours",
        tours: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
