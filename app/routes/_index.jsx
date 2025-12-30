import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { getUser } from "~/lib/auth/auth.server";
import InputForm from "~/components/features/home/InputForm/InputForm";
import NavBar from "~/components/layout/navigation/NavBar";
import Footer from "~/components/layout/Footer";
import CarRentalSection from "~/components/features/home/CarRentalSection";
import Register from "~/components/features/home/Register";
import TourPackages from "~/components/features/home/TourPackages";
import FAQSection from "~/components/features/home/FAQSection";
import AddPage from "~/components/features/home/AddPage";
import Stays from "~/components/features/home/Stays";
import PublicChatButton from "~/components/chat/PublicChatButton";
export default function Index() {
  const data = useLoaderData();
  // If providers somehow render the landing page, hide consumer sections
  const user = data && data.user ? data.user : null;
  const isProvider = user && (user.role === 'PROPERTY_OWNER' || user.role === 'VEHICLE_OWNER' || user.role === 'TOUR_GUIDE');
  return (
    <>
      <div className="w-full min-h-screen bg-white">
        {!isProvider && <InputForm />}
        {!isProvider && <AddPage />}
        {!isProvider && <Stays stays={data?.stays} />}
        {!isProvider && <TourPackages />}
        {!isProvider && <Register />}
        {!isProvider && <CarRentalSection vehicles={data?.vehicles} />}
        <FAQSection />
        <Footer />
        
        {/* Public Live Chat Button - only show for non-logged-in users or customers */}
        {(!user || user.role === 'CUSTOMER') && <PublicChatButton />}
      </div>
    </>
  );
}

export async function loader({ request }) {
  try {
    const user = await getUser(request);
    // Only redirect if user is explicitly trying to access dashboard
    // Allow users to see landing page data even when logged in
    const url = new URL(request.url);
    const isDashboardRequest = url.pathname.includes('/dashboard');

    if (user && isDashboardRequest) {
      const redirectRoutes = {
        CUSTOMER: "/dashboard",
        PROPERTY_OWNER: "/dashboard/provider",
        VEHICLE_OWNER: "/dashboard/vehicle-owner",
        TOUR_GUIDE: "/dashboard/guide",
        SUPER_ADMIN: "/dashboard/admin",
      };
      throw new Response(null, { status: 302, headers: { Location: redirectRoutes[user.role] || "/dashboard" } });
    }

    // Use category-based content instead of database entries
    const staysOut = [
      {
        id: 'cat-karachi-hotels',
        name: 'Hotels in Karachi',
        location: 'Karachi, Pakistan',
        price: 'Starting from PKR 5,000',
        rating: 4.5,
        reviews: '2,500+ reviews',
        image: '/karachi-hotels.jpg',
        isCategory: true,
        categoryType: 'hotels',
        city: 'karachi'
      },
      {
        id: 'cat-lahore-hotels',
        name: 'Hotels in Lahore',
        location: 'Lahore, Pakistan',
        price: 'Starting from PKR 4,500',
        rating: 4.3,
        reviews: '3,200+ reviews',
        image: '/lahore-hotels.jpg',
        isCategory: true,
        categoryType: 'hotels',
        city: 'lahore'
      },
      {
        id: 'cat-islamabad-hotels',
        name: 'Hotels in Islamabad',
        location: 'Islamabad, Pakistan',
        price: 'Starting from PKR 6,000',
        rating: 4.7,
        reviews: '1,800+ reviews',
        image: '/islamabad-hotels.jpg',
        isCategory: true,
        categoryType: 'hotels',
        city: 'islamabad'
      },
      {
        id: 'cat-peshawar-hotels',
        name: 'Hotels in Peshawar',
        location: 'Peshawar, Pakistan',
        price: 'Starting from PKR 3,500',
        rating: 4.1,
        reviews: '950+ reviews',
        image: '/peshawar-hotels.jpg',
        isCategory: true,
        categoryType: 'hotels',
        city: 'peshawar'
      }
    ];

    // Category-based vehicles
    const vehiclesOut = [
      {
        id: 'cat-karachi-cars',
        name: 'Cars in Karachi',
        model: 'Economy to Luxury',
        category: 'Multiple Categories',
        transmission: 'Manual & Automatic',
        fuelType: 'Petrol, Diesel, Electric',
        price: 3000,
        currency: 'PKR',
        rating: 4.4,
        reviewCount: 1250,
        images: ['/karachi-cars.jpg'],
        location: 'Karachi, Pakistan',
        specs: {
          passengers: 4,
          luggage: 2,
          fuelEfficiency: 15,
          transmission: 'Manual/Auto'
        },
        features: ['AC', 'GPS', 'Insurance'],
        availability: 'Available',
        isCategory: true,
        categoryType: 'cars',
        city: 'karachi'
      },
      {
        id: 'cat-lahore-cars',
        name: 'Cars in Lahore',
        model: 'All Types Available',
        category: 'Sedan, SUV, Hatchback',
        transmission: 'Manual & Automatic',
        fuelType: 'Petrol, CNG, Electric',
        price: 2800,
        currency: 'PKR',
        rating: 4.6,
        reviewCount: 1850,
        images: ['/lahore-cars.jpg'],
        location: 'Lahore, Pakistan',
        specs: {
          passengers: 5,
          luggage: 3,
          fuelEfficiency: 12,
          transmission: 'Manual/Auto'
        },
        features: ['AC', 'GPS', 'Music System'],
        availability: 'Available',
        isCategory: true,
        categoryType: 'cars',
        city: 'lahore'
      },
      {
        id: 'cat-islamabad-cars',
        name: 'Cars in Islamabad',
        model: 'Premium Fleet',
        category: 'Luxury & Economy',
        transmission: 'Automatic',
        fuelType: 'Petrol, Hybrid',
        price: 4500,
        currency: 'PKR',
        rating: 4.8,
        reviewCount: 980,
        images: ['/islamabad-cars.jpg'],
        location: 'Islamabad, Pakistan',
        specs: {
          passengers: 4,
          luggage: 2,
          fuelEfficiency: 18,
          transmission: 'Automatic'
        },
        features: ['AC', 'GPS', 'Leather Seats'],
        availability: 'Available',
        isCategory: true,
        categoryType: 'cars',
        city: 'islamabad'
      }
    ];

    return json({ stays: staysOut, vehicles: vehiclesOut, tours: [], user: null });
  } catch (e) {
    console.warn('Home loader fallback due to DB error', e);
    return json({ stays: [], vehicles: [], tours: [] });
  }
}
