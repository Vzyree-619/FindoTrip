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
    const [stays, vehicles, tours] = await Promise.all([
      prisma.property.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { id: true, name: true, city: true, country: true, basePrice: true, currency: true, images: true, rating: true, reviewCount: true },
        orderBy: { rating: "desc" },
        take: 8,
      }),
      prisma.vehicle.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { id: true, name: true, model: true, category: true, seats: true, fuelType: true, transmission: true, basePrice: true, currency: true, images: true, location: true, rating: true, reviewCount: true, available: true, features: true },
        orderBy: { rating: "desc" },
        take: 8,
      }),
      prisma.tour.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { id: true, title: true, city: true, country: true, pricePerPerson: true, currency: true, images: true, rating: true, reviewCount: true },
        orderBy: { rating: "desc" },
        take: 8,
      }),
    ]);

    // Shape vehicles for home card component
    const shapedVehicles = vehicles.map(v => ({
      id: v.id,
      name: v.name || v.model,
      model: v.model,
      year: v.year || new Date().getFullYear(),
      images: v.images || ['/placeholder-vehicle.jpg'],
      price: v.basePrice || 0,
      originalPrice: undefined,
      category: v.category || 'Economy',
      transmission: v.transmission || 'Automatic',
      fuelType: v.fuelType || 'Gasoline',
      isElectric: v.fuelType === 'Electric',
      owner: {
        id: '',
        name: '',
        avatar: '',
        rating: v.rating || 0,
        reviewCount: v.reviewCount || 0,
        isVerified: true,
      },
      rating: v.rating || 0,
      reviewCount: v.reviewCount || 0,
      specs: {
        passengers: v.seats || 4,
        luggage: 3,
        fuelEfficiency: 0,
        transmission: v.transmission || 'Automatic',
      },
      features: Array.isArray(v.features) ? v.features : [],
      location: v.location || '',
      availability: v.available ? 'Available' : 'Fully Booked',
      isSpecialOffer: false,
      hasDelivery: false,
      deliveryRadius: undefined,
      insuranceOptions: true,
      instantBooking: true,
      isFavorite: false,
      onToggleFavorite: undefined,
      onCompare: undefined,
    }));

    // Shape stays for home grid
    const shapedStays = stays.map(s => ({
      id: s.id,
      name: s.name,
      location: `${s.city}, ${s.country}`,
      price: `Starting from PKR ${s.basePrice.toLocaleString()}`,
      rating: s.rating || 0,
      reviews: s.reviewCount ? `${s.reviewCount} reviews` : "",
      image: (s.images?.[0]) || "/landingPageImg.jpg",
    }));

    // Fallback if any list is empty
    const staysOut = shapedStays.length ? shapedStays : [
      { id: 's1', name: 'Al Noor Starlet Hotel', location: 'Skardu, Pakistan', price: 'Starting from PKR 12000', rating: 9.5, reviews: '50 reviews', image: '/alnoor.png' },
      { id: 's2', name: 'Sehrish Guest House', location: 'Skardu, Pakistan', price: 'Starting from PKR 10000', rating: 8.3, reviews: '65 reviews', image: '/razaqi.jpg' },
      { id: 's3', name: 'Legend Hotel', location: 'Skardu, Pakistan', price: 'Starting from PKR 10000', rating: 9.2, reviews: '42 reviews', image: '/legend.jpg' },
      { id: 's4', name: 'Himmel Resort', location: 'Shigar, Pakistan', price: 'Starting from PKR 35000', rating: 9.8, reviews: '28 reviews', image: '/himmel.jpg' },
    ];
    const vehiclesOut = shapedVehicles;
    return json({ stays: staysOut, vehicles: vehiclesOut, tours, user: null });
  } catch (e) {
    console.warn('Home loader fallback due to DB error', e);
    return json({ stays: null, vehicles: null, tours: null });
  }
}
