import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import TourCard from "~/components/TourCard";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get some sample tours
  const tours = await prisma.tour.findMany({
    where: { approvalStatus: 'APPROVED', available: true },
    select: {
      id: true,
      title: true,
      description: true,
      images: true,
      pricePerPerson: true,
      duration: true,
      difficulty: true,
      category: true,
      groupSize: true,
      languages: true,
      rating: true,
      reviewCount: true,
      availability: true,
      nextAvailableDate: true,
      guide: {
        select: {
          id: true,
          name: true,
          rating: true,
          reviewCount: true,
          isVerified: true
        }
      }
    },
    take: 3
  });

  // Transform tours to match TourCard interface
  const transformedTours = tours.map(tour => ({
    id: tour.id,
    title: tour.title,
    description: tour.description || '',
    images: tour.images || ['/placeholder-tour.jpg'],
    price: tour.pricePerPerson,
    duration: tour.duration || '1 day',
    difficulty: (tour.difficulty as 'Easy' | 'Moderate' | 'Hard') || 'Easy',
    category: (tour.category as 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Historical' | 'Wildlife') || 'Adventure',
    groupSize: tour.groupSize || { min: 1, max: 10 },
    languages: tour.languages || ['English'],
    guide: {
      id: tour.guide.id,
      name: tour.guide.name,
      rating: tour.guide.rating || 4.5,
      reviewCount: tour.guide.reviewCount || 0,
      isVerified: tour.guide.isVerified || false
    },
    rating: tour.rating || 4.5,
    reviewCount: tour.reviewCount || 0,
    availability: (tour.availability as 'Available' | 'Limited' | 'Fully Booked') || 'Available',
    nextAvailableDate: tour.nextAvailableDate || 'Check dates',
    isFeatured: false,
    isPopular: false,
    isNew: false,
    isFavorite: false
  }));

  return json({ tours: transformedTours });
}

export default function TestFavorites() {
  const { tours } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Favorites Functionality</h1>
        <p className="text-gray-600 mb-8">
          Click the heart icons to test adding/removing tours from favorites.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Click the heart icon on any tour card</li>
            <li>The heart should turn red and fill when favorited</li>
            <li>Click again to remove from favorites</li>
            <li>Check your favorites page at <a href="/dashboard/favorites" className="underline">/dashboard/favorites</a></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
