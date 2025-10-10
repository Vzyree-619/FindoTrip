import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Plus, CheckCircle2, MapPin, Users, Star, Clock, AlertCircle, Info } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
  if (!user) throw redirect("/login");

  // Allow access but show appropriate message if not tour guide
  if (user.role !== "TOUR_GUIDE") {
    return json({ user, guide: null, tours: [], error: "Access restricted to tour guides" });
  }

  const guide = await prisma.tourGuide.findUnique({ where: { userId }, select: { id: true, firstName: true, lastName: true, verified: true } });
  if (!guide) {
    return json({ user, guide: null, tours: [], error: null });
  }

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

  return json({ user, guide, tours, error: null });
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
  const { user, guide, tours, error } = useLoaderData<typeof loader>();
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
  const isVerified = guide?.verified || safeTours.every((t: any) => t.approvalStatus === "APPROVED");
  const hasPendingApprovals = safeTours.some((t: any) => t.approvalStatus === "PENDING");
  const hasRejectedItems = safeTours.some((t: any) => t.approvalStatus === "REJECTED");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tour Guide Dashboard</h1>
            <p className="text-gray-600">Welcome, {guide ? `${guide.firstName} ${guide.lastName}` : user.name}</p>
          </div>
          {isVerified && (
            <a href="#create" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
              <Plus className="w-4 h-4" /> Create Tour
            </a>
          )}
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

        {/* Tours Grid */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#01502E]" />
            <h2 className="text-lg font-semibold">My Tours</h2>
          </div>
          {safeTours.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tours</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isVerified ? "Get started by creating your first tour." : "Complete verification to start creating tours."}
              </p>
              {isVerified && (
                <div className="mt-6">
                  <a href="#create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23]">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tour
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeTours.map((tour: any) => (
                <div key={tour.id} className="border rounded-lg overflow-hidden">
                  <img src={tour.images?.[0] || "/placeholder-tour.jpg"} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{tour.title}</h3>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {tour.city}, {tour.country}
                        </div>
                      </div>
                      <span className="text-sm px-2 py-1 rounded bg-gray-100">{tour.duration}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-[#01502E] font-semibold">PKR {tour.pricePerPerson.toLocaleString()}/person</div>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {tour.rating.toFixed(1)} ({tour.reviewCount})
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${tour.approvalStatus === "APPROVED" ? "bg-green-50 text-green-700" : tour.approvalStatus === "PENDING" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                        {tour.approvalStatus}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${tour.available ? "bg-[#01502E]/10 text-[#01502E]" : "bg-gray-100 text-gray-700"}`}>
                        {tour.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link to={`/tours/${tour.id}`} className="flex-1 text-center border rounded px-3 py-2">View</Link>
                      <Link to={`/book/tour/${tour.id}`} className="flex-1 text-center bg-[#01502E] text-white rounded px-3 py-2">Book</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Tour Form */}
        {isVerified && (
          <div id="create" className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-[#01502E]" />
              <h2 className="text-lg font-semibold">Create New Tour</h2>
            </div>
            <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium mb-2">Tour Title *</label>
                <input name="title" required className="w-full border rounded px-3 py-2" placeholder="Historical Lahore Walking Tour" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-2">City *</label>
                <input name="city" required className="w-full border rounded px-3 py-2" placeholder="Lahore" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-2">Country *</label>
                <input name="country" required className="w-full border rounded px-3 py-2" placeholder="Pakistan" />
              </div>
              <div>
                <label htmlFor="pricePerPerson" className="block text-sm font-medium mb-2">Price per Person (PKR) *</label>
                <input name="pricePerPerson" type="number" min="0" step="1" required className="w-full border rounded px-3 py-2" placeholder="1500" />
              </div>
              <div>
                <label htmlFor="maxGroupSize" className="block text-sm font-medium mb-2">Maximum Group Size *</label>
                <input name="maxGroupSize" type="number" min="1" max="50" required className="w-full border rounded px-3 py-2" placeholder="15" />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-2">Duration *</label>
                <input name="duration" required className="w-full border rounded px-3 py-2" placeholder="3 hours" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="highlights" className="block text-sm font-medium mb-2">Tour Highlights (comma separated)</label>
                <input name="highlights" className="w-full border rounded px-3 py-2" placeholder="Historical sites, Local culture, Traditional food" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-2">Tour Description *</label>
                <textarea name="description" rows={4} required className="w-full border rounded px-3 py-2" placeholder="Describe what makes this tour special..." />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
                  <Plus className="w-4 h-4" /> Create Tour
                </button>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
