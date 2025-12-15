import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
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
      propertyFacilities: true,
      safetyFeatures: true,
      accessibility: true,
      houseRules: true,
      images: true,
      mainImage: true,
      videos: true,
      floorPlan: true,
      virtualTour: true,
      approvalStatus: true,
      starRating: true,
    }
  });
  if (!property) throw redirect("/dashboard/provider");

  // Verify ownership - auto-create PropertyOwner if missing
  let owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true } });
  
  if (!owner) {
    // Auto-create PropertyOwner if it doesn't exist (user has PROPERTY_OWNER role)
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });
    
    owner = await prisma.propertyOwner.create({
      data: {
        userId,
        businessName: userData?.name || "My Business",
        businessType: "individual",
        businessPhone: userData?.phone || "",
        businessEmail: userData?.email || "",
        businessAddress: "",
        businessCity: "",
        businessState: "",
        businessCountry: "",
        businessPostalCode: "",
        verified: false,
      },
    });
  }
  
  // Debug: Log ownership check
  console.log('[Edit Property Loader] Ownership check:', {
    propertyOwnerId: property.ownerId,
    ownerId: owner.id,
    match: property.ownerId === owner.id,
    propertyId: property.id,
    userId
  });
  
  // If ownership doesn't match, check if we need to update the property's ownerId
  if (property.ownerId !== owner.id) {
    // Update the property to link it to the current owner
    await prisma.property.update({
      where: { id: property.id },
      data: { ownerId: owner.id }
    });
    console.log('[Edit Property Loader] Updated property ownerId to match current owner');
  }

  return json({ user, property });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const id = params.id as string;
  if (!id) return json({ error: "Invalid property" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") return json({ error: "Not authorized" }, { status: 403 });

  const property = await prisma.property.findUnique({ where: { id }, select: { ownerId: true, images: true } });
  let owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true } });
  
  // Auto-create PropertyOwner if it doesn't exist
  if (!owner) {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });
    
    owner = await prisma.propertyOwner.create({
      data: {
        userId,
        businessName: userData?.name || "My Business",
        businessType: "individual",
        businessPhone: userData?.phone || "",
        businessEmail: userData?.email || "",
        businessAddress: "",
        businessCity: "",
        businessState: "",
        businessCountry: "",
        businessPostalCode: "",
        verified: false,
      },
    });
  }
  
  if (!property || property.ownerId !== owner.id) return json({ error: "Invalid property" }, { status: 403 });

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
  const errors: Record<string, string> = {};
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
  const propertyFacilities = parseArray(form.get("propertyFacilities") as string | null);
  const safety = parseArray(form.get("safetyFeatures") as string | null);
  const access = parseArray(form.get("accessibility") as string | null);
  const rules = parseArray(form.get("houseRules") as string | null);
  if (amenities) data.amenities = amenities;
  if (propertyFacilities) data.propertyFacilities = propertyFacilities;
  if (safety) data.safetyFeatures = safety;
  if (access) data.accessibility = access;
  if (rules) data.houseRules = rules;

  // Star Rating
  const starRating = form.get("starRating") as string | null;
  if (starRating !== null && starRating !== "") {
    const rating = parseInt(starRating, 10);
    if (rating >= 1 && rating <= 5) {
      data.starRating = rating;
    }
  } else {
    data.starRating = null;
  }

  // Main Image
  const mainImage = form.get("mainImage") as string | null;
  if (mainImage !== null && mainImage.trim() !== "") {
    data.mainImage = mainImage.trim();
  }

  // Validations
  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    errors.latitude = "Latitude must be between -90 and 90";
  }
  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    errors.longitude = "Longitude must be between -180 and 180";
  }
  if (data.basePrice !== undefined && data.basePrice < 0) {
    errors.basePrice = "Base price cannot be negative";
  }
  if (data.cleaningFee !== undefined && data.cleaningFee < 0) {
    errors.cleaningFee = "Cleaning fee cannot be negative";
  }
  if (data.serviceFee !== undefined && data.serviceFee < 0) {
    errors.serviceFee = "Service fee cannot be negative";
  }
  if (data.taxRate !== undefined && (data.taxRate < 0 || data.taxRate > 1)) {
    errors.taxRate = "Tax rate should be a fraction (e.g., 0.02 for 2%)";
  }
  if (data.weekendPricing !== undefined && data.weekendPricing < 0.5) {
    errors.weekendPricing = "Weekend multiplier should be >= 0.5 (typical 1.1–1.5)";
  }
  if (data.weeklyDiscount !== undefined && (data.weeklyDiscount < 0 || data.weeklyDiscount > 100)) {
    errors.weeklyDiscount = "Weekly discount should be 0–100 (%)";
  }
  if (data.monthlyDiscount !== undefined && (data.monthlyDiscount < 0 || data.monthlyDiscount > 100)) {
    errors.monthlyDiscount = "Monthly discount should be 0–100 (%)";
  }
  if (data.minStay !== undefined && data.minStay < 1) {
    errors.minStay = "Min stay must be at least 1 night";
  }
  if (data.maxStay !== undefined && data.maxStay < 1) {
    errors.maxStay = "Max stay must be at least 1 night";
  }
  if (data.minStay !== undefined && data.maxStay !== undefined && data.maxStay < data.minStay) {
    errors.maxStay = "Max stay must be greater than or equal to min stay";
  }
  if (data.advanceNotice !== undefined && data.advanceNotice < 0) {
    errors.advanceNotice = "Advance notice cannot be negative";
  }
  if (Object.keys(errors).length) {
    return json({ errors }, { status: 400 });
  }

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
  return redirect(`/dashboard/provider?updated=1`);
}

export default function EditProperty() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as any;
  
  // Debug: Log to ensure component is rendering
  console.log('EditProperty component rendering', { hasLoaderData: !!loaderData, hasProperty: !!loaderData?.property });
  
  // Safety check
  if (!loaderData || !loaderData.property) {
    return (
      <div className="w-full py-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Property Not Found</h1>
          <Link to="/dashboard/provider" className="inline-flex items-center px-4 py-2 border border-gray-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  const { property } = loaderData;
  
  return (
    <div className="w-full py-4 sm:py-6 lg:py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Property: {property.name}</h1>
          <Link 
            to="/dashboard/provider" 
            className="inline-flex items-center px-4 py-2 border border-gray-300"
          >
            ← Back
          </Link>
        </div>
        <div className="bg-white">
          {actionData?.errors && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700">
              <div className="font-semibold mb-1">Please fix the following:</div>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(actionData.errors).map(([k, v]) => (
                  <li key={k}>{v as any}</li>
                ))}
              </ul>
            </div>
          )}
          {actionData?.error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700">
              <div className="font-semibold">{actionData.error}</div>
            </div>
          )}
          <form
            method="post"
            action="."
            encType="multipart/form-data"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input type="hidden" name="intent" value="update" />
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={property.name} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <input type="hidden" name="type" id="type-value" defaultValue={property.type} />
              <Select defaultValue={property.type} onValueChange={(value) => {
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
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={property.description || ''} rows={3} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={property.address || ''} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input id="state" name="state" defaultValue={property.state || ''} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={property.city || ''} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={property.country || ''} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" defaultValue={property.postalCode || ''} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" name="latitude" type="number" step="0.000001" defaultValue={property.latitude ?? ''} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Range -90 to 90</p>
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" name="longitude" type="number" step="0.000001" defaultValue={property.longitude ?? ''} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Range -180 to 180</p>
            </div>
            <div>
              <Label htmlFor="basePrice">Base Price (PKR)</Label>
              <Input id="basePrice" name="basePrice" type="number" step="1" min="0" defaultValue={property.basePrice} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cleaningFee">Cleaning Fee</Label>
              <Input id="cleaningFee" name="cleaningFee" type="number" step="1" min="0" defaultValue={property.cleaningFee ?? 0} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="service">Service Fee</Label>
              <Input id="service" name="service" type="number" step="1" min="0" defaultValue={property.serviceFee ?? 0} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate</Label>
              <Input id="taxRate" name="taxRate" type="number" step="0.01" min="0" defaultValue={property.taxRate ?? 0} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Use fractional value (e.g., 0.02 for 2%)</p>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={property.currency || 'PKR'} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="weekendPricing">Weekend Pricing Multiplier</Label>
              <Input id="weekendPricing" name="weekendPricing" type="number" step="0.01" min="0" defaultValue={property.weekendPricing ?? ''} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Typical 1.1–1.5; 1.0 means no change</p>
            </div>
            <div>
              <Label htmlFor="weeklyDiscount">Weekly Discount (%)</Label>
              <Input id="weeklyDiscount" name="weeklyDiscount" type="number" step="0.1" min="0" defaultValue={property.weeklyDiscount ?? 0} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">0–100</p>
            </div>
            <div>
              <Label htmlFor="monthlyDiscount">Monthly Discount (%)</Label>
              <Input id="monthlyDiscount" name="monthlyDiscount" type="number" step="0.1" min="0" defaultValue={property.monthlyDiscount ?? 0} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">0–100</p>
            </div>
            <div>
              <Label htmlFor="maxGuests">Max Guests</Label>
              <Input id="maxGuests" name="maxGuests" type="number" min="1" defaultValue={property.maxGuests} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min="1" defaultValue={property.bedrooms} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min="1" defaultValue={property.bathrooms} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="beds">Beds</Label>
              <Input id="beds" name="beds" type="number" min="0" defaultValue={property.beds ?? 0} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="minStay">Min Stay (nights)</Label>
              <Input id="minStay" name="minStay" type="number" min="1" defaultValue={property.minStay} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Must be at least 1 night</p>
            </div>
            <div>
              <Label htmlFor="maxStay">Max Stay (nights)</Label>
              <Input id="maxStay" name="maxStay" type="number" min="1" defaultValue={property.maxStay} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Should be ≥ Min Stay</p>
            </div>
            <div>
              <Label htmlFor="advanceNotice">Advance Notice (hours)</Label>
              <Input id="advanceNotice" name="advanceNotice" type="number" min="0" defaultValue={property.advanceNotice} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">0 for none</p>
            </div>
            <div>
              <Label htmlFor="checkInTime">Check-in Time</Label>
              <Input id="checkInTime" name="checkInTime" defaultValue={property.checkInTime || '15:00'} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="checkOutTime">Check-out Time</Label>
              <Input id="checkOutTime" name="checkOutTime" defaultValue={property.checkOutTime || '11:00'} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="starRating">Star Rating (1-5)</Label>
              <input type="hidden" name="starRating" id="starRating-value" defaultValue={property.starRating?.toString() || '0'} />
              <Select defaultValue={property.starRating?.toString() || '0'} onValueChange={(value) => {
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
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amenities">Amenities (comma separated)</Label>
                <Input id="amenities" name="amenities" defaultValue={(property.amenities || []).join(', ')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="propertyFacilities">Property Facilities</Label>
                <Input id="propertyFacilities" name="propertyFacilities" defaultValue={(property.propertyFacilities || []).join(', ')} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">General property facilities (restaurant, gym, pool, etc.)</p>
              </div>
              <div>
                <Label htmlFor="safetyFeatures">Safety Features</Label>
                <Input id="safetyFeatures" name="safetyFeatures" defaultValue={(property.safetyFeatures || []).join(', ')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="accessibility">Accessibility</Label>
                <Input id="accessibility" name="accessibility" defaultValue={(property.accessibility || []).join(', ')} className="mt-1" />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="houseRules">House Rules</Label>
                <Input id="houseRules" name="houseRules" defaultValue={(property.houseRules || []).join(', ')} className="mt-1" />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="mainImage">Main Image URL (Primary display image)</Label>
              <Input id="mainImage" name="mainImage" defaultValue={property.mainImage || ''} placeholder="https://.../main-image.jpg" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="imageUrl">Cover Image URL (Additional images)</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://.../image.jpg" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="images">Upload Images (append)</Label>
              <Input id="images" name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" className="mt-1" />
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
              <Button type="submit" className="bg-[#01502E] hover:bg-[#013d23]">
                Save Changes
              </Button>
            </div>
          </form>
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
