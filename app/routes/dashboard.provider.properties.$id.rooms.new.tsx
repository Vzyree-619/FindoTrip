import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigate } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;

  if (!propertyId) {
    throw new Response("Property ID is required", { status: 400 });
  }

  // Verify user owns this property
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      owner: {
        userId: userId
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          businessName: true
        }
      }
    }
  });

  if (!property) {
    throw new Response("Property not found or unauthorized", { status: 403 });
  }

  // Get available amenities for reference
  const commonAmenities = {
    bathroom: ['Private Bathroom', 'Bathtub', 'Shower', 'Hairdryer', 'Toiletries'],
    roomFeatures: ['Air Conditioning', 'Heating', 'Soundproofing', 'Blackout Curtains'],
    entertainment: ['Flat Screen TV', 'Cable Channels', 'WiFi', 'Bluetooth Speaker'],
    comfort: ['Mini Bar', 'Coffee Maker', 'Mini Fridge', 'Safe', 'Iron & Board'],
    view: ['Private Balcony', 'City View', 'Ocean View', 'Garden View']
  };

  return json({ property, commonAmenities });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const propertyId = params.id;

  if (!propertyId) {
    return json({ error: "Property ID is required" }, { status: 400 });
  }

  // Verify user owns this property
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      owner: {
        userId: userId
      }
    }
  });

  if (!property) {
    return json({ error: "Property not found or unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();

  // Validation
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const basePrice = parseFloat(formData.get('basePrice') as string);

  if (!name || name.length < 5) {
    return json({ error: "Room name must be at least 5 characters" }, { status: 400 });
  }

  if (!description || description.length < 50) {
    return json({ error: "Description must be at least 50 characters" }, { status: 400 });
  }

  if (!basePrice || basePrice <= 0) {
    return json({ error: "Price must be greater than 0" }, { status: 400 });
  }

  const totalUnits = parseInt(formData.get('totalUnits') as string);
  if (!totalUnits || totalUnits <= 0) {
    return json({ error: "Total units must be greater than 0" }, { status: 400 });
  }

  // Parse arrays
  let images: string[] = [];
  try {
    const imagesStr = formData.get('images') as string;
    if (imagesStr) {
      images = JSON.parse(imagesStr);
    }
  } catch (e) {
    // If not JSON, try as single value
    const singleImage = formData.get('images') as string;
    if (singleImage) images = [singleImage];
  }

  if (images.length === 0) {
    return json({ error: "At least one image is required" }, { status: 400 });
  }

  let amenities: string[] = [];
  try {
    const amenitiesStr = formData.get('amenities') as string;
    if (amenitiesStr) {
      amenities = JSON.parse(amenitiesStr);
    }
  } catch (e) {
    // Handle as array of form values
    const amenityValues = formData.getAll('amenities');
    amenities = amenityValues.map(a => a.toString());
  }

  let features: string[] = [];
  try {
    const featuresStr = formData.get('features') as string;
    if (featuresStr) {
      features = JSON.parse(featuresStr);
    }
  } catch (e) {
    const featureValues = formData.getAll('features');
    features = featureValues.map(f => f.toString());
  }

  // Create room
  try {
    const room = await prisma.roomType.create({
      data: {
        propertyId,
        name,
        description,
        bedType: formData.get('bedType') as string || 'King',
        numberOfBeds: parseInt(formData.get('numberOfBeds') as string) || 1,
        bedConfiguration: formData.get('bedConfiguration') as string || '1 King Bed',
        maxOccupancy: parseInt(formData.get('maxOccupancy') as string) || 2,
        adults: parseInt(formData.get('adults') as string) || 2,
        children: parseInt(formData.get('children') as string) || 0,
        roomSize: formData.get('roomSize') ? parseFloat(formData.get('roomSize') as string) : null,
        roomSizeUnit: formData.get('roomSizeUnit') as string || 'sqm',
        floor: formData.get('floor') as string || null,
        view: formData.get('view') as string || null,
        images: images,
        mainImage: images[0] || null,
        amenities: amenities,
        features: features,
        basePrice,
        currency: formData.get('currency') as string || property.currency || 'PKR',
        weekendPrice: formData.get('weekendPrice') ? parseFloat(formData.get('weekendPrice') as string) : null,
        discountPercent: formData.get('discountPercent') ? parseFloat(formData.get('discountPercent') as string) : null,
        specialOffer: formData.get('specialOffer') as string || null,
        totalUnits,
        smokingAllowed: formData.get('smokingAllowed') === 'on',
        petsAllowed: formData.get('petsAllowed') === 'on',
        available: true
      }
    });

    // Update property total rooms count
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        totalRooms: {
          increment: totalUnits
        }
      }
    });

    return redirect(`/dashboard/provider/properties/${propertyId}/rooms`);
  } catch (error: any) {
    console.error("Error creating room:", error);
    return json({ error: error.message || "Failed to create room" }, { status: 500 });
  }
}

export default function NewRoomType() {
  const { property, commonAmenities } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      setSelectedAmenities(prev => [...prev, customAmenity.trim()]);
      setCustomAmenity("");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // TODO: Implement actual image upload to Cloudinary or storage
    // For now, just add placeholder URLs
    const newImages = Array.from(files).map(file => {
      // In production, upload to Cloudinary and get URL
      return URL.createObjectURL(file);
    });

    setImages(prev => [...prev, ...newImages]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Room Type</h1>
          <p className="text-gray-600 mt-2">Property: {property.name}</p>
        </div>

        {/* Error Message */}
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {actionData.error}
          </div>
        )}

        {/* Form */}
        <Form method="post" className="bg-white rounded-lg shadow-md p-6 space-y-8">
          {/* Hidden fields for arrays */}
          <input type="hidden" name="amenities" value={JSON.stringify(selectedAmenities)} />
          <input type="hidden" name="features" value={JSON.stringify(selectedFeatures)} />
          <input type="hidden" name="images" value={JSON.stringify(images)} />

          {/* Basic Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-1">
                  Room Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  required
                  minLength={5}
                  placeholder="e.g., Deluxe King Room, Executive Suite"
                />
              </div>

              <div>
                <Label htmlFor="description" className="mb-1">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  minLength={50}
                  rows={4}
                  placeholder="Detailed description of this room type..."
                />
              </div>
            </div>
          </section>

          {/* Bed Configuration */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bed Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedType" className="mb-1">Bed Type</Label>
                <input type="hidden" name="bedType" id="bedType-value" defaultValue="King" />
                <Select defaultValue="King" onValueChange={(value) => {
                  const hiddenInput = document.getElementById('bedType-value') as HTMLInputElement;
                  if (hiddenInput) hiddenInput.value = value;
                }}>
                  <SelectTrigger id="bedType" className="w-full">
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="King">King</SelectItem>
                    <SelectItem value="Queen">Queen</SelectItem>
                    <SelectItem value="Twin">Twin</SelectItem>
                    <SelectItem value="Double">Double</SelectItem>
                    <SelectItem value="Single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numberOfBeds" className="mb-1">Number of Beds</Label>
                <Input
                  id="numberOfBeds"
                  type="number"
                  name="numberOfBeds"
                  min="1"
                  defaultValue={1}
                />
              </div>

              <div>
                <Label htmlFor="bedConfiguration" className="mb-1">Bed Configuration</Label>
                <Input
                  id="bedConfiguration"
                  type="text"
                  name="bedConfiguration"
                  placeholder="e.g., 1 King Bed"
                  defaultValue="1 King Bed"
                />
              </div>
            </div>
          </section>

          {/* Capacity */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Capacity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxOccupancy" className="mb-1">Maximum Occupancy *</Label>
                <Input
                  id="maxOccupancy"
                  type="number"
                  name="maxOccupancy"
                  min="1"
                  required
                  defaultValue={2}
                />
              </div>

              <div>
                <Label htmlFor="adults" className="mb-1">Recommended Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  name="adults"
                  min="1"
                  defaultValue={2}
                />
              </div>

              <div>
                <Label htmlFor="children" className="mb-1">Max Children</Label>
                <Input
                  id="children"
                  type="number"
                  name="children"
                  min="0"
                  defaultValue={0}
                />
              </div>
            </div>
          </section>

          {/* Room Size & Details */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Size & Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="roomSize" className="mb-1">Room Size</Label>
                <div className="flex gap-2">
                  <Input
                    id="roomSize"
                    type="number"
                    name="roomSize"
                    step="0.1"
                    placeholder="35"
                    className="flex-1"
                  />
                  <input type="hidden" name="roomSizeUnit" id="roomSizeUnit-value" defaultValue="sqm" />
                  <Select defaultValue="sqm" onValueChange={(value) => {
                    const hiddenInput = document.getElementById('roomSizeUnit-value') as HTMLInputElement;
                    if (hiddenInput) hiddenInput.value = value;
                  }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqm">sqm</SelectItem>
                      <SelectItem value="sqft">sqft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="floor" className="mb-1">Floor</Label>
                <Input
                  id="floor"
                  type="text"
                  name="floor"
                  placeholder="e.g., 5-10"
                />
              </div>

              <div>
                <Label htmlFor="view" className="mb-1">View</Label>
                <input type="hidden" name="view" id="view-value" defaultValue="" />
                <Select onValueChange={(value) => {
                  const hiddenInput = document.getElementById('view-value') as HTMLInputElement;
                  if (hiddenInput) hiddenInput.value = value;
                }}>
                  <SelectTrigger id="view" className="w-full">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select view</SelectItem>
                    <SelectItem value="City View">City View</SelectItem>
                    <SelectItem value="Ocean View">Ocean View</SelectItem>
                    <SelectItem value="Garden View">Garden View</SelectItem>
                    <SelectItem value="Mountain View">Mountain View</SelectItem>
                    <SelectItem value="Pool View">Pool View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Room Images */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Images *</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-[#01502E] hover:text-[#013d23] font-medium"
                  >
                    Click to upload or drag and drop
                  </label>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Room ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Room Amenities */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Amenities</h2>
            <div className="space-y-6">
              {Object.entries(commonAmenities).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">{category}</h3>
                  <div className="flex flex-wrap gap-3">
                    {items.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedAmenities.includes(item)}
                          onCheckedChange={() => toggleAmenity(item)}
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Amenity */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                  placeholder="Add custom amenity"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addCustomAmenity}
                  className="bg-[#01502E] hover:bg-[#013d23]"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice" className="mb-1">
                  Base Price (per night) *
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  name="basePrice"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency" className="mb-1">Currency</Label>
                <input type="hidden" name="currency" id="currency-value" defaultValue="PKR" />
                <Select defaultValue="PKR" onValueChange={(value) => {
                  const hiddenInput = document.getElementById('currency-value') as HTMLInputElement;
                  if (hiddenInput) hiddenInput.value = value;
                }}>
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weekendPrice" className="mb-1">
                  Weekend Price (optional)
                </Label>
                <Input
                  id="weekendPrice"
                  type="number"
                  name="weekendPrice"
                  step="0.01"
                  min="0"
                  placeholder="Friday & Saturday nights"
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  name="enableDiscount"
                />
                <span className="text-sm font-medium text-gray-700">Enable Discount</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountPercent" className="mb-1">
                    Discount Percentage
                  </Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    name="discountPercent"
                    min="0"
                    max="100"
                    placeholder="10"
                  />
                </div>

                <div>
                  <Label htmlFor="specialOffer" className="mb-1">Offer Name</Label>
                  <Input
                    id="specialOffer"
                    type="text"
                    name="specialOffer"
                    placeholder="e.g., Early Bird Special"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory & Availability</h2>
            <div>
              <Label htmlFor="totalUnits" className="mb-1">
                Total Number of This Room Type * (How many rooms of this type do you have?)
              </Label>
              <Input
                id="totalUnits"
                type="number"
                name="totalUnits"
                min="1"
                required
                defaultValue={1}
              />
            </div>
          </section>

          {/* Policies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Policies</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox
                  name="smokingAllowed"
                />
                <span className="text-sm text-gray-700">Smoking Allowed</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  name="petsAllowed"
                />
                <span className="text-sm text-gray-700">Pets Allowed</span>
              </label>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#01502E] hover:bg-[#013d23]"
            >
              Publish Room Type
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

