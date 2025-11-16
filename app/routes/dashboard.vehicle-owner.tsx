import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { v2 as cloudinary } from "cloudinary";
import { Plus, CheckCircle2, Car, MapPin, Star, Clock, AlertCircle, Info, Camera, MessageCircle } from "lucide-react";
import SupportButton from "~/components/support/SupportButton";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, avatar: true } });
  if (!user) throw redirect("/login");

  // Allow access but show appropriate message if not vehicle owner
  if (user.role !== "VEHICLE_OWNER") {
    return json({ user, owner: null, vehicles: [], error: "Access restricted to vehicle owners" });
  }

  const owner = await prisma.vehicleOwner.findUnique({ where: { userId }, select: { id: true, businessName: true, verified: true } });
  if (!owner) {
    return json({ user, owner: null, vehicles: [], error: null });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      type: true,
      basePrice: true,
      seats: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      available: true,
      viewCount: true,
      rejectionReason: true,
      images: true,
    },
  });

  return json({ user, owner, vehicles, error: null });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-avatar") {
    const file = formData.get("avatar") as File | null;
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

  // Handle vehicle creation logic here
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;
  const basePrice = parseFloat(formData.get("basePrice") as string || "0");
  const seats = parseInt(formData.get("seats") as string || "4");
  const description = formData.get("description") as string;

  if (!name || !type || !city || !country || !basePrice) {
    return json({ error: "All required fields must be filled" }, { status: 400 });
  }

  try {
    // Ensure vehicle owner profile exists; auto-create minimal stub if missing
    let owner = await prisma.vehicleOwner.findUnique({ where: { userId } });
    if (!owner) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } });
      const now = Date.now();
      owner = await prisma.vehicleOwner.create({
        data: {
          userId,
          businessName: `${user?.name || 'Vehicle Owner'} Fleet`,
          businessType: 'individual',
          insuranceProvider: 'TBD',
          insurancePolicy: `TEMP-${now}`,
          insuranceExpiry: new Date(now + 365 * 24 * 60 * 60 * 1000),
          businessPhone: user?.phone || '+92 300 0000000',
          businessEmail: user?.email || `owner-${now}@example.com`,
          businessAddress: 'TBD',
          businessCity: city || 'Unknown',
          businessState: 'N/A',
          businessCountry: country || 'Unknown',
          drivingLicense: `TEMP-${now}`,
          licenseExpiry: new Date(now + 365 * 24 * 60 * 60 * 1000),
          drivingExperience: 0,
          languages: ['English'],
          vehicleTypes: [type || 'CAR'],
          serviceAreas: [city || 'Unknown'],
          bankName: null,
          accountNumber: null,
          routingNumber: null,
          documentsSubmitted: [],
        }
      });
    }

    // Allow creation regardless of verified status; vehicle stays PENDING/Unavailable
    const created = await prisma.vehicle.create({
      data: {
        name,
        type: type as any,
        city,
        country,
        basePrice,
        seats,
        description,
        ownerId: owner.id,
        approvalStatus: "PENDING",
        available: false,
        images: ["/placeholder-car.jpg"],
        rating: 0,
        reviewCount: 0,
        totalBookings: 0,
        viewCount: 0,
        favoriteCount: 0,
        // Required fields with defaults
        brand: "Generic",
        model: "Model",
        year: new Date().getFullYear(),
        category: "STANDARD",
        fuelType: "PETROL",
        transmission: "MANUAL",
        mileage: 0,
        features: [],
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastService: new Date(),
        nextService: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
        location: `${city}, ${country}`,
        licensePlate: `TEMP-${Date.now().toString().slice(-6)}`,
        registrationNo: `REG-${Date.now().toString().slice(-8)}`,
        insurancePolicy: "TEMP-POLICY",
      },
    });

    // Notify admins about pending vehicle approval
    const admins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true, role: true } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          userRole: a.role,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "New Vehicle Pending Approval",
          message: `Vehicle "${created.name}" has been submitted and awaits review`,
          data: { vehicleId: created.id }
        }))
      });
    }

    // Redirect to revalidate dashboard lists and banners
    return redirect("/dashboard/vehicle-owner?submitted=1");
  } catch (error) {
    console.error("Vehicle creation error:", error);
    return json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}

export default function VehicleOwnerDashboard() {
  const { user, owner, vehicles, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";
  const success = Boolean((actionData as any)?.success) || submitted;
  const actionError = (actionData as any)?.error as string | undefined;

  // Show error if user doesn't have access
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Access Restricted</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm md:text-base">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-[#01502E] hover:bg-[#003d21] text-white rounded-md text-sm md:text-base">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if owner is verified (all vehicles approved)
  const safeVehicles = vehicles || [];
  const isVerified = owner?.verified === true;
  const hasPendingApprovals = safeVehicles.some((v: any) => v.approvalStatus === "PENDING");
  const hasRejectedItems = safeVehicles.some((v: any) => v.approvalStatus === "REJECTED");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Owner Dashboard</h1>
            <p className="text-gray-600 truncate">Welcome, {user.name}</p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover border flex-shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#01502E] text-white flex items-center justify-center">
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <Form method="post" encType="multipart/form-data" className="flex items-center gap-2 flex-wrap">
                <input type="hidden" name="intent" value="update-avatar" />
                <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="text-xs max-w-[70vw]" />
                <button type="submit" className="inline-flex items-center px-3 py-1.5 border rounded text-sm whitespace-nowrap">
                  <Camera className="w-4 h-4 mr-1" /> Change Photo
                </button>
                {(actionData as any)?.target && (
                  <span className="ml-2 text-xs text-gray-500">Uploaded to: {(actionData as any).target}</span>
                )}
              </Form>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/dashboard/messages" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full sm:w-auto justify-center">
              <MessageCircle className="w-4 h-4" /> Messages
            </Link>
            {isVerified && (
              <a href="#create" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md w-full sm:w-auto justify-center">
                <Plus className="w-4 h-4" /> Add Vehicle
              </a>
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
                  <p className="text-sm">Your vehicles are being reviewed by our team. This usually takes 1-3 business days.</p>
                </div>
              </div>
            ) : hasRejectedItems ? (
              <div className="flex items-center gap-3 text-red-800 bg-red-50 p-3 rounded">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium">Verification Required</h3>
                  <p className="text-sm">Some of your vehicles were rejected. Please check the details and resubmit.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[#013d23] bg-[#01502E]/10 p-3 rounded">
                <Info className="h-5 w-5 text-[#01502E]" />
                <div>
                  <h3 className="font-medium">Complete Your Profile</h3>
                  <p className="text-sm">Add your first vehicle to get started with verification.</p>
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
                <p className="text-sm">Your account is fully verified. You can now manage all your vehicles.</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" /> Vehicle added successfully and awaiting approval
          </div>
        )}

        {actionError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" /> {actionError}
          </div>
        )}

        {/* Vehicles Grid */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-[#01502E]" />
            <h2 className="text-lg font-semibold">My Vehicles</h2>
          </div>
          {safeVehicles.length === 0 ? (
            <div className="text-center py-8 px-2">
              <Car className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isVerified ? "Get started by adding your first vehicle." : "Complete verification to start adding vehicles."}
              </p>
              {isVerified && (
                <div className="mt-6">
                  <a href="#create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23] w-full sm:w-auto justify-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {safeVehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="border rounded-lg overflow-hidden flex flex-col">
                  <img src={vehicle.images?.[0] || "/placeholder-car.jpg"} className="w-full h-40 object-cover" alt={vehicle.name} />
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{vehicle.name}</h3>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {vehicle.city}, {vehicle.country}
                        </div>
                      </div>
                      <span className="text-sm px-2 py-1 rounded bg-gray-100 whitespace-nowrap flex-shrink-0">{vehicle.type}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-[#01502E] font-semibold">PKR {vehicle.basePrice.toLocaleString()}/day</div>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {vehicle.rating.toFixed(1)} ({vehicle.reviewCount})
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${vehicle.approvalStatus === "APPROVED" ? "bg-green-50 text-green-700" : vehicle.approvalStatus === "PENDING" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                        {vehicle.approvalStatus === 'APPROVED' ? 'LIVE' : vehicle.approvalStatus === 'PENDING' ? 'UNDER REVIEW' : 'REJECTED'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${vehicle.available ? "bg-[#01502E]/10 text-[#01502E]" : "bg-gray-100 text-gray-700"}`}>
                        {vehicle.available ? "Available" : "Unavailable"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-700">Views {vehicle.viewCount ?? 0}</span>
                    </div>
                    {vehicle.approvalStatus === 'REJECTED' && vehicle.rejectionReason && (
                      <div className="mt-2 text-xs text-red-700">
                        Reason: {vehicle.rejectionReason} · <a href="#create" className="underline">Edit & Resubmit</a>
                      </div>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link to={`/vehicles/${vehicle.id}`} className="text-center border rounded px-3 py-2">View</Link>
                      <Link to={`/book/vehicle/${vehicle.id}`} className="text-center bg-[#01502E] text-white rounded px-3 py-2">Book</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Vehicle Form */}
        {isVerified && (
          <div id="create" className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-[#01502E]" />
              <h2 className="text-lg font-semibold">Add New Vehicle</h2>
            </div>
            <Form method="post" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Vehicle Name *</label>
                <input name="name" required className="w-full border rounded px-3 py-2" placeholder="Honda Civic 2020" />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">Vehicle Type *</label>
                <select name="type" required className="w-full border rounded px-3 py-2">
                  <option value="">Select Type</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
                </select>
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
                <label htmlFor="basePrice" className="block text-sm font-medium mb-2">Daily Rate (PKR) *</label>
                <input name="basePrice" type="number" min="0" step="1" required className="w-full border rounded px-3 py-2" placeholder="2000" />
              </div>
              <div>
                <label htmlFor="seats" className="block text-sm font-medium mb-2">Number of Seats *</label>
                <input name="seats" type="number" min="1" max="20" required className="w-full border rounded px-3 py-2" placeholder="4" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
                <textarea name="description" rows={3} className="w-full border rounded px-3 py-2" placeholder="Describe your vehicle..." />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md w-full sm:w-auto justify-center">
                  <Plus className="w-4 h-4" /> Add Vehicle
                </button>
              </div>
            </Form>
          </div>
        )}
      </div>
      {/* Contact Support Floating Button */}
      <SupportButton userId={user.id} userRole={user.role} />
    </div>
  );
}
