import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useRevalidator } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { getUserId } from "~/lib/auth/auth.server";
import { ChatInterface } from "~/components/chat";
import { useState } from "react";
import { 
  Star, 
  MapPin, 
  Users, 
  Car, 
  Shield, 
  Heart, 
  Share2, 
  Calendar,
  Fuel,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

// ========================================
// LOADER
// ========================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  
  try {
    const vehicleId = params.id;
    
    if (!vehicleId) {
      throw new Error("Vehicle ID required");
    }

    // Try to get vehicle details from database
    let vehicle;
    try {
      vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          owner: {
            select: {
              id: true,
              businessName: true,
              verified: true,
              totalBookings: true,
              user: {
                select: {
                  name: true,
                  avatar: true,
                  phone: true
                }
              }
            }
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, using fallback data:", dbError);
      // Fallback to mock data when database is not available
      vehicle = {
        id: vehicleId,
        name: "Honda BRV",
        model: "BRV",
        year: 2022,
        mileage: 15000,
        images: ["/brv.png", "/car.jpg"],
        pricePerDay: 15000,
        category: "SUV",
        transmission: "Automatic",
        fuelType: "Gasoline",
        city: "Islamabad",
        country: "Pakistan",
        features: ["Air Conditioning", "GPS Navigation", "Bluetooth", "USB Charging"],
        passengers: 7,
        luggage: 3,
        fuelEfficiency: 12,
        available: true,
        owner: {
          id: "owner-1",
          businessName: "Khan Rentals",
          verified: true,
          averageRating: 4.5,
          totalBookings: 200,
          user: {
            name: "Ali Khan",
            avatar: null,
            phone: "+92 300 1234567"
          }
        },
        reviews: []
      };
    }

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Calculate average rating
    const averageRating = vehicle.reviews.length > 0 
      ? vehicle.reviews.reduce((sum, review) => sum + review.rating, 0) / vehicle.reviews.length
      : 0;

    // Wishlist state for current user
    let isWishlisted = false;
    try {
      const userIdFn = (await import('~/lib/auth/auth.server')).getUserId;
      const uid = await userIdFn(request);
      if (uid) {
        const w = await prisma.wishlist.findFirst({ where: { userId: uid, vehicleIds: { has: vehicleId } } });
        isWishlisted = !!w;
      }
    } catch {}

    // Return vehicle data that matches the actual schema
    return json({
      vehicle: {
        ...vehicle,
        owner: {
          ...vehicle.owner,
          name: vehicle.owner.user.name,
          avatar: vehicle.owner.user.avatar,
          phone: vehicle.owner.user.phone,
          rating: vehicle.owner.averageRating || 0,
          reviewCount: vehicle.owner.totalBookings || 0,
          isVerified: vehicle.owner.verified || false
        },
        rating: averageRating,
        reviewCount: vehicle.reviews.length,
        images: vehicle.images || ['/placeholder-vehicle.jpg'],
        price: vehicle.basePrice,
        location: `${vehicle.city}, ${vehicle.country}`,
        features: vehicle.features || [
          'Air Conditioning',
          'GPS Navigation',
          'Bluetooth',
          'USB Charging'
        ],
        safetyFeatures: vehicle.safetyFeatures || [
          'Airbags',
          'ABS Brakes',
          'Backup Camera',
          'Emergency Kit'
        ],
        included: [
          'Professional driver',
          'Comprehensive Insurance',
          'Roadside Assistance',
          '24/7 Support',
          'Free Cancellation'
        ],
        notIncluded: [
          'Fuel costs',
          'Tolls and parking',
          'Refreshments & tips',
          'GPS rental (if not included)'
        ],
        requirements: [
          'Accurate pickup location and time',
          'Valid contact number',
          'Prepayment or deposit method',
          'Adherence to local transport regulations'
        ],
        availability: 'Available',
        nextAvailableDate: 'Tomorrow',
        isFavorite: isWishlisted
      }
    });
  } catch (error) {
    console.error("Error in vehicle detail loader:", error);
    throw new Response("Failed to load vehicle details", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function VehicleDetailPage() {
  const { vehicle } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(Boolean((vehicle as any).isFavorite));
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(vehicle.location);
  const [chatOpen, setChatOpen] = useState(false);

  const handleFavoriteToggle = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await fetch('/api/wishlist.toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: 'vehicle', serviceId: vehicle.id, action: next ? 'add' : 'remove' })
      });
      revalidator.revalidate();
    } catch {
      setIsFavorite(!next);
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const getVehicleTypeColor = (type: string) => {
    const colors = {
      CAR: 'bg-[#01502E]',
      SUV: 'bg-green-500',
      VAN: 'bg-purple-500',
      BUS: 'bg-orange-500',
      MOTORCYCLE: 'bg-red-500',
      LUXURY_CAR: 'bg-yellow-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const calculateDays = () => {
    if (!selectedStartDate || !selectedEndDate) return 1;
    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const totalPrice = vehicle.price * calculateDays();

  const handleContactOwner = async () => {
    try {
      const receiverId = vehicle.owner.id;
      const form = new FormData();
      form.append('intent', 'send');
      form.append('receiverId', receiverId);
      form.append('content', `Hi ${vehicle.owner.name}, I have a question about ${vehicle.brand} ${vehicle.model}.`);
      form.append('bookingType', 'vehicle');
      await fetch('/api/messages', { method: 'POST', body: form });
      window.location.href = `/dashboard/messages?peerId=${receiverId}`;
    } catch {}
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-4">
        <div className="inline-flex items-center gap-2 bg-[#01502E]/10 text-[#01502E] text-xs font-medium px-3 py-1 rounded-full">
          <span>Includes professional driver</span>
        </div>
      </div>
      {/* Hero Section */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        {/* Main Image */}
        <img
          src={vehicle.images[currentImageIndex] || '/placeholder-vehicle.jpg'}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-8 lg:p-12">
            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`${getVehicleTypeColor(vehicle.type)} text-white text-sm font-semibold px-3 py-1 rounded-full`}>
                  {vehicle.type}
                </span>
                <span className="bg-[#01502E] text-white text-sm font-semibold px-3 py-1 rounded-full">
                  {vehicle.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </h1>

              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-white">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-5 h-5" />
                  <span>{vehicle.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-5 h-5" />
                  <span>{vehicle.seats} seats</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Fuel className="w-5 h-5" />
                  <span>{vehicle.fuelType}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Settings className="w-5 h-5" />
                  <span>{vehicle.transmission}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                  <span>{vehicle.rating.toFixed(1)} ({vehicle.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Owner Info */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {vehicle.owner.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{vehicle.owner.name}</span>
                      {vehicle.owner.isVerified && (
                        <Shield className="w-4 h-4 text-[#01502E]" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                      <span className="text-sm text-white/80">
                        {vehicle.owner.rating.toFixed(1)} ({vehicle.owner.reviewCount} rentals)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Thumbnails */}
        {vehicle.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {vehicle.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageClick(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === currentImageIndex ? 'border-white' : 'border-white/50'
                }`}
              >
                <img
                  src={image}
                  alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={handleFavoriteToggle}
            className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'
              }`}
            />
          </button>
          <button className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vehicle Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this vehicle</h2>
              <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Owner */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Questions?</h3>
              <p className="text-gray-700 mb-3">Contact the owner to ask about availability or details.</p>
              <button onClick={() => setChatOpen(true)} className="px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#013d23]">Contact Owner</button>
            </div>

            {/* Safety Features */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Safety Features</h3>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.safetyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#01502E]" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's included</h3>
              <div className="space-y-2">
                {vehicle.included.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Not Included */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's not included</h3>
              <div className="space-y-2">
                {vehicle.notIncluded.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
              <div className="space-y-2">
                {vehicle.requirements.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Meet your host</h3>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-700">
                    {vehicle.owner.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{vehicle.owner.name}</h4>
                    {vehicle.owner.isVerified && (
                      <Shield className="w-5 h-5 text-[#01502E]" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {vehicle.owner.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {vehicle.owner.reviewCount} successful rentals
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">Professional vehicle rental service with excellent customer satisfaction.</p>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Business: {vehicle.owner.businessName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews</h3>
              <div className="space-y-4">
                {vehicle.reviewCount > 0 ? (
                  <div className="space-y-4">
                    {/* Review summary */}
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {vehicle.rating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(vehicle.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          Based on {vehicle.reviewCount} reviews
                        </p>
                      </div>
                    </div>
                    
                    {/* Individual reviews */}
                    <div className="space-y-4">
                      {vehicle.reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {review.user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{review.user.name}</div>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No reviews yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Booking Card */}
              <div className="bg-white rounded-lg shadow-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      PKR {vehicle.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">per day</div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    min={selectedStartDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="Enter pickup location"
                  />
                </div>

                {/* Total Price */}
                <div className="flex items-center justify-between mb-6 py-3 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Total ({calculateDays()} days)</span>
                  <span className="text-xl font-bold text-gray-900">PKR {Math.round(totalPrice).toLocaleString()}</span>
                </div>

                {/* Book Button */}
                <Link 
                  to={`/book/vehicle/${vehicle.id}?startDate=${selectedStartDate}&endDate=${selectedEndDate}&pickupLocation=${encodeURIComponent(selectedLocation)}`}
                  className="block w-full"
                >
                  <button className="w-full bg-[#01502E] text-white py-3 rounded-lg font-semibold hover:bg-[#013d23] transition-all duration-200 transform hover:scale-105 shadow-lg">
                    Book Now
                  </button>
                </Link>

                {/* Availability Status */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {vehicle.availability === 'Available' && 'Available'}
                      {vehicle.availability === 'Limited' && 'Limited availability'}
                      {vehicle.availability === 'Fully Booked' && 'Fully booked'}
                    </span>
                  </div>
                </div>

                {/* Contact Owner */}
                <div className="mt-4">
                  <button onClick={handleContactOwner} className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                    Contact Owner
                  </button>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Vehicle Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">{vehicle.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Seats</span>
                    <span className="font-medium">{vehicle.seats}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Transmission</span>
                    <span className="font-medium">{vehicle.transmission}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fuel Type</span>
                    <span className="font-medium">{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Year</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                </div>
              </div>

              {/* Rental Terms */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Rental Terms</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Minimum rental: 1 day</li>
                  <li>Mileage limit: 200 km/day; extra mileage charged</li>
                  <li>Fuel policy: Full-to-Full</li>
                  <li>Deposit required at pickup</li>
                  <li>Airport pickup available</li>
                </ul>
              </div>

              {/* Insurance Options */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Insurance Options</h4>
              <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Basic Insurance (included)</span>
                    <span className="text-gray-900">PKR {(vehicle as any).insuranceFee?.toLocaleString?.() || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Premium Insurance (optional)</span>
                    <span className="text-gray-900">PKR {(vehicle as any).insuranceFee?.toLocaleString?.() || '0'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Coverage includes damage waiver; check provider policy for excess/deductible amounts.</p>
                </div>
              </div>

              {/* Location & Pickup */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Location & Pickup</h4>
                <p className="text-sm text-gray-700 mb-2">Pickup Location: {vehicle.location}</p>
                <div className="w-full h-56 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500">Map placeholder</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        targetUserId={(vehicle as any).owner?.id}
        initialMessage={`Hi ${vehicle.owner.name}, I'm interested in your ${vehicle.brand} ${vehicle.model}.${selectedStartDate && selectedEndDate ? ` Dates: ${selectedStartDate} to ${selectedEndDate}.` : ''}`}
      />
    </div>
  );
}
