import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { v2 as cloudinary } from "cloudinary";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const id = params.id as string;
  if (!id) throw redirect("/dashboard/provider");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true } });
  if (!user || user.role !== "PROPERTY_OWNER") throw redirect("/login");

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      name: true,
      description: true,
      type: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      basePrice: true,
      cleaningFee: true,
      serviceFee: true,
      taxRate: true,
      currency: true,
      weekendPricing: true,
      weeklyDiscount: true,
      monthlyDiscount: true,
      maxGuests: true,
      bedrooms: true,
      bathrooms: true,
      beds: true,
      minStay: true,
      maxStay: true,
      advanceNotice: true,
      checkInTime: true,
      checkOutTime: true,
      available: true,
      instantBook: true,
      selfCheckIn: true,
      amenities: true,
      safetyFeatures: true,
      accessibility: true,
      houseRules: true,
      images: true,
      videos: true,
      floorPlan: true,
      virtualTour: true,
      approvalStatus: true,
    }
  });
  if (!property) throw redirect("/dashboard/provider");

  // Verify ownership
  const owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true } });
  if (!owner || property.ownerId !== owner.id) throw redirect("/dashboard/provider");

  return json({ user, property });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const id = params.id as string;
  if (!id) return json({ error: "Invalid property" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") return json({ error: "Not authorized" }, { status: 403 });

  const property = await prisma.property.findUnique({ where: { id }, select: { ownerId: true, images: true } });
  const owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true } });
  if (!property || !owner || property.ownerId !== owner.id) return json({ error: "Invalid property" }, { status: 403 });

  const form = await request.formData();
  const intent = form.get("intent") || "update";
  if (intent !== "update") return json({ error: "Invalid action" }, { status: 400 });

  const parseNum = (v: FormDataEntryValue | null) => {
    if (v == null) return undefined;
    const s = String(v);
    if (s.trim() === "") return undefined;
    const n = parseFloat(s);
    return isNaN(n) ? undefined : n;
  };

  const data: any = {};
  const fields = [
    "name","description","type","address","city","state","country","postalCode",
    "checkInTime","checkOutTime","currency"
  ];
  for (const f of fields) {
    const val = form.get(f) as string | null;
    if (val != null) data[f] = (f === "type" ? val : val?.trim());
  }
  const numFields: Record<string, FormDataEntryValue | null> = {
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
    basePrice: form.get("basePrice"),
    cleaningFee: form.get("cleaningFee"),
    serviceFee: form.get("service"),
    taxRate: form.get("taxRate"),
    weekendPricing: form.get("weekendPricing"),
    weeklyDiscount: form.get("weeklyDiscount"),
    monthlyDiscount: form.get("monthlyDiscount"),
    maxGuests: form.get("maxGuests"),
    bedrooms: form.get("bedrooms"),
    bathrooms: form.get("bathrooms"),
    beds: form.get("beds"),
    minStay: form.get("minStay"),
    maxStay: form.get("maxStay"),
    advanceNotice: form.get("advanceNotice"),
  };
  for (const [k, v] of Object.entries(numFields)) {
    const n = parseNum(v);
    if (n !== undefined) data[k] = n;
  }
  data.available = form.get("available") === "on";
  data.instantBook = form.get("instantBook") === "on";
  data.selfCheckIn = form.get("selfCheckIn") === "on";

  // Arrays
  const parseArray = (s: string | null) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : undefined);
  const amenities = parseArray(form.get("amenities") as string | null);
  const safety = parseArray(form.get("safetyFeatures") as string | null);
  const access = parseArray(form.get("accessibility") as string | null);
  const rules = parseArray(form.get("houseRules") as string | null);
  if (amenities) data.amenities = amenities;
  if (safety) data.safetyFeatures = safety;
  if (access) data.accessibility = access;
  if (rules) data.houseRules = rules;

  // Images (append new uploads)
  const imageFiles = (form.getAll('images') as File[]).filter(Boolean);
  const coverUrl = (form.get('imageUrl') as string) || '';
  let newImages: string[] = [];
  if (imageFiles.length) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      for (const file of imageFiles) {
        const type = (file as any).type || '';
        if (!/^image\/(jpeg|png|webp)$/.test(type)) continue;
        const arrayBuffer = await file.arrayBuffer();
        try {
          const uploadResult: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'findo/properties' }, (err, result) => {
              if (err) reject(err); else resolve(result);
            });
            stream.end(Buffer.from(arrayBuffer));
          });
          newImages.push(uploadResult.secure_url as string);
        } catch {}
      }
    } else {
      const fs = await import('fs');
      const dir = 'public/uploads/properties';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      for (const file of imageFiles) {
        const ext = ((file as any).name || 'img').split('.').pop() || 'jpg';
        const filename = `${owner.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(`${dir}/${filename}`, Buffer.from(arrayBuffer));
        newImages.push(`/uploads/properties/${filename}`);
      }
    }
  }
  const currentImages = property.images || [];
  const finalImages = [...currentImages];
  if (coverUrl) finalImages.unshift(coverUrl);
  if (newImages.length) finalImages.push(...newImages);
  if (finalImages.length) data.images = Array.from(new Set(finalImages));

  await prisma.property.update({ where: { id }, data });
  return redirect(`/dashboard/provider`);
}

export default function EditProperty() {
  const { property } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
          <Link to="/dashboard/provider" className="inline-flex items-center px-4 py-2 border rounded">Back</Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Form method="post" encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="intent" value="update" />
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" defaultValue={property.name} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select name="type" defaultValue={property.type} className="w-full border rounded px-3 py-2">
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
              <textarea name="description" defaultValue={property.description || ''} rows={3} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="address" defaultValue={property.address || ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State/Province</label>
              <input name="state" defaultValue={property.state || ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input name="city" defaultValue={property.city || ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input name="country" defaultValue={property.country || ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input name="postalCode" defaultValue={property.postalCode || ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input name="latitude" defaultValue={property.latitude ?? ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input name="longitude" defaultValue={property.longitude ?? ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Price (PKR)</label>
              <input name="basePrice" type="number" step="1" min="0" defaultValue={property.basePrice} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cleaning Fee</label>
              <input name="cleaningFee" type="number" step="1" min="0" defaultValue={property.cleaningFee ?? 0} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Fee</label>
              <input name="service" type="number" step="1" min="0" defaultValue={property.serviceFee ?? 0} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate</label>
              <input name="taxRate" type="number" step="0.01" min="0" defaultValue={property.taxRate ?? 0} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input name="currency" defaultValue={property.currency || 'PKR'} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weekend Pricing Multiplier</label>
              <input name="weekendPricing" type="number" step="0.01" min="0" defaultValue={property.weekendPricing ?? ''} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weekly Discount (%)</label>
              <input name="weeklyDiscount" type="number" step="0.1" min="0" defaultValue={property.weeklyDiscount ?? 0} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Discount (%)</label>
              <input name="monthlyDiscount" type="number" step="0.1" min="0" defaultValue={property.monthlyDiscount ?? 0} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Guests</label>
              <input name="maxGuests" type="number" min="1" defaultValue={property.maxGuests} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input name="bedrooms" type="number" min="1" defaultValue={property.bedrooms} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bathrooms</label>
              <input name="bathrooms" type="number" min="1" defaultValue={property.bathrooms} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beds</label>
              <input name="beds" type="number" min="0" defaultValue={property.beds ?? 0} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Stay (nights)</label>
              <input name="minStay" type="number" min="1" defaultValue={property.minStay} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Stay (nights)</label>
              <input name="maxStay" type="number" min="1" defaultValue={property.maxStay} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Advance Notice (hours)</label>
              <input name="advanceNotice" type="number" min="0" defaultValue={property.advanceNotice} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-in Time</label>
              <input name="checkInTime" defaultValue={property.checkInTime || '15:00'} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-out Time</label>
              <input name="checkOutTime" defaultValue={property.checkOutTime || '11:00'} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
                <input name="amenities" defaultValue={(property.amenities || []).join(', ')} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Safety Features</label>
                <input name="safetyFeatures" defaultValue={(property.safetyFeatures || []).join(', ')} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accessibility</label>
                <input name="accessibility" defaultValue={(property.accessibility || []).join(', ')} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">House Rules</label>
                <input name="houseRules" defaultValue={(property.houseRules || []).join(', ')} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Cover Image URL (optional)</label>
              <input name="imageUrl" className="w-full border rounded px-3 py-2" placeholder="https://.../image.jpg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Upload Images (append)</label>
              <input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="available" defaultChecked={property.available} className="h-4 w-4" /> Available
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="instantBook" defaultChecked={property.instantBook} className="h-4 w-4" /> Instant Book
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="selfCheckIn" defaultChecked={property.selfCheckIn} className="h-4 w-4" /> Self Check-in
              </label>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
                Save Changes
              </button>
            </div>
          </Form>
          {Array.isArray(property.images) && property.images.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Current Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {property.images.map((src: string, idx: number) => (
                  <img key={idx} src={src} className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

