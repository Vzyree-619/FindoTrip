import Landing from "~/components/features/vehicles/landing";
import CarsPage from "~/components/features/vehicles/carsPage";
import FAQ from "~/components/features/rooms/Faq";
import SubscriptionForm from "~/components/features/home/SubscriptionForm";
import Footer from "~/components/layout/Footer";
import { useNavigate } from "@remix-run/react";

export default function Room() {
  const navigate = useNavigate();
  return (
    <>
      <div className=" overflow-y-hidden">
        <Landing />
        <CarsPage
          onBookCar={(car) => navigate(`/car/${car.id}`)}
          onViewDetails={(car) => navigate(`/car/${car.id}`)}
        />
        <FAQ />
        <SubscriptionForm />
        <Footer />
      </div>
    </>
  );
}
