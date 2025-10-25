import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Plus, CheckCircle2, MapPin, Users, Star, Clock, AlertCircle, Info, MessageCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
  if (!user) throw redirect("/login");

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
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  // Handle tour creation logic here
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;
  const pricePerPerson = parseFloat(formData.get("pricePerPerson") as string || "0");
  const maxGroupSize = parseInt(formData.get("maxGroupSize") as string || "10");
  const duration = parseInt(formData.get("duration") as string || "1");
  const highlights = formData.get("highlights") as string;

  if (!title || !description || !city || !country || !pricePerPerson || !duration) {
    return json({ error: "All required fields must be filled" }, { status: 400 });
  }

  try {
    // Get tour guide
    const guide = await prisma.tourGuide.findUnique({ where: { userId } });
    if (!guide) {
      return json({ error: "Tour guide profile not found" }, { status: 400 });
    }

    // Check if guide is verified
    if (!guide.verified) {
      return json({ error: "Your account must be verified before creating tours" }, { status: 400 });
    }

    const created = await prisma.tour.create({
      data: {
        title,
        description,
        city,
        country,
        pricePerPerson,
        maxGroupSize,
        minGroupSize: 1,
        duration,
        // Required fields
        type: "CITY_TOUR",
        category: "CULTURAL",
        groupSize: maxGroupSize,
        difficulty: "easy",
        meetingPoint: city || "TBD",
        languages: ["en"],
        inclusions: highlights ? highlights.split(",").map(h => h.trim()) : [],
        guideId: guide.id,
        approvalStatus: "PENDING",
        available: false,
        images: ["/placeholder-tour.jpg"],
        rating: 0,
        reviewCount: 0,
        totalBookings: 0,
        viewCount: 0,
        favoriteCount: 0,
      },
    });

    // Notify admins about pending tour approval
    const admins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true, role: true } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          userRole: a.role,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "New Tour Pending Approval",
          message: `Tour "${created.title}" has been submitted and awaits review`,
          data: { tourId: created.id }
        }))
      });
    }

    // Redirect to revalidate dashboard lists and banners
    return redirect("/dashboard/guide?submitted=1");
  } catch (error) {
    console.error("Tour creation error:", error);
    return json({ error: "Failed to create tour" }, { status: 500 });
  }
}

export default function TourGuideDashboard() {
  const { user, guide, tours, bookings, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";

  // Show error if user doesn't have access
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-md">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if guide is verified (all tours approved)
  const safeTours = tours || [];
  const safeBookings = bookings || [];
  const isVerified = guide?.verified || safeTours.every((t: any) => t.approvalStatus === "APPROVED");
  const hasPendingApprovals = safeTours.some((t: any) => t.approvalStatus === "PENDING");
  const hasRejectedItems = safeTours.some((t: any) => t.approvalStatus === "REJECTED");

  // Categorize bookings
  const now = new Date();
  const upcomingBookings = safeBookings.filter((booking: any) => {
    if (booking.status !== "CONFIRMED") return false;
    const tourDate = new Date(booking.tourDate);
    return tourDate > now;
  });
  
  const pastBookings = safeBookings.filter((booking: any) => {
    if (booking.status === "COMPLETED") return true;
    if (booking.status !== "CONFIRMED") return false;
    const tourDate = new Date(booking.tourDate);
    return tourDate < now;
  });
  
  const cancelledBookings = safeBookings.filter((booking: any) => booking.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">Manage your current and past reservations</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/messages" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <MessageCircle className="w-4 h-4" /> Messages
            </Link>
            {isVerified && (
              <Link to="/dashboard/guide" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
                <Plus className="w-4 h-4" /> Manage Tours
              </Link>
            )}
          </div>
        </div>

        {/* Approval Status Banner */}
        {!isVerified && (
          <div className="mb-6 rounded-lg border p-4">
            {hasPendingApprovals ? (
              <div className="flex items-center gap-3 text-yellow-800 bg-yellow-50 p-3 rounded">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium">Awaiting Verification</h3>
                  <p className="text-sm">Your tours are being reviewed by our team. This usually takes 1-3 business days.</p>
                </div>
              </div>
            ) : hasRejectedItems ? (
              <div className="flex items-center gap-3 text-red-800 bg-red-50 p-3 rounded">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium">Verification Required</h3>
                  <p className="text-sm">Some of your tours were rejected. Please check the details and resubmit.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[#013d23] bg-[#01502E]/10 p-3 rounded">
                <Info className="h-5 w-5 text-[#01502E]" />
                <div>
                  <h3 className="font-medium">Complete Your Profile</h3>
                  <p className="text-sm">Create your first tour to get started with verification.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isVerified && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Verified Provider</h3>
                <p className="text-sm">Your account is fully verified. You can now manage all your tours.</p>
              </div>
            </div>
          </div>
        )}

        {(actionData && 'success' in actionData && actionData.success) || submitted ? (
          <div className="mb-6 rounded-md bg-green-50 p-4 flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" /> Tour created successfully and awaiting approval
          </div>
        ) : null}

        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" /> {actionData.error}
          </div>
        )}

        {/* Bookings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Past</p>
                <p className="text-2xl font-bold text-gray-900">{pastBookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledBookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          <div className="p-6">
            {safeBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any bookings yet. Once customers book your tours, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {safeBookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{booking.tour.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                            booking.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            booking.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.tourDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 text-gray-400">PKR</span>
                            PKR {booking.totalPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <strong>Customer:</strong> {booking.user.name} ({booking.user.email})
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          to={`/dashboard/messages`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {safeBookings.length > 5 && (
                  <div className="text-center pt-4">
                    <Link 
                      to="/tour-guide/bookings" 
                      className="inline-flex items-center px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#013d23]"
                    >
                      View All Bookings
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
