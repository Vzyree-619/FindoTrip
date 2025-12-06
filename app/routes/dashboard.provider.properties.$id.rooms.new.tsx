import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigate } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { ArrowLeft, Upload, X, Plus, Home, Bed, Users, Ruler, Image as ImageIcon, Sparkles, DollarSign, Package, Shield } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-[#01502E] to-[#013d23] rounded-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Room Type</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Property: <span className="font-medium text-[#01502E] dark:text-[#4ade80]">{property.name}</span></p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {actionData?.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5" />
              <p className="font-medium">{actionData.error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <Form method="post" className="space-y-6">
          {/* Hidden fields for arrays */}
          <input type="hidden" name="amenities" value={JSON.stringify(selectedAmenities)} />
          <input type="hidden" name="features" value={JSON.stringify(selectedFeatures)} />
          <input type="hidden" name="images" value={JSON.stringify(images)} />

          {/* Basic Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#01502E] to-[#013d23] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                <CardTitle className="text-white">Basic Information</CardTitle>
              </div>
              <CardDescription className="text-green-100">Enter the room name and description</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          {/* Bed Configuration */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                <CardTitle className="text-white">Bed Configuration</CardTitle>
              </div>
              <CardDescription className="text-blue-100">Configure bed type and arrangement</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <CardTitle className="text-white">Capacity</CardTitle>
              </div>
              <CardDescription className="text-purple-100">Set maximum occupancy and guest limits</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          {/* Room Size & Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                <CardTitle className="text-white">Room Size & Details</CardTitle>
              </div>
              <CardDescription className="text-orange-100">Specify room dimensions and location details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
                <input type="hidden" name="view" id="view-value" defaultValue="none" />
                <Select defaultValue="none" onValueChange={(value) => {
                  const hiddenInput = document.getElementById('view-value') as HTMLInputElement;
                  if (hiddenInput) hiddenInput.value = value === "none" ? "" : value;
                }}>
                  <SelectTrigger id="view" className="w-full">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select view</SelectItem>
                    <SelectItem value="City View">City View</SelectItem>
                    <SelectItem value="Ocean View">Ocean View</SelectItem>
                    <SelectItem value="Garden View">Garden View</SelectItem>
                    <SelectItem value="Mountain View">Mountain View</SelectItem>
                    <SelectItem value="Pool View">Pool View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Room Images */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <CardTitle className="text-white">Room Images *</CardTitle>
              </div>
              <CardDescription className="text-pink-100">Upload high-quality photos of your room</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Main Image</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-[#01502E] dark:hover:border-[#4ade80] transition-colors bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-gradient-to-br from-[#01502E] to-[#013d23] rounded-full mb-4">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      multiple
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer text-[#01502E] dark:text-[#4ade80] hover:text-[#013d23] dark:hover:text-[#22c55e] font-semibold text-base mb-2"
                    >
                      Click to upload or drag and drop
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB each</p>
                  </div>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                        <img src={img} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </CardContent>
          </Card>

          {/* Room Amenities */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <CardTitle className="text-white">Room Amenities</CardTitle>
              </div>
              <CardDescription className="text-indigo-100">Select amenities and features available in this room</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
            <div className="space-y-6">
              {Object.entries(commonAmenities).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 capitalize border-b border-gray-200 dark:border-gray-700 pb-2">{category.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <div className="flex flex-wrap gap-3">
                    {items.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Checkbox
                          checked={selectedAmenities.includes(item)}
                          onCheckedChange={() => toggleAmenity(item)}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Amenity */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  className="bg-[#01502E] hover:bg-[#013d23] text-white"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <CardTitle className="text-white">Pricing</CardTitle>
              </div>
              <CardDescription className="text-emerald-100">Set your room rates and special offers</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <CardTitle className="text-white">Inventory & Availability</CardTitle>
              </div>
              <CardDescription className="text-cyan-100">Specify how many rooms of this type you have</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          {/* Policies */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <CardTitle className="text-white">Policies</CardTitle>
              </div>
              <CardDescription className="text-amber-100">Set room policies and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <Checkbox
                  name="smokingAllowed"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Smoking Allowed</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <Checkbox
                  name="petsAllowed"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pets Allowed</span>
              </label>
            </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#01502E] to-[#013d23] hover:from-[#013d23] hover:to-[#01502E] text-white shadow-lg w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Publish Room Type
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

