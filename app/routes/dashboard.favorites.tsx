import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react";
import { requireUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import {
  Heart,
  MapPin,
  Star,
  Users,
  Bed,
  Bath,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Get user's wishlist with accommodation details
  const favorites = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      accommodation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ favorites });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const accommodationId = formData.get("accommodationId") as string;

  if (intent === "remove") {
    try {
      // Remove from wishlist
      await prisma.wishlist.deleteMany({
        where: {
          userId,
          accommodationId,
        },
      });

      return json({ success: true, message: "Removed from favorites" });
    } catch (error) {
      return json({ error: "Failed to remove from favorites" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function Favorites() {
  const { favorites } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getRatingBadge = (rating: number, reviewCount: number) => {
    if (reviewCount === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          No reviews
        </span>
      );
    }

    let bgColor = "bg-gray-100 text-gray-800";
    if (rating >= 9) bgColor = "bg-green-100 text-green-800";
    else if (rating >= 8) bgColor = "bg-blue-100 text-blue-800";
    else if (rating >= 7) bgColor = "bg-yellow-100 text-yellow-800";
    else if (rating >= 6) bgColor = "bg-orange-100 text-orange-800";

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${bgColor}`}>
        <Star className="w-3 h-3 mr-1 fill-current" />
        {rating.toFixed(1)} ({reviewCount})
      </span>
    );
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <p className="mt-1 text-sm text-gray-600">
            Properties you've saved for later
          </p>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {actionData.message}
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

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const accommodation = favorite.accommodation;
              if (!accommodation) return null;

              return (
                <div key={favorite.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={accommodation.images[0] || "/placeholder-hotel.jpg"}
                      alt={accommodation.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="remove" />
                        <input type="hidden" name="accommodationId" value={accommodation.id} />
                        <button
                          type="submit"
                          className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition"
                          title="Remove from favorites"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </Form>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-white/90 text-gray-800">
                        {accommodation.type}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {accommodation.name}
                      </h3>
                      {getRatingBadge(accommodation.rating, accommodation.reviewCount)}
                    </div>

                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">
                        {accommodation.city}, {accommodation.country}
                      </span>
                    </div>

                    {/* Amenities */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{accommodation.maxGuests} guests</span>
                      </div>
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{accommodation.bedrooms} beds</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        <span>{accommodation.bathrooms} baths</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-[#01502E]">
                          PKR {accommodation.pricePerNight.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600"> /night</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Heart className="h-3 w-3 mr-1 fill-red-500 text-red-500" />
                        Saved {new Date(favorite.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/accommodations/${accommodation.id}`}
                        className="flex-1 text-center py-2 px-4 border border-[#01502E] text-[#01502E] rounded-md hover:bg-[#01502E] hover:text-white font-medium transition"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/booking/guest-details?accommodationId=${accommodation.id}&checkIn=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}&checkOut=${new Date(Date.now() + 172800000).toISOString().split('T')[0]}&guests=2`}
                        className="flex-1 text-center py-2 px-4 bg-[#01502E] text-white rounded-md hover:bg-[#013d23] font-medium transition"
                      >
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No favorites yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start exploring and save properties you love for quick access later.
            </p>
            <div className="mt-6">
              <Link
                to="/accommodations/search"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23]"
              >
                Explore Properties
              </Link>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {favorites.length > 0 && (
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              💡 Pro Tips
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Save properties during your search to compare them later</li>
              <li>• Check back regularly as prices and availability change</li>
              <li>• Use "Book Now" for quick booking with default dates</li>
              <li>• Remove properties you're no longer interested in to keep your list organized</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
