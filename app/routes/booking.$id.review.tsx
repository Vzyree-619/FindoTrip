import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { processReviewSubmission } from "~/lib/ratings.server";
import { prisma } from "~/lib/db/db.server";
import { useState } from "react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface ReviewFormData {
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  categories: {
    cleanliness: number;
    communication: number;
    value: number;
    location: number;
  };
}

interface LoaderData {
  booking: {
    id: string;
    type: string;
    service: {
      id: string;
      title: string;
      image?: string;
    };
    provider: {
      id: string;
      name: string;
      avatar?: string;
    };
    dates: {
      start: string;
      end: string;
    };
  };
  reviewRequest: {
    id: string;
    expiresAt: string;
  };
}

// ========================================
// LOADER
// ========================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const bookingId = params.id;

    if (!bookingId) {
      throw new Error("Booking ID required");
    }

    // Get booking details
    const propertyBooking = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: { 
            id: true, 
            name: true, 
            images: true,
            owner: {
              select: { id: true, businessName: true, user: { select: { name: true, avatar: true } } }
            }
          }
        },
        user: { select: { id: true } }
      }
    });

    const vehicleBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: {
          select: { 
            id: true, 
            name: true, 
            images: true,
            owner: {
              select: { id: true, businessName: true, user: { select: { name: true, avatar: true } } }
            }
          }
        },
        user: { select: { id: true } }
      }
    });

    const tourBooking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: {
        tour: {
          select: { 
            id: true, 
            title: true, 
            images: true,
            guide: {
              select: { id: true, firstName: true, lastName: true, user: { select: { name: true, avatar: true } } }
            }
          }
        },
        user: { select: { id: true } }
      }
    });

    let booking;
    let bookingType: 'property' | 'vehicle' | 'tour';

    if (propertyBooking) {
      booking = propertyBooking;
      bookingType = 'property';
    } else if (vehicleBooking) {
      booking = vehicleBooking;
      bookingType = 'vehicle';
    } else if (tourBooking) {
      booking = tourBooking;
      bookingType = 'tour';
    } else {
      throw new Error("Booking not found");
    }

    // Verify customer owns this booking
    if (booking.customer.id !== userId) {
      throw new Error("Access denied");
    }

    // Check if review request exists and is active
    const reviewRequest = await prisma.reviewRequest.findFirst({
      where: {
        bookingId,
        bookingType,
        customerId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (!reviewRequest) {
      throw new Error("Review request not found or expired");
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        bookingType,
        customerId: userId
      }
    });

    if (existingReview) {
      throw new Error("Review already submitted");
    }

    // Format booking data
    const service = bookingType === 'property' ? booking.property :
                   bookingType === 'vehicle' ? booking.vehicle : booking.tour;
    
    const provider = bookingType === 'property' ? booking.property.owner :
                     bookingType === 'vehicle' ? booking.vehicle.owner : booking.tour.guide;

    const loaderData: LoaderData = {
      booking: {
        id: bookingId,
        type: bookingType,
        service: {
          id: service.id,
          title: service.title || service.name,
          image: service.images?.[0]
        },
        provider: {
          id: provider.id,
          name: provider.name,
          avatar: provider.avatar
        },
        dates: {
          start: booking.startDate.toISOString(),
          end: booking.endDate.toISOString()
        }
      },
      reviewRequest: {
        id: reviewRequest.id,
        expiresAt: reviewRequest.expiresAt.toISOString()
      }
    };

    return json(loaderData);
  } catch (error) {
    console.error("Error in review loader:", error);
    throw new Response("Failed to load review page", { status: 500 });
  }
}

// ========================================
// ACTION
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const bookingId = params.id;

    if (!bookingId) {
      return json({ success: false, error: "Booking ID required" }, { status: 400 });
    }

    const formData = await request.formData();
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;
    const wouldRecommend = formData.get("wouldRecommend") === "true";
    const cleanliness = parseInt(formData.get("cleanliness") as string);
    const communication = parseInt(formData.get("communication") as string);
    const value = parseInt(formData.get("value") as string);
    const location = parseInt(formData.get("location") as string);

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return json({ success: false, error: "Please select a rating between 1 and 5" }, { status: 400 });
    }

    if (!comment || comment.trim().length < 10) {
      return json({ success: false, error: "Please write at least 10 characters" }, { status: 400 });
    }

    // Get booking details to determine service type
    const propertyBooking = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: { property: { select: { id: true, ownerId: true } } }
    });

    const vehicleBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: { vehicle: { select: { id: true, ownerId: true } } }
    });

    const tourBooking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: { tour: { select: { id: true, guideId: true } } }
    });

    let serviceId: string;
    let serviceType: 'property' | 'vehicle' | 'tour';
    let providerId: string;

    if (propertyBooking) {
      serviceId = propertyBooking.property.id;
      serviceType = 'property';
      providerId = propertyBooking.property.ownerId;
    } else if (vehicleBooking) {
      serviceId = vehicleBooking.vehicle.id;
      serviceType = 'vehicle';
      providerId = vehicleBooking.vehicle.ownerId;
    } else if (tourBooking) {
      serviceId = tourBooking.tour.id;
      serviceType = 'tour';
      providerId = tourBooking.tour.guideId;
    } else {
      return json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        bookingType: serviceType,
        customerId: userId,
        serviceId,
        serviceType,
        providerId,
        rating,
        comment: comment.trim(),
        wouldRecommend,
        categories: {
          cleanliness,
          communication,
          value,
          location
        },
        isActive: true
      }
    });

    // Process review submission (update ratings)
    await processReviewSubmission(review.id, serviceId, serviceType, providerId);

    return json({ 
      success: true, 
      message: "Thank you for your review! Your feedback helps improve our platform.",
      reviewId: review.id
    });

  } catch (error) {
    console.error("Error in review action:", error);
    return json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function ReviewPage() {
  const { booking, reviewRequest } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [categories, setCategories] = useState({
    cleanliness: 0,
    communication: 0,
    value: 0,
    location: 0
  });

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleStarHover = (hoveredRating: number) => {
    setHoverRating(hoveredRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleCategoryChange = (category: string, value: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            How was your experience?
          </h1>
          <p className="text-gray-600">
            Your feedback helps other travelers and improves our platform
          </p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-4">
            {booking.service.image && (
              <img
                src={booking.service.image}
                alt={booking.service.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{booking.service.title}</h3>
              <p className="text-sm text-gray-600">
                Hosted by {booking.provider.name}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(booking.dates.start).toLocaleDateString()} - {new Date(booking.dates.end).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <Form method="post" className="space-y-8">
          {/* Overall Rating */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overall Rating *
            </h3>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="text-3xl focus:outline-none"
                >
                  <span
                    className={`${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
              </span>
            </div>
            <input type="hidden" name="rating" value={rating} />
          </div>

          {/* Category Ratings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rate specific aspects
            </h3>
            <div className="space-y-4">
              {[
                { key: 'cleanliness', label: 'Cleanliness' },
                { key: 'communication', label: 'Communication' },
                { key: 'value', label: 'Value for money' },
                { key: 'location', label: 'Location' }
              ].map((category) => (
                <div key={category.key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {category.label}
                  </span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCategoryChange(category.key, star)}
                        className="text-lg focus:outline-none"
                      >
                        <span
                          className={`${
                            star <= categories[category.key as keyof typeof categories]
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="hidden"
                    name={category.key}
                    value={categories[category.key as keyof typeof categories]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tell us about your experience *
            </h3>
            <textarea
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your stay, what you liked, and what could be improved..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Would you recommend this to others?
            </h3>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`px-4 py-2 rounded-md border ${
                  wouldRecommend === true
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                Yes, I'd recommend it
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`px-4 py-2 rounded-md border ${
                  wouldRecommend === false
                    ? "bg-red-50 border-red-500 text-red-700"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                No, I wouldn't recommend it
              </button>
            </div>
            <input type="hidden" name="wouldRecommend" value={String(wouldRecommend)} />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.length < 10}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </Form>

        {/* Success Message */}
        {actionData?.success && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {actionData.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {actionData?.error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {actionData.error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
