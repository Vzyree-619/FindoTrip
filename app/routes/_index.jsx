import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
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
  return (
    <>
      <div className="w-full min-h-screen bg-white">
        <InputForm />
        <AddPage />
        <Stays stays={data?.stays} />
        <TourPackages />
        <Register />
        <CarRentalSection vehicles={data?.vehicles} />
        <FAQSection />
        <SubscriptionForm />
        <Footer />
      </div>
    </>
  );
}

export async function loader() {
  try {
    const [stays, vehicles, tours] = await Promise.all([
      prisma.property.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { id: true, name: true, city: true, country: true, basePrice: true, currency: true, images: true, rating: true, reviewCount: true },
        orderBy: { rating: "desc" },
        take: 8,
      }),
      prisma.vehicle.findMany({
        where: { approvalStatus: 'APPROVED', available: true },
        select: { id: true, name: true, model: true, category: true, seats: true, fuelType: true, transmission: true, basePrice: true, currency: true, images: true, location: true, rating: true, reviewCount: true },
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
      reviews: v.reviewCount ? `${v.reviewCount} reviews` : "",
      image: (v.images?.[0]) || "/placeholder-vehicle.jpg",
      location: v.location || "",
      available: true,
      discount: 0,
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
    const vehiclesOut = shapedVehicles.length ? shapedVehicles : vehiclesDefault();
    return json({ stays: staysOut, vehicles: vehiclesOut, tours });
  } catch (e) {
    console.warn('Home loader fallback due to DB error', e);
    return json({ stays: null, vehicles: null, tours: null });
  }
}
