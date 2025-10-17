import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { MapPin, Users, Bed, Bath, Star, Calendar } from "lucide-react";

export async function loader({ params }: LoaderFunctionArgs) {
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        select: {
          name: true,
          avatar: true,
          email: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!accommodation) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ accommodation });
}

export default function AccommodationDetail() {
  const { accommodation } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="text-[#01502E] hover:text-[#013d23] font-semibold mb-4 inline-block"
        >
          ← Back to search
        </Link>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-4 md:col-span-2 row-span-2">
            <div className="h-96 bg-gradient-to-br from-[#01502E] to-[#047857] rounded-lg overflow-hidden">
              {accommodation.images[0] ? (
                <img
                  src={accommodation.images[0]}
                  alt={accommodation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                  🏨
                </div>
              )}
            </div>
          </div>
          {accommodation.images.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className="h-44 bg-gray-300 rounded-lg overflow-hidden"
            >
              <img
                src={img}
                alt={`${accommodation.name} ${idx + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {accommodation.name}
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {accommodation.address}, {accommodation.city},{" "}
                    {accommodation.country}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 bg-[#01502E] text-white px-4 py-2 rounded-lg">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-lg font-bold">
                      {accommodation.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {accommodation.reviewCount} reviews
                  </p>
                </div>
              </div>

              <div className="flex gap-6 py-4 border-y border-gray-200 my-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-semibold">
                    {accommodation.maxGuests} guests
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-semibold">
                    {accommodation.bedrooms} bedrooms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-semibold">
                    {accommodation.bathrooms} bathrooms
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {accommodation.description}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {accommodation.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <span className="text-green-600">✓</span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Property Type
                </h2>
                <span className="bg-green-100 text-[#01502E] px-4 py-2 rounded-full font-semibold">
                  {accommodation.type}
                </span>
              </div>
            </div>

            {/* Reviews */}
            {accommodation.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Guest Reviews
                </h2>
                <div className="space-y-4">
                  {accommodation.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          {review.user.avatar ? (
                            <img
                              src={review.user.avatar}
                              alt={review.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold">
                              {review.user.name[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.user.name}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
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
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    PKR {accommodation.pricePerNight.toLocaleString()}
                  </span>
                  <span className="text-gray-600">per night</span>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={accommodation.maxGuests}
                    defaultValue="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                    required
                  />
                </div>

                <Link
                  to={`/book/stay/${accommodation.id}`}
                  className="block w-full bg-[#01502E] hover:bg-[#013d23] text-white font-bold py-4 rounded-lg text-center transition-colors"
                >
                  Reserve Now
                </Link>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                You won't be charged yet
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Hosted by {accommodation.owner.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Contact host for special requests
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
