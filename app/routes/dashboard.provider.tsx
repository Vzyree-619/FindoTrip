import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { v2 as cloudinary } from "cloudinary";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import {
  Plus,
  CheckCircle2,
  Home,
  MapPin,
  Star,
  Clock,
  AlertCircle,
  Info,
  Camera,
  MessageCircle,
} from "lucide-react";
import SupportButton from "~/components/support/SupportButton";
import ChatButton from "~/components/chat/ChatButton";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, avatar: true },
  });
  if (!user) throw redirect("/login");

  // Allow access but show appropriate message if not property owner
  if (user.role !== "PROPERTY_OWNER") {
    return json({
      user,
      owner: null,
      properties: [],
      error: "Access restricted to property owners",
    });
  }

  const owner = await prisma.propertyOwner.findUnique({
    where: { userId },
    select: { id: true, businessName: true, verified: true },
  });
  if (!owner) {
    return json({ user, owner: null, properties: [], error: null });
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      type: true,
      basePrice: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      available: true,
      images: true,
    },
  });

  return json({ user, owner, properties, error: null });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== "PROPERTY_OWNER")
    return json({ error: "Not authorized" }, { status: 403 });

  const owner = await prisma.propertyOwner.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!owner)
    return json({ error: "Owner profile not found" }, { status: 400 });

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "update-avatar") {
    const file = form.get("avatar") as File | null;
    if (!file) return json({ error: "No file provided" }, { status: 400 });
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return json({ error: "Invalid file type" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024)
      return json({ error: "File too large (max 5MB)" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let url: string | null = null;
    try {
      if (cloudName && apiKey && apiSecret) {
        try {
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
          });
          const arrayBuffer = await file.arrayBuffer();
          const uploadResult: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "findo" },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
            stream.end(Buffer.from(arrayBuffer));
          });
          url = uploadResult.secure_url as string;
        } catch (cloudErr) {
          const uploadsDir = "public/uploads/profiles";
          const fs = await import("fs");
          if (!fs.existsSync(uploadsDir))
            fs.mkdirSync(uploadsDir, { recursive: true });
          const ext = file.name.split(".").pop() || "jpg";
          const filename = `${userId}-${Date.now()}.${ext}`;
          const arrayBuffer = await file.arrayBuffer();
          fs.writeFileSync(
            `${uploadsDir}/${filename}`,
            Buffer.from(arrayBuffer)
          );
          url = `/uploads/profiles/${filename}`;
        }
      } else {
        const uploadsDir = "public/uploads/profiles";
        const fs = await import("fs");
        if (!fs.existsSync(uploadsDir))
          fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${userId}-${Date.now()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
        url = `/uploads/profiles/${filename}`;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { avatar: url! },
      });
      const target = url?.startsWith("http") ? "cloudinary" : "local";
      return json({ success: "Profile picture updated!", target, url });
    } catch (e) {
      return json({ error: "Failed to upload image" }, { status: 500 });
    }
  }
  if (intent === "create") {
    const name = (form.get("name") as string)?.trim();
    const description = ((form.get("description") as string) || "").trim();
    const type = (form.get("type") as string) || "HOTEL";
    const address = (form.get("address") as string) || "";
    const city = (form.get("city") as string) || "";
    const state = (form.get("state") as string) || undefined;
    const country = (form.get("country") as string) || "";
    const postalCode = (form.get("postalCode") as string) || undefined;
    const latitude = (form.get("latitude") as string)
      ? parseFloat(form.get("latitude") as string)
      : undefined;
    const longitude = (form.get("longitude") as string)
      ? parseFloat(form.get("longitude") as string)
      : undefined;

    const basePrice = parseFloat((form.get("basePrice") as string) || "0");
    const cleaningFee = (form.get("cleaningFee") as string)
      ? parseFloat(form.get("cleaningFee") as string)
      : 0;
    const serviceFee = (form.get("service") as string)
      ? parseFloat(form.get("service") as string)
      : 0;
    const taxRate = (form.get("taxRate") as string)
      ? parseFloat(form.get("taxRate") as string)
      : 0;
    const currency = (form.get("currency") as string) || "PKR";
    const weekendPricing = (form.get("weekendPricing") as string)
      ? parseFloat(form.get("weekendPricing") as string)
      : undefined;
    const monthlyDiscount = (form.get("monthlyDiscount") as string)
      ? parseFloat(form.get("monthlyDiscount") as string)
      : 0;
    const weeklyDiscount = (form.get("weeklyDiscount") as string)
      ? parseFloat(form.get("weeklyDiscount") as string)
      : 0;

    const maxGuests = parseInt((form.get("maxGuests") as string) || "1", 10);
    const bedrooms = parseInt((form.get("bedrooms") as string) || "1", 10);
    const bathrooms = parseInt((form.get("bathrooms") as string) || "1", 10);
    const beds = (form.get("beds") as string)
      ? parseInt(form.get("beds") as string, 10)
      : undefined;
    const minStay = (form.get("minStay") as string)
      ? parseInt(form.get("minStay") as string, 10)
      : 1;
    const maxStay = (form.get("maxStay") as string)
      ? parseInt(form.get("maxStay") as string, 10)
      : 365;
    const advanceNotice = (form.get("advanceNotice") as string)
      ? parseInt(form.get("advanceNotice") as string, 10)
      : 0;
    const checkInTime = (form.get("checkInTime") as string) || "15:00";
    const checkOutTime = (form.get("checkOutTime") as string) || "11:00";
    const available = form.get("available") === "on";
    const instantBook = form.get("instantBook") === "on";
    const selfCheckIn = form.get("selfCheckIn") === "on";

    const imageUrl = (form.get("imageUrl") as string) || "";
    const mainImage = (form.get("mainImage") as string) || imageUrl || undefined;
    const starRating = (form.get("starRating") as string)
      ? parseInt(form.get("starRating") as string, 10)
      : undefined;
    const amenitiesRaw = (form.get("amenities") as string) || "";
    const propertyFacilitiesRaw = (form.get("propertyFacilities") as string) || "";
    const safetyRaw = (form.get("safetyFeatures") as string) || "";
    const accessibilityRaw = (form.get("accessibility") as string) || "";
    const houseRulesRaw = (form.get("houseRules") as string) || "";
    const amenities = amenitiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const propertyFacilities = propertyFacilitiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const safetyFeatures = safetyRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const accessibility = accessibilityRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const houseRules = houseRulesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!name || !city || !country || isNaN(basePrice)) {
      return json(
        { error: "Name, city, country and base price are required" },
        { status: 400 }
      );
    }

    try {
      const created = await prisma.property.create({
        data: {
          name,
          description,
          type: type as any,
          address,
          city,
          state,
          country,
          postalCode,
          latitude: isNaN(latitude as any) ? undefined : latitude,
          longitude: isNaN(longitude as any) ? undefined : longitude,
          maxGuests,
          bedrooms,
          bathrooms,
          beds,
          basePrice,
          cleaningFee,
          serviceFee,
          taxRate,
          currency,
          weekendPricing,
          monthlyDiscount,
          weeklyDiscount,
          images: imageUrl ? [imageUrl] : [],
          mainImage: mainImage || (imageUrl ? imageUrl : undefined),
          videos: [],
          virtualTour: null,
          floorPlan: null,
          amenities,
          propertyFacilities,
          safetyFeatures,
          accessibility,
          houseRules,
          starRating: starRating && starRating >= 1 && starRating <= 5 ? starRating : undefined,
          available,
          instantBook,
          selfCheckIn,
          minStay,
          maxStay,
          advanceNotice,
          checkInTime,
          checkOutTime,
          ownerId: owner.id,
          approvalStatus: "PENDING",
          rating: 0,
          reviewCount: 0,
          totalBookings: 0,
          viewCount: 0,
          favoriteCount: 0,
        },
      });
      // Notify admins about pending property approval
      const admins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true, role: true },
      });
      if (admins.length) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            userRole: a.role,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "New Property Pending Approval",
            message: `Property "${created.name}" has been submitted and awaits review`,
            data: { propertyId: created.id },
          })),
        });
      }
      // Redirect to revalidate dashboard lists and banners
      return redirect("/dashboard/provider?submitted=1");
    } catch (e) {
      console.error(e);
      return json({ error: "Failed to create property" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ProviderDashboard() {
  const { user, owner, properties, error } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";
  const actionData = useActionData<typeof action>();

  // Show error if user doesn't have access
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Restricted
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm md:text-base">
            {error}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-[#01502E] hover:bg-[#003d21] text-white rounded-md text-sm md:text-base"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if owner is verified strictly by admin flag
  const safeProperties = properties || [];
  const isVerified = owner?.verified === true;
  const hasPendingApprovals = safeProperties.some(
    (p: any) => p.approvalStatus === "PENDING"
  );
  const hasRejectedItems = safeProperties.some(
    (p: any) => p.approvalStatus === "REJECTED"
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Property Owner Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome, {user.name}
          </p>
          <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover border"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#01502E] text-white flex items-center justify-center">
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <Form
                method="post"
                encType="multipart/form-data"
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
              >
                <input type="hidden" name="intent" value="update-avatar" />
                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Camera className="w-4 h-4 mr-1" /> Change Photo
                </button>
                {(actionData as any)?.target && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Uploaded to: {(actionData as any).target}
                  </span>
                )}
              </Form>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0">
          <Link
            to="/dashboard/messages"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 text-sm"
          >
            <MessageCircle className="w-4 h-4" /> <span>Messages</span>
          </Link>
          <a
            href="#create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#003d21] text-sm"
          >
            <Plus className="w-4 h-4" /> <span>New Property</span>
          </a>
        </div>

        {/* Approval Status Banner */}
        {!isVerified && (
          <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            {hasPendingApprovals ? (
              <div className="flex items-start sm:items-center gap-3 text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-medium">Awaiting Verification</h3>
                  <p className="text-sm">
                    Your properties are being reviewed by our team. This usually
                    takes 1-3 business days.
                  </p>
                </div>
              </div>
            ) : hasRejectedItems ? (
              <div className="flex items-start sm:items-center gap-3 text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-medium">Verification Required</h3>
                  <p className="text-sm">
                    Some of your properties were rejected. Please check the
                    details and resubmit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start sm:items-center gap-3 text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-medium">Complete Your Profile</h3>
                  <p className="text-sm">
                    Add your first property to get started with verification.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isVerified && (
          <div className="mb-6 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex items-start sm:items-center gap-3 text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="font-medium">Verified Provider</h3>
                <p className="text-sm">
                  Your account is fully verified. You can now manage all your
                  properties.
                </p>
              </div>
            </div>
          </div>
        )}

        {(actionData && (actionData as any).success) || submitted ? (
          <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />{" "}
            <span>Property created successfully and awaiting approval</span>
          </div>
        ) : null}

        {/* Properties Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-[#01502E]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Properties
            </h2>
          </div>
          {properties.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-400">
              No properties yet. Create your first property below.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {properties.map((p: any) => (
                <div
                  key={p.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900 transition"
                >
                  <img
                    src={p.images?.[0] || "/landingPageImg.jpg"}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 md:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 text-sm md:text-base">
                          {p.name}
                        </h3>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{" "}
                          <span className="line-clamp-1">
                            {p.city}, {p.country}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex-shrink-0">
                        {p.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="text-[#01502E] dark:text-[#4ade80] font-semibold">
                        PKR {p.basePrice.toLocaleString()}/night
                      </div>
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-xs">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{" "}
                        <span>
                          {p.rating.toFixed(1)} ({p.reviewCount})
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded whitespace-nowrap ${
                          p.approvalStatus === "APPROVED"
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : p.approvalStatus === "PENDING"
                            ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {p.approvalStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded whitespace-nowrap ${
                          p.available
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {p.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2 text-xs md:text-sm">
                      <Link
                        to={`/accommodations/${p.id}`}
                        className="flex-1 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-3 py-2"
                      >
                        View
                      </Link>
                      <Link
                        to={`/dashboard/provider/properties/${p.id}/edit`}
                        className="flex-1 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-3 py-2"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/book/property/${p.id}`}
                        className="flex-1 text-center bg-[#01502E] hover:bg-[#003d21] text-white rounded px-3 py-2"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Property */}
        <div
          id="create"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-[#01502E]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Property
            </h2>
          </div>
          <div className="mb-4">
            <Link
              to="/dashboard/provider/rooms"
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
            >
              Manage Room Types
            </Link>
          </div>
          <Form
            method="post"
            className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
          >
            <input type="hidden" name="intent" value="create" />
            <div>
              <Label htmlFor="name" className="text-xs md:text-sm">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Sunrise Hotel"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-xs md:text-sm">
                Type
              </Label>
              <input type="hidden" name="type" id="type-value" defaultValue="HOTEL" />
              <Select defaultValue="HOTEL" onValueChange={(value) => {
                const hiddenInput = document.getElementById('type-value') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = value;
              }}>
                <SelectTrigger id="type" className="mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOTEL">Hotel</SelectItem>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                  <SelectItem value="VILLA">Villa</SelectItem>
                  <SelectItem value="RESORT">Resort</SelectItem>
                  <SelectItem value="HOSTEL">Hostel</SelectItem>
                  <SelectItem value="LODGE">Lodge</SelectItem>
                  <SelectItem value="GUESTHOUSE">Guesthouse</SelectItem>
                  <SelectItem value="BOUTIQUE_HOTEL">Boutique Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-xs md:text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe your property"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-xs md:text-sm">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main St"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-xs md:text-sm">
                State/Province
              </Label>
              <Input
                id="state"
                name="state"
                placeholder="GB"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-xs md:text-sm">
                City
              </Label>
              <Input
                id="city"
                name="city"
                required
                placeholder="Islamabad"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-xs md:text-sm">
                Country
              </Label>
              <Input
                id="country"
                name="country"
                required
                placeholder="Pakistan"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postalCode" className="text-xs md:text-sm">
                Postal Code
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="44000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="basePrice" className="text-xs md:text-sm">
                Base Price (PKR)
              </Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="1"
                min="0"
                required
                placeholder="4000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cleaningFee" className="text-xs md:text-sm">
                Cleaning Fee
              </Label>
              <Input
                id="cleaningFee"
                name="cleaningFee"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="service" className="text-xs md:text-sm">
                Service Fee
              </Label>
              <Input
                id="service"
                name="service"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="taxRate" className="text-xs md:text-sm">
                Tax Rate
              </Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.02"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency" className="text-xs md:text-sm">
                Currency
              </Label>
              <Input
                id="currency"
                name="currency"
                placeholder="PKR"
                defaultValue="PKR"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxGuests" className="text-xs md:text-sm">
                Max Guests
              </Label>
              <Input
                id="maxGuests"
                name="maxGuests"
                type="number"
                min="1"
                required
                placeholder="4"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bedrooms" className="text-xs md:text-sm">
                Bedrooms
              </Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min="1"
                required
                placeholder="2"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bathrooms" className="text-xs md:text-sm">
                Bathrooms
              </Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="1"
                required
                placeholder="1"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="beds" className="text-xs md:text-sm">
                Beds (optional)
              </Label>
              <Input
                id="beds"
                name="beds"
                type="number"
                min="0"
                placeholder="2"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="amenities" className="text-xs md:text-sm">
                Amenities (comma separated)
              </Label>
              <Input
                id="amenities"
                name="amenities"
                placeholder="WiFi, Parking, Breakfast"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div>
                <Label htmlFor="safetyFeatures" className="text-xs md:text-sm">
                  Safety Features
                </Label>
                <Input
                  id="safetyFeatures"
                  name="safetyFeatures"
                  placeholder="Fire Extinguisher, Smoke Detector"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="accessibility" className="text-xs md:text-sm">
                  Accessibility
                </Label>
                <Input
                  id="accessibility"
                  name="accessibility"
                  placeholder="Elevator, Wheelchair Access"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="houseRules" className="text-xs md:text-sm">
                  House Rules
                </Label>
                <Input
                  id="houseRules"
                  name="houseRules"
                  placeholder="No Smoking, No Pets"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="weekendPricing" className="text-xs md:text-sm">
                Weekend Pricing Multiplier
              </Label>
              <Input
                id="weekendPricing"
                name="weekendPricing"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.15"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="weeklyDiscount" className="text-xs md:text-sm">
                Weekly Discount (%)
              </Label>
              <Input
                id="weeklyDiscount"
                name="weeklyDiscount"
                type="number"
                step="0.1"
                min="0"
                placeholder="3"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="monthlyDiscount" className="text-xs md:text-sm">
                Monthly Discount (%)
              </Label>
              <Input
                id="monthlyDiscount"
                name="monthlyDiscount"
                type="number"
                step="0.1"
                min="0"
                placeholder="5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="checkInTime" className="text-xs md:text-sm">
                Check-in Time
              </Label>
              <Input
                id="checkInTime"
                name="checkInTime"
                placeholder="15:00"
                defaultValue="15:00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="checkOutTime" className="text-xs md:text-sm">
                Check-out Time
              </Label>
              <Input
                id="checkOutTime"
                name="checkOutTime"
                placeholder="11:00"
                defaultValue="11:00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="advanceNotice" className="text-xs md:text-sm">
                Advance Notice (hours)
              </Label>
              <Input
                id="advanceNotice"
                name="advanceNotice"
                type="number"
                min="0"
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="starRating" className="text-xs md:text-sm">
                Star Rating (1-5)
              </Label>
              <input type="hidden" name="starRating" id="starRating-value" defaultValue="0" />
              <Select defaultValue="0" onValueChange={(value) => {
                const hiddenInput = document.getElementById('starRating-value') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = value === "0" ? "" : value;
              }}>
                <SelectTrigger id="starRating" className="mt-1">
                  <SelectValue placeholder="Not rated" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not rated</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="propertyFacilities" className="text-xs md:text-sm">
                Property Facilities (comma separated)
              </Label>
              <Input
                id="propertyFacilities"
                name="propertyFacilities"
                placeholder="Restaurant, Gym, Pool, Spa, Business Center"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">General property facilities (separate from room amenities)</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Main Image URL (Primary display image)
              </label>
              <input
                name="mainImage"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                placeholder="https://.../main-image.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Cover Image URL (Additional images)
              </label>
              <input
                name="imageUrl"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                placeholder="https://.../image.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Upload Images (optional)
              </label>
              <input
                name="images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01502E]"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="available"
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />{" "}
                Available
              </label>
              <label className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="instantBook"
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />{" "}
                Instant Book
              </label>
              <label className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="selfCheckIn"
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />{" "}
                Self Check-in
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#01502E] hover:bg-[#003d21] text-white rounded-md text-sm md:text-base font-medium"
              >
                <Plus className="w-4 h-4" /> Create Property
              </button>
            </div>
          </Form>
        </div>
      </div>
      {/* Contact Support Floating Button */}
      <SupportButton userId={user.id} userRole={user.role} />
    </div>
  );
}
