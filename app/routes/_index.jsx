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
import SubscriptionForm from "~/components/features/home/SubscriptionForm";
import AddPage from "~/components/features/home/AddPage";
import Stays from "~/components/features/home/Stays";
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
        <SubscriptionForm />
        <Footer />
      </div>
    </>
  );
}

export async function loader({ request }) {
  try {
    const user = await getUser(request);
    if (user) {
      const redirectRoutes = {
        CUSTOMER: "/dashboard",
        PROPERTY_OWNER: "/dashboard/provider",
        VEHICLE_OWNER: "/dashboard/vehicle-owner",
        TOUR_GUIDE: "/dashboard/guide",
        SUPER_ADMIN: "/dashboard/admin",
      };
      // Return user in data if you want conditional render while redirecting (SSR edge cases)
      // Mostly this path redirect short-circuits.
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
      type: v.category || "",
      seats: v.seats || 4,
      fuel: v.fuelType || "",
      transmission: v.transmission || "Automatic",
      price: v.basePrice || 0,
      currency: v.currency || "PKR",
      rating: v.rating || 0,
      reviews: v.reviewCount || 0,
      image: (v.images?.[0]) || "/placeholder-vehicle.jpg",
      location: v.location || "",
      available: v.available ?? true,
      discount: 0,
      features: Array.isArray(v.features) ? v.features : [],
    }));

    // Shape stays for home grid
    const shapedStays = stays.map(s => ({
      id: s.id,
      name: s.name,
      location: `${s.city}, ${s.country}`,
      price: `Starting from ${s.currency || 'PKR'} ${s.basePrice.toLocaleString()}`,
      rating: s.rating || 0,
      reviews: s.reviewCount ? `${s.reviewCount} reviews` : "",
      image: (s.images?.[0]) || "/placeholder-hotel.jpg",
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
