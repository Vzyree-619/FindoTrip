import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { requireUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import {
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  PenTool,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");

  // Get bookings that can be reviewed (completed, no existing review)
  const bookingsToReview = await prisma.booking.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "CONFIRMED"] },
      checkOut: { lt: new Date() }, // Past check-out date
      reviews: { none: {} }, // No existing reviews
    },
    include: {
      accommodation: true,
    },
    orderBy: { checkOut: "desc" },
  });

  // Get existing reviews
  const existingReviews = await prisma.review.findMany({
    where: { userId },
    include: {
      accommodation: true,
      booking: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // If bookingId is provided, get that specific booking for review form
  let bookingToReview = null;
  if (bookingId) {
    bookingToReview = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
        status: { in: ["COMPLETED", "CONFIRMED"] },
        checkOut: { lt: new Date() },
        reviews: { none: {} },
      },
      include: {
        accommodation: true,
      },
    });
  }

  return json({
    bookingsToReview,
    existingReviews,
    bookingToReview,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "submit-review") {
    const bookingId = formData.get("bookingId") as string;
    const accommodationId = formData.get("accommodationId") as string;
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;

    if (!bookingId || !accommodationId || !rating || !comment) {
      return json({ error: "All fields are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    try {
      // Verify booking belongs to user and can be reviewed
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId,
          status: { in: ["COMPLETED", "CONFIRMED"] },
          checkOut: { lt: new Date() },
          reviews: { none: {} },
        },
      });

      if (!booking) {
        return json({ error: "Booking not found or cannot be reviewed" }, { status: 404 });
      }

      // Create review
      await prisma.review.create({
        data: {
          userId,
          accommodationId,
          bookingId,
          rating,
          comment,
        },
      });

      // Update accommodation rating
      const accommodation = await prisma.accommodation.findUnique({
        where: { id: accommodationId },
        include: { reviews: true },
      });

      if (accommodation) {
        const totalRating = accommodation.reviews.reduce((sum, review) => sum + review.rating, 0) + rating;
        const totalReviews = accommodation.reviews.length + 1;
        const newAverageRating = totalRating / totalReviews;

        await prisma.accommodation.update({
          where: { id: accommodationId },
          data: {
            rating: newAverageRating,
            reviewCount: totalReviews,
          },
        });
      }

      return redirect("/dashboard/reviews?success=review-submitted");
    } catch (error) {
      return json({ error: "Failed to submit review" }, { status: 500 });
    }
  }

  if (intent === "delete-review") {
    const reviewId = formData.get("reviewId") as string;

    try {
      // Verify review belongs to user
      const review = await prisma.review.findFirst({
        where: { id: reviewId, userId },
        include: { accommodation: true },
      });

      if (!review) {
        return json({ error: "Review not found" }, { status: 404 });
      }

      // Delete review
      await prisma.review.delete({
        where: { id: reviewId },
      });

      // Update accommodation rating
      const accommodation = await prisma.accommodation.findUnique({
        where: { id: review.accommodationId },
        include: { reviews: true },
      });

      if (accommodation && accommodation.reviews.length > 0) {
        const totalRating = accommodation.reviews.reduce((sum, r) => sum + r.rating, 0);
        const newAverageRating = totalRating / accommodation.reviews.length;

        await prisma.accommodation.update({
          where: { id: review.accommodationId },
          data: {
            rating: newAverageRating,
            reviewCount: accommodation.reviews.length,
          },
        });
      } else if (accommodation) {
        // No reviews left
        await prisma.accommodation.update({
          where: { id: review.accommodationId },
          data: {
            rating: 0,
            reviewCount: 0,
          },
        });
      }

      return json({ success: "Review deleted successfully" });
    } catch (error) {
      return json({ error: "Failed to delete review" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function Reviews() {
  const { bookingsToReview, existingReviews, bookingToReview } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"to-review" | "my-reviews">(
    bookingToReview ? "to-review" : "to-review"
  );
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const success = searchParams.get("success");

  const renderStars = (rating: number, interactive = false, size = "w-5 h-5") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-600">
            Share your experiences and manage your reviews
          </p>
        </div>

        {/* Success Messages */}
        {(success === "review-submitted" || actionData?.success) && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {success === "review-submitted" ? "Review submitted successfully!" : actionData?.success}
                </p>
              </div>
            </div>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {actionData.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Form (if bookingToReview exists) */}
        {bookingToReview && (
          <div className="mb-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Write a Review
            </h3>
            
            {/* Property Info */}
            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
              {bookingToReview.accommodation?.images && (
                <img
                  src={bookingToReview.accommodation.images[0]}
                  alt={bookingToReview.accommodation?.name}
                  className="h-16 w-16 object-cover rounded-lg mr-4"
                />
              )}
              <div>
                <h4 className="font-semibold text-gray-900">
                  {bookingToReview.accommodation?.name}
                </h4>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {bookingToReview.accommodation?.city}, {bookingToReview.accommodation?.country}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  Stayed: {new Date(bookingToReview.checkIn).toLocaleDateString()} - {new Date(bookingToReview.checkOut).toLocaleDateString()}
                </div>
              </div>
            </div>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="intent" value="submit-review" />
              <input type="hidden" name="bookingId" value={bookingToReview.id} />
              <input type="hidden" name="accommodationId" value={bookingToReview.accommodationId || ""} />
              <input type="hidden" name="rating" value={selectedRating} />

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {renderStars(hoveredRating || selectedRating, true, "w-8 h-8")}
                  <span className="text-sm text-gray-600 ml-2">
                    {selectedRating > 0 && (
                      <>
                        {selectedRating} out of 5 stars
                        {selectedRating === 1 && " - Poor"}
                        {selectedRating === 2 && " - Fair"}
                        {selectedRating === 3 && " - Good"}
                        {selectedRating === 4 && " - Very Good"}
                        {selectedRating === 5 && " - Excellent"}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  name="comment"
                  id="comment"
                  rows={4}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#01502E] focus:border-[#01502E]"
                  placeholder="Share your experience about this property. What did you like? What could be improved?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={selectedRating === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Submit Review
                </button>
                <Link
                  to="/dashboard/reviews"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </Form>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("to-review")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "to-review"
                  ? "border-[#01502E] text-[#01502E]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              To Review ({bookingsToReview.length})
            </button>
            <button
              onClick={() => setActiveTab("my-reviews")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "my-reviews"
                  ? "border-[#01502E] text-[#01502E]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Reviews ({existingReviews.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "to-review" ? (
          <div className="space-y-4">
            {bookingsToReview.length > 0 ? (
              bookingsToReview.map((booking) => (
                <div key={booking.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {booking.accommodation?.images && (
                        <img
                          src={booking.accommodation.images[0]}
                          alt={booking.accommodation?.name}
                          className="h-16 w-16 object-cover rounded-lg mr-4"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.accommodation?.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {booking.accommodation?.city}, {booking.accommodation?.country}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          Stayed: {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/reviews?bookingId=${booking.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23]"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Write Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No properties to review
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete a stay to write your first review.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {existingReviews.length > 0 ? (
              existingReviews.map((review) => (
                <div key={review.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900 mr-3">
                          {review.accommodation?.name}
                        </h3>
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {review.accommodation?.city}, {review.accommodation?.country}
                      </div>

                      <p className="text-gray-700 mb-3">{review.comment}</p>

                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                        {review.booking && (
                          <>
                            {" • "}
                            Stayed: {new Date(review.booking.checkIn).toLocaleDateString()} - {new Date(review.booking.checkOut).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete-review" />
                        <input type="hidden" name="reviewId" value={review.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No reviews yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your reviews will appear here after you write them.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
