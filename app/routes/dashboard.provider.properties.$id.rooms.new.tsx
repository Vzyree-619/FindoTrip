import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigate } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";

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
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  minLength={5}
                  placeholder="e.g., Deluxe King Room, Executive Suite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  minLength={50}
                  rows={4}
                  placeholder="Detailed description of this room type..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Bed Configuration */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bed Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                <select
                  name="bedType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                >
                  <option value="King">King</option>
                  <option value="Queen">Queen</option>
                  <option value="Twin">Twin</option>
                  <option value="Double">Double</option>
                  <option value="Single">Single</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
                <input
                  type="number"
                  name="numberOfBeds"
                  min="1"
                  defaultValue={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Configuration</label>
                <input
                  type="text"
                  name="bedConfiguration"
                  placeholder="e.g., 1 King Bed"
                  defaultValue="1 King Bed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Capacity */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Capacity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Occupancy *</label>
                <input
                  type="number"
                  name="maxOccupancy"
                  min="1"
                  required
                  defaultValue={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Adults</label>
                <input
                  type="number"
                  name="adults"
                  min="1"
                  defaultValue={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Children</label>
                <input
                  type="number"
                  name="children"
                  min="0"
                  defaultValue={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Room Size & Details */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Size & Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Size</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="roomSize"
                    step="0.1"
                    placeholder="35"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                  <select
                    name="roomSizeUnit"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    <option value="sqm">sqm</option>
                    <option value="sqft">sqft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input
                  type="text"
                  name="floor"
                  placeholder="e.g., 5-10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
                <select
                  name="view"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                >
                  <option value="">Select view</option>
                  <option value="City View">City View</option>
                  <option value="Ocean View">Ocean View</option>
                  <option value="Garden View">Garden View</option>
                  <option value="Mountain View">Mountain View</option>
                  <option value="Pool View">Pool View</option>
                </select>
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
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(item)}
                          onChange={() => toggleAmenity(item)}
                          className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Amenity */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                  placeholder="Add custom amenity"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  className="px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (per night) *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                >
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekend Price (optional)
                </label>
                <input
                  type="number"
                  name="weekendPrice"
                  step="0.01"
                  min="0"
                  placeholder="Friday & Saturday nights"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enableDiscount"
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-sm font-medium text-gray-700">Enable Discount</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discountPercent"
                    min="0"
                    max="100"
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Name</label>
                  <input
                    type="text"
                    name="specialOffer"
                    placeholder="e.g., Early Bird Special"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory & Availability</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Number of This Room Type * (How many rooms of this type do you have?)
              </label>
              <input
                type="number"
                name="totalUnits"
                min="1"
                required
                defaultValue={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
              />
            </div>
          </section>

          {/* Policies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Policies</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="smokingAllowed"
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-sm text-gray-700">Smoking Allowed</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="petsAllowed"
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-sm text-gray-700">Pets Allowed</span>
              </label>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] font-semibold"
            >
              Publish Room Type
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

