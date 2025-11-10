import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { v2 as cloudinary } from "cloudinary";
import { Plus, CheckCircle2, Home, MapPin, Star, Clock, AlertCircle, Info, Camera, MessageCircle } from "lucide-react";
import SupportButton from "~/components/support/SupportButton";
import ChatButton from "~/components/chat/ChatButton";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, avatar: true } });
  if (!user) throw redirect("/login");
  
  // Allow access but show appropriate message if not property owner
  if (user.role !== "PROPERTY_OWNER") {
    return json({ user, owner: null, properties: [], error: "Access restricted to property owners" });
  }

  const owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true, businessName: true, verified: true } });
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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") return json({ error: "Not authorized" }, { status: 403 });

  const owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true } });
  if (!owner) return json({ error: "Owner profile not found" }, { status: 400 });

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "update-avatar") {
    const file = form.get("avatar") as File | null;
    if (!file) return json({ error: "No file provided" }, { status: 400 });
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return json({ error: "Invalid file type" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return json({ error: "File too large (max 5MB)" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let url: string | null = null;
    try {
      if (cloudName && apiKey && apiSecret) {
        try {
          cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
          const arrayBuffer = await file.arrayBuffer();
          const uploadResult: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'findo' }, (err, result) => {
              if (err) reject(err); else resolve(result);
            });
            stream.end(Buffer.from(arrayBuffer));
          });
          url = uploadResult.secure_url as string;
        } catch (cloudErr) {
          const uploadsDir = "public/uploads/profiles";
          const fs = await import("fs");
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const ext = file.name.split(".").pop() || "jpg";
          const filename = `${userId}-${Date.now()}.${ext}`;
          const arrayBuffer = await file.arrayBuffer();
          fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
          url = `/uploads/profiles/${filename}`;
        }
      } else {
        const uploadsDir = "public/uploads/profiles";
        const fs = await import("fs");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${userId}-${Date.now()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
        url = `/uploads/profiles/${filename}`;
      }

      await prisma.user.update({ where: { id: userId }, data: { avatar: url! } });
      const target = url?.startsWith('http') ? 'cloudinary' : 'local';
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
    const latitude = (form.get("latitude") as string) ? parseFloat(form.get("latitude") as string) : undefined;
    const longitude = (form.get("longitude") as string) ? parseFloat(form.get("longitude") as string) : undefined;

    const basePrice = parseFloat((form.get("basePrice") as string) || "0");
    const cleaningFee = (form.get("cleaningFee") as string) ? parseFloat(form.get("cleaningFee") as string) : 0;
    const serviceFee = (form.get("service") as string) ? parseFloat(form.get("service") as string) : 0;
    const taxRate = (form.get("taxRate") as string) ? parseFloat(form.get("taxRate") as string) : 0;
    const currency = (form.get("currency") as string) || 'PKR';
    const weekendPricing = (form.get("weekendPricing") as string) ? parseFloat(form.get("weekendPricing") as string) : undefined;
    const monthlyDiscount = (form.get("monthlyDiscount") as string) ? parseFloat(form.get("monthlyDiscount") as string) : 0;
    const weeklyDiscount = (form.get("weeklyDiscount") as string) ? parseFloat(form.get("weeklyDiscount") as string) : 0;

    const maxGuests = parseInt((form.get("maxGuests") as string) || "1", 10);
    const bedrooms = parseInt((form.get("bedrooms") as string) || "1", 10);
    const bathrooms = parseInt((form.get("bathrooms") as string) || "1", 10);
    const beds = (form.get("beds") as string) ? parseInt(form.get("beds") as string, 10) : undefined;
    const minStay = (form.get("minStay") as string) ? parseInt(form.get("minStay") as string, 10) : 1;
    const maxStay = (form.get("maxStay") as string) ? parseInt(form.get("maxStay") as string, 10) : 365;
    const advanceNotice = (form.get("advanceNotice") as string) ? parseInt(form.get("advanceNotice") as string, 10) : 0;
    const checkInTime = ((form.get("checkInTime") as string) || "15:00");
    const checkOutTime = ((form.get("checkOutTime") as string) || "11:00");
    const available = form.get("available") === 'on';
    const instantBook = form.get("instantBook") === 'on';
    const selfCheckIn = form.get("selfCheckIn") === 'on';

    const imageUrl = (form.get("imageUrl") as string) || "";
    const amenitiesRaw = (form.get("amenities") as string) || "";
    const safetyRaw = (form.get("safetyFeatures") as string) || "";
    const accessibilityRaw = (form.get("accessibility") as string) || "";
    const houseRulesRaw = (form.get("houseRules") as string) || "";
    const amenities = amenitiesRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const safetyFeatures = safetyRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const accessibility = accessibilityRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const houseRules = houseRulesRaw.split(",").map((s) => s.trim()).filter(Boolean);

    if (!name || !city || !country || isNaN(basePrice)) {
      return json({ error: "Name, city, country and base price are required" }, { status: 400 });
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
          videos: [],
          virtualTour: null,
          floorPlan: null,
          amenities,
          safetyFeatures,
          accessibility,
          houseRules,
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
      const admins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true, role: true } });
      if (admins.length) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            userRole: a.role,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "New Property Pending Approval",
            message: `Property "${created.name}" has been submitted and awaits review`,
            data: { propertyId: created.id }
          }))
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

  // Check if owner is verified (all properties approved)
  const safeProperties = properties || [];
  const isVerified = owner?.verified || safeProperties.every((p: any) => p.approvalStatus === "APPROVED");
  const hasPendingApprovals = safeProperties.some((p: any) => p.approvalStatus === "PENDING");
  const hasRejectedItems = safeProperties.some((p: any) => p.approvalStatus === "REJECTED");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Owner Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
            <div className="mt-3 flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover border" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#01502E] text-white flex items-center justify-center">
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <Form method="post" encType="multipart/form-data" className="flex items-center gap-2">
                <input type="hidden" name="intent" value="update-avatar" />
                <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="text-xs" />
                <button type="submit" className="inline-flex items-center px-3 py-1.5 border rounded text-sm">
                  <Camera className="w-4 h-4 mr-1" /> Change Photo
                </button>
                {(actionData as any)?.target && (
                  <span className="ml-2 text-xs text-gray-500">Uploaded to: {(actionData as any).target}</span>
                )}
              </Form>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/messages" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <MessageCircle className="w-4 h-4" /> Messages
            </Link>
            <a href="#create" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
              <Plus className="w-4 h-4" /> New Property
            </a>
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
                  <p className="text-sm">Your properties are being reviewed by our team. This usually takes 1-3 business days.</p>
                </div>
              </div>
            ) : hasRejectedItems ? (
              <div className="flex items-center gap-3 text-red-800 bg-red-50 p-3 rounded">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium">Verification Required</h3>
                  <p className="text-sm">Some of your properties were rejected. Please check the details and resubmit.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-blue-800 bg-blue-50 p-3 rounded">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium">Complete Your Profile</h3>
                  <p className="text-sm">Add your first property to get started with verification.</p>
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
                <p className="text-sm">Your account is fully verified. You can now manage all your properties.</p>
              </div>
            </div>
          </div>
        )}

        {(actionData && (actionData as any).success) || submitted ? (
          <div className="mb-6 rounded-md bg-green-50 p-4 flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" /> Property created successfully and awaiting approval
          </div>
        ) : null}

        {/* Properties Grid */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-[#01502E]" />
            <h2 className="text-lg font-semibold">My Properties</h2>
          </div>
          {properties.length === 0 ? (
            <div className="text-gray-600">No properties yet. Create your first property below.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p: any) => (
                <div key={p.id} className="border rounded-lg overflow-hidden">
                  <img src={p.images?.[0] || "/placeholder-hotel.jpg"} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {p.city}, {p.country}
                        </div>
                      </div>
                      <span className="text-sm px-2 py-1 rounded bg-gray-100">{p.type}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-[#01502E] font-semibold">PKR {p.basePrice.toLocaleString()}/night</div>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {p.rating.toFixed(1)} ({p.reviewCount})
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${p.approvalStatus === "APPROVED" ? "bg-green-50 text-green-700" : p.approvalStatus === "PENDING" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>{p.approvalStatus}</span>
                      <span className={`px-2 py-0.5 rounded ${p.available ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{p.available ? "Available" : "Unavailable"}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link to={`/accommodations/${p.id}`} className="flex-1 text-center border rounded px-3 py-2">View</Link>
                      <Link to={`/dashboard/provider/properties/${p.id}/edit`} className="flex-1 text-center border rounded px-3 py-2">Edit</Link>
                      <Link to={`/book/property/${p.id}`} className="flex-1 text-center bg-[#01502E] text-white rounded px-3 py-2">Book</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Property */}
        <div id="create" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-[#01502E]" />
            <h2 className="text-lg font-semibold">Create New Property</h2>
          </div>
          <div className="mb-4">
            <Link to="/dashboard/provider/rooms" className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
              Manage Room Types
            </Link>
          </div>
          <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="intent" value="create" />
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" required className="w-full border rounded px-3 py-2" placeholder="Sunrise Hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select name="type" className="w-full border rounded px-3 py-2">
                <option value="HOTEL">Hotel</option>
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa</option>
                <option value="RESORT">Resort</option>
                <option value="HOSTEL">Hostel</option>
                <option value="LODGE">Lodge</option>
                <option value="GUESTHOUSE">Guesthouse</option>
                <option value="BOUTIQUE_HOTEL">Boutique Hotel</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full border rounded px-3 py-2" placeholder="Describe your property" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="address" className="w-full border rounded px-3 py-2" placeholder="123 Main St" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State/Province</label>
              <input name="state" className="w-full border rounded px-3 py-2" placeholder="GB" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input name="city" required className="w-full border rounded px-3 py-2" placeholder="Islamabad" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input name="country" required className="w-full border rounded px-3 py-2" placeholder="Pakistan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input name="postalCode" className="w-full border rounded px-3 py-2" placeholder="44000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Price (PKR)</label>
              <input name="basePrice" type="number" step="1" min="0" required className="w-full border rounded px-3 py-2" placeholder="4000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cleaning Fee</label>
              <input name="cleaningFee" type="number" step="1" min="0" className="w-full border rounded px-3 py-2" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Fee</label>
              <input name="service" type="number" step="1" min="0" className="w-full border rounded px-3 py-2" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate</label>
              <input name="taxRate" type="number" step="0.01" min="0" className="w-full border rounded px-3 py-2" placeholder="0.02" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input name="currency" className="w-full border rounded px-3 py-2" placeholder="PKR" defaultValue="PKR" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Guests</label>
              <input name="maxGuests" type="number" min="1" required className="w-full border rounded px-3 py-2" placeholder="4" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input name="bedrooms" type="number" min="1" required className="w-full border rounded px-3 py-2" placeholder="2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bathrooms</label>
              <input name="bathrooms" type="number" min="1" required className="w-full border rounded px-3 py-2" placeholder="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beds (optional)</label>
              <input name="beds" type="number" min="0" className="w-full border rounded px-3 py-2" placeholder="2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
              <input name="amenities" className="w-full border rounded px-3 py-2" placeholder="WiFi, Parking, Breakfast" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Safety Features (comma separated)</label>
                <input name="safetyFeatures" className="w-full border rounded px-3 py-2" placeholder="Fire Extinguisher, Smoke Detector" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accessibility (comma separated)</label>
                <input name="accessibility" className="w-full border rounded px-3 py-2" placeholder="Elevator, Wheelchair Access" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">House Rules (comma separated)</label>
                <input name="houseRules" className="w-full border rounded px-3 py-2" placeholder="No Smoking, No Pets" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weekend Pricing Multiplier</label>
              <input name="weekendPricing" type="number" step="0.01" min="0" className="w-full border rounded px-3 py-2" placeholder="1.15" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weekly Discount (%)</label>
              <input name="weeklyDiscount" type="number" step="0.1" min="0" className="w-full border rounded px-3 py-2" placeholder="3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Discount (%)</label>
              <input name="monthlyDiscount" type="number" step="0.1" min="0" className="w-full border rounded px-3 py-2" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-in Time</label>
              <input name="checkInTime" className="w-full border rounded px-3 py-2" placeholder="15:00" defaultValue="15:00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-out Time</label>
              <input name="checkOutTime" className="w-full border rounded px-3 py-2" placeholder="11:00" defaultValue="11:00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Advance Notice (hours)</label>
              <input name="advanceNotice" type="number" min="0" className="w-full border rounded px-3 py-2" placeholder="0" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Cover Image URL</label>
              <input name="imageUrl" className="w-full border rounded px-3 py-2" placeholder="https://.../image.jpg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Upload Images (optional)</label>
              <input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="available" className="h-4 w-4" /> Available
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="instantBook" className="h-4 w-4" /> Instant Book
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="selfCheckIn" className="h-4 w-4" /> Self Check-in
              </label>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
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
