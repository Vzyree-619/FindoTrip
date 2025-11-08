import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useRevalidator } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { getUserId } from "~/lib/auth/auth.server";
import { ChatInterface } from "~/components/chat";
import ShareModal from "~/components/common/ShareModal";
import FloatingShareButton from "~/components/common/FloatingShareButton";
import { useState, useMemo, useEffect } from "react";
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Globe, 
  Shield, 
  Heart, 
  Share2, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface TourDetail {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  images: string[];
  price: number;
  originalPrice?: number;
  duration: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  category: 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Historical' | 'Wildlife';
  groupSize: {
    min: number;
    max: number;
  };
  languages: string[];
  location: string;
  meetingPoint: string;
  included: string[];
  notIncluded: string[];
  requirements: string[];
  guide: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    bio: string;
    languages: string[];
    experience: string;
  };
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  availability: 'Available' | 'Limited' | 'Fully Booked';
  nextAvailableDate?: string;
  weather?: {
    condition: string;
    temperature: number;
    icon: string;
  };
  isFavorite?: boolean;
  similarTours: TourDetail[];
}

interface LoaderData {
  tour: TourDetail;
}

// ========================================
// LOADER
// ========================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  
  // Get user data for chat functionality
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, avatar: true }
    });
  }
  
  try {
    const tourId = params.id;
    
    if (!tourId) {
      throw new Error("Tour ID required");
    }

    // Try to get tour details from database
    let tour;
    try {
      tour = await prisma.tour.findUnique({
        where: { id: tourId },
        include: {
          guide: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              yearsOfExperience: true,
              languages: true,
              averageRating: true,
              totalBookings: true,
              verified: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
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
      tour = {
        id: tourId,
        title: "Skardu Valley Adventure",
        description: "Experience the stunning landscapes of Skardu Valley with guided tours to lakes, deserts, and mountain peaks.",
        images: ["/tour.jpg", "/placeholder-tour.jpg"],
        pricePerPerson: 45000,
        currency: 'PKR',
        duration: 4,
        city: "Skardu",
        country: "Pakistan",
        type: "Adventure",
        difficulty: "Moderate",
        minGroupSize: 2,
        maxGroupSize: 12,
        languages: ["English", "Urdu"],
        meetingPoint: "Skardu Airport",
        inclusions: ["Professional guide", "All necessary equipment", "Transportation", "Lunch and refreshments"],
        exclusions: ["Personal expenses", "Gratuities", "Travel insurance"],
        requirements: ["Comfortable walking shoes", "Weather-appropriate clothing", "Valid ID"],
        timeSlots: ["09:00", "14:00"],
        guide: {
          id: "guide-1",
          firstName: "Ahmad",
          lastName: "Khan",
          yearsOfExperience: 5,
          languages: ["English", "Urdu"],
          averageRating: 4.8,
          totalBookings: 150,
          verified: true,
          user: {
            name: "Ahmad Khan",
            avatar: null
          }
        },
        reviews: []
      };
    }

    if (!tour) {
      throw new Error("Tour not found");
    }

    // Calculate average rating
    const averageRating = tour.reviews.length > 0 
      ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
      : 0;

    // Wishlist state for current user
    let isWishlisted = false;
    try {
      const userId = (await import('~/lib/auth/auth.server')).getUserId;
      const uid = await userId(request);
      if (uid) {
        const w = await prisma.wishlist.findFirst({ where: { userId: uid, tourIds: { has: tourId } } });
        isWishlisted = !!w;
      }
    } catch {}

    // Return simplified tour data that matches the actual schema
  return json({
      user,
      tour: {
        ...tour,
        guide: {
          ...tour.guide,
          name: tour.guide.user.name,
          avatar: tour.guide.user.avatar,
          userId: tour.guide.user?.id || tour.guide.id,
          rating: tour.guide.averageRating || 0,
          reviewCount: tour.guide.totalBookings || 0,
          isVerified: tour.guide.verified || false,
          bio: 'Experienced local guide with passion for sharing the best of our city.',
          experience: `${tour.guide.yearsOfExperience} years`
        },
        rating: averageRating,
        reviewCount: tour.reviews.length,
        images: tour.images || ['/placeholder-tour.jpg'],
        price: tour.pricePerPerson,
        duration: `${tour.duration} hours`,
        location: `${tour.city}, ${tour.country}`,
        included: tour.inclusions || [
          'Professional guide',
          'All necessary equipment',
          'Transportation',
          'Lunch and refreshments'
        ],
        notIncluded: tour.exclusions || [
          'Personal expenses',
          'Gratuities',
          'Travel insurance'
        ],
        requirements: tour.requirements || [
          'Comfortable walking shoes',
          'Weather-appropriate clothing',
          'Valid ID'
        ],
        groupSize: {
          min: tour.minGroupSize,
          max: tour.maxGroupSize
        },
        availability: 'Available',
        nextAvailableDate: 'Tomorrow',
        timeSlots: tour.timeSlots || ['09:00', '14:00'],
        similarTours: [],
        isFavorite: isWishlisted
      }
    });
  } catch (error) {
    console.error("Error in tour detail loader:", error);
    throw new Response("Failed to load tour details", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function TourDetailPage() {
  const { user, tour } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(Boolean((tour as any).isFavorite));
  const [selectedDate, setSelectedDate] = useState(tour.nextAvailableDate || '');
  const [groupSize, setGroupSize] = useState(tour.groupSize.min);
  const [selectedTime, setSelectedTime] = useState((tour as any).timeSlots?.[0] || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [extras, setExtras] = useState<{ key: string; label: string; price: number; selected: boolean }[]>([
    { key: 'lunch', label: 'Lunch', price: 1500, selected: false },
    { key: 'photo', label: 'Photo package', price: 2000, selected: false },
    { key: 'equipment', label: 'Equipment rental', price: 1000, selected: false },
  ]);

  const handleFavoriteToggle = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const response = await fetch('/api/wishlist-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: 'tour',
          serviceId: tour.id,
          action: next ? 'add' : 'remove'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle wishlist');
      }
      
      revalidator.revalidate();
    } catch {
      setIsFavorite(!next);
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const toggleExtra = (key: string) => {
    setExtras(prev => prev.map(x => x.key === key ? { ...x, selected: !x.selected } : x));
  };

  const extrasTotal = useMemo(() => extras.filter(e => e.selected).reduce((sum, e) => sum + e.price, 0), [extras]);
  const baseTotal = useMemo(() => (tour.price * groupSize), [tour.price, groupSize]);
  const grandTotal = useMemo(() => baseTotal + extrasTotal, [baseTotal, extrasTotal]);

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'text-green-600',
      Moderate: 'text-yellow-600',
      Hard: 'text-red-600'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Adventure: 'bg-orange-500',
      Cultural: 'bg-purple-500',
      Food: 'bg-red-500',
      Nature: 'bg-green-500',
      Historical: 'bg-amber-500',
      Wildlife: 'bg-teal-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const handleMessageGuide = () => setChatOpen(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-600 flex items-center gap-2">
          <Link to="/" className="hover:text-[#01502E]">Home</Link>
          <span>/</span>
          <Link to="/tours" className="hover:text-[#01502E]">Tours</Link>
          <span>/</span>
          <span className="text-gray-900 line-clamp-1">{tour.title}</span>
        </div>
      </div>
      {/* Hero Section */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        {/* Main Image */}
        <img
          src={tour.images[currentImageIndex] || '/placeholder-tour.jpg'}
          alt={tour.title}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-8 lg:p-12">
            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`${getCategoryColor(tour.type)} text-white text-sm font-semibold px-3 py-1 rounded-full`}>
                  {tour.type}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                {tour.title}
              </h1>

              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-white">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-5 h-5" />
                  <span>{tour.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-5 h-5" />
                  <span>{tour.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-5 h-5" />
                  <span>{tour.groupSize.min}-{tour.groupSize.max} people</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span>{tour.rating.toFixed(1)} ({tour.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Guide Info */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {tour.guide.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{tour.guide.name}</span>
                      {tour.guide.isVerified && (
                        <Shield className="w-4 h-4 text-[#01502E]" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-white/80">
                        {tour.guide.rating.toFixed(1)} ({tour.guide.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Thumbnails */}
        {tour.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {tour.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageClick(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === currentImageIndex ? 'border-white' : 'border-white/50'
                }`}
              >
                <img
                  src={image}
                  alt={`${tour.title} - Image ${index + 1}`}
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
          <button 
            onClick={() => setShareModalOpen(true)}
            className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tour Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this tour</h2>
              <p className="text-gray-700 leading-relaxed">{tour.description}</p>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's included</h3>
              <div className="space-y-2">
                {tour.included.map((item, index) => (
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
                {tour.notIncluded.map((item, index) => (
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
                {tour.requirements.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guide Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Meet your guide</h3>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-700">
                    {tour.guide.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{tour.guide.name}</h4>
                    {tour.guide.isVerified && (
                      <Shield className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {tour.guide.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {tour.guide.experience} experience
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{tour.guide.bio}</p>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Speaks: {tour.guide.languages.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews</h3>
              <div className="space-y-4">
                {tour.reviewCount > 0 ? (
                  <div className="space-y-4">
                    {/* Review summary */}
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {tour.rating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(tour.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          Based on {tour.reviewCount} reviews
                        </p>
                      </div>
                    </div>
                    
                    {/* Individual reviews */}
                    <div className="space-y-4">
                      {tour.reviews.slice(0, 3).map((review) => (
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
                      PKR {tour.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">per person</div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    >
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Day After">Day After</option>
                      <option value="This Weekend">This Weekend</option>
                    </select>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {((tour as any).timeSlots || ['09:00', '14:00']).map((slot: string) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-2 border rounded-lg text-sm ${selectedTime === slot ? 'bg-[#01502E] text-white border-[#01502E]' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group Size */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Size
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setGroupSize(Math.max(tour.groupSize.min, groupSize - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{groupSize}</span>
                    <button
                      onClick={() => setGroupSize(Math.min(tour.groupSize.max, groupSize + 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tour.groupSize.min}-{tour.groupSize.max} people
                  </div>
                </div>

                {/* Add-ons */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
                  <div className="space-y-2">
                    {extras.map(ex => (
                      <label key={ex.key} className="flex items-center justify-between border rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={ex.selected} onChange={() => toggleExtra(ex.key)} />
                          <span className="text-sm text-gray-700">{ex.label}</span>
                        </div>
                        <span className="text-sm text-gray-900">PKR {ex.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex items-center justify-between mb-6 py-3 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    PKR {grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* Book Button */}
                <Link 
                  to={`/book/tour/${tour.id}?tourDate=${selectedDate}&timeSlot=${selectedTime || (tour.timeSlots?.[0] || '09:00')}&participants=${groupSize}`}
                  className="block w-full"
                >
                  <button
                    disabled={!selectedDate || !selectedTime || groupSize < tour.groupSize.min}
                    className="w-full bg-[#01502E] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold hover:bg-[#013d23] transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Book Now
                  </button>
                </Link>

                {/* Wishlist Toggle */}
                <div className="mt-3">
                  <button
                    onClick={handleFavoriteToggle}
                    className={`w-full py-2 rounded-lg font-semibold border transition-all duration-200 ${
                      isFavorite
                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>

                {/* Message Guide */}
                <div className="mt-4">
                  <button onClick={handleMessageGuide} className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                    Message Guide
                  </button>
                </div>

                {/* Availability Status */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {tour.availability === 'Available' && 'Available'}
                      {tour.availability === 'Limited' && 'Limited spots left'}
                      {tour.availability === 'Fully Booked' && 'Fully booked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tour Info */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Tour Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{tour.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Difficulty</span>
                    <span className={`font-medium ${getDifficultyColor(tour.difficulty)}`}>
                      {tour.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Languages</span>
                    <span className="font-medium">{tour.languages.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Meeting Point</span>
                    <span className="font-medium text-right">{tour.meetingPoint}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setChatOpen(true)} className="bg-[#01502E] rounded-full p-3 shadow-lg text-white hover:bg-[#013d23] transition-colors">
            Contact Guide
          </button>
        </div>

      </div>
      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6 text-white text-lg">Close</button>
          <img src={tour.images[currentImageIndex] || '/placeholder-tour.jpg'} alt="gallery" className="max-w-[90vw] max-h-[85vh] object-contain" />
        </div>
      )}
      <ChatInterface
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        targetUserId={(tour as any).guide?.userId}
        currentUserId={user?.id}
        initialMessage={`Hi ${tour.guide.name}, I'm interested in the ${tour.title}${selectedDate ? ` on ${selectedDate}` : ''}.`}
        fetchConversation={async ({ targetUserId }) => {
          const response = await fetch(`/api/chat.conversation?targetUserId=${targetUserId}`);
          if (!response.ok) throw new Error("Failed to fetch conversation");
          return response.json();
        }}
        onSendMessage={async ({ conversationId, targetUserId, text }) => {
          // Prefer using provided conversationId; otherwise, create/fetch by targetUserId
          let cid = conversationId;
          if (!cid && targetUserId) {
            const convRes = await fetch(`/api/chat.conversation?targetUserId=${targetUserId}`);
            const convJson = await convRes.json();
            cid = convJson?.conversation?.id;
          }
          if (!cid) throw new Error('Missing conversation ID');
          const res = await fetch(`/api/chat/conversations/${cid}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
          });
          const json = await res.json();
          if (!res.ok || !json?.success) throw new Error('Failed to send message');
          const m = json.data;
          return {
            id: m.id,
            conversationId: cid,
            senderId: m.senderId,
            senderName: m.senderName || m.sender?.name,
            senderAvatar: m.senderAvatar || m.sender?.avatar,
            content: m.content,
            type: (m.type || 'text').toString().toLowerCase(),
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
            createdAt: m.createdAt,
            status: 'sent',
          };
        }}
      />

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={tour.title}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        description={`Join this amazing ${tour.category} tour! ${tour.description.slice(0, 100)}...`}
        image={tour.images[0]}
      />

      {/* Floating Share Button */}
      <FloatingShareButton
        title={tour.title}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        description={`Join this amazing ${tour.category} tour! ${tour.description.slice(0, 100)}...`}
        image={tour.images[0]}
        position="bottom-right"
        variant="floating"
      />
    </div>
  );
}
