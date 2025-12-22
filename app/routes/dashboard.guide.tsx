import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    if (!user) {
      throw redirect("/login");
    }

    // Allow access but show appropriate message if not tour guide
    if (user.role !== "TOUR_GUIDE") {
      return json({
        user,
        guide: null,
        tours: [],
        bookings: [],
        error: "Access restricted to tour guides",
      });
    }

    const guide = await prisma.tourGuide.findUnique({
      where: { userId },
      select: { id: true, firstName: true, lastName: true, verified: true },
    });
    if (!guide) {
      return json({ user, guide: null, tours: [], bookings: [], error: null });
    }

    // Get tour guide's bookings
    const bookings = await prisma.tourBooking.findMany({
      where: {
        tour: { guideId: guide.id },
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
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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

    // Calculate financial statistics
    const confirmedCompletedBookings = bookings.filter(b => 
      b.status === "CONFIRMED" || b.status === "COMPLETED"
    );
    
    const totalRevenue = confirmedCompletedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    // Calculate commission (10% default rate)
    const commissionRate = 0.1;
    const totalCommission = totalRevenue * commissionRate;
    const netRevenue = totalRevenue - totalCommission;
    
    // Get commissions from database
    const commissions = await prisma.commission.findMany({
      where: {
        tourGuideId: guide.id,
        bookingType: "tour"
      },
      select: {
        amount: true,
        status: true,
        calculatedAt: true
      }
    });
    
    const pendingCommissions = commissions
      .filter(c => c.status === "PENDING")
      .reduce((sum, c) => sum + c.amount, 0);
    
    const paidCommissions = commissions
      .filter(c => c.status === "PAID")
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Monthly revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = confirmedCompletedBookings
      .filter(b => new Date(b.createdAt) >= startOfMonth)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const monthlyCommission = monthlyRevenue * commissionRate;
    const monthlyNet = monthlyRevenue - monthlyCommission;

    return json({ 
      user, 
      guide, 
      tours, 
      bookings,
      // Financial data
      totalRevenue,
      totalCommission,
      netRevenue,
      pendingCommissions,
      paidCommissions,
      monthlyRevenue,
      monthlyCommission,
      monthlyNet,
      error: null 
    });
  } catch (error) {
    console.error("Error in tour guide dashboard loader:", error);
    return json({
      user: null,
      guide: null,
      tours: [],
      bookings: [],
      error: "Failed to load dashboard data",
    });
  }
}

export default function TourGuideLayout() {
  const { error } = useLoaderData<typeof loader>();

  // Show error if user doesn't have access
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Access Restricted
          </h1>
          <p className="text-gray-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Render child routes (index, bookings, reviews, profile)
  return <Outlet />;
}
