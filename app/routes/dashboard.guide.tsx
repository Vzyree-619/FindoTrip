import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
    if (!user) {
      throw redirect("/login");
    }

    // Allow access but show appropriate message if not tour guide
    if (user.role !== "TOUR_GUIDE") {
      return json({ user, guide: null, tours: [], bookings: [], error: "Access restricted to tour guides" });
    }

    const guide = await prisma.tourGuide.findUnique({ where: { userId }, select: { id: true, firstName: true, lastName: true, verified: true } });
    if (!guide) {
      return json({ user, guide: null, tours: [], bookings: [], error: null });
    }

    // Get tour guide's bookings
    const bookings = await prisma.tourBooking.findMany({
      where: { 
        tour: { guideId: guide.id }
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            pricePerPerson: true,
            duration: true,
            images: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Get tour guide's tours
    const tours = await prisma.tour.findMany({
      where: { guideId: guide.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        country: true,
        pricePerPerson: true,
        maxGroupSize: true,
        duration: true,
        rating: true,
        reviewCount: true,
        approvalStatus: true,
        available: true,
        images: true,
      },
    });

    return json({ user, guide, tours, bookings, error: null });
  } catch (error) {
    console.error("Error in tour guide dashboard loader:", error);
    return json({ 
      user: null, 
      guide: null, 
      tours: [], 
      bookings: [], 
      error: "Failed to load dashboard data" 
    });
  }
}

export default function TourGuideLayout() {
  const { error } = useLoaderData<typeof loader>();

  // Show error if user doesn't have access
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  // Render child routes (index, bookings, reviews, profile)
  return <Outlet />;
}
