import Landing from "~/components/features/vehicles/landing";
import CarsPage from "~/components/features/vehicles/carsPage";
import SubscriptionForm from "~/components/features/home/SubscriptionForm";
import Footer from "~/components/layout/Footer";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";

export default function Room() {
  const navigate = useNavigate();
  return (
    <>
      <div className="overflow-y-hidden">
        <Landing />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-4">
            <CarsPage
              onBookCar={(car) => navigate(`/book/vehicle/${car.id}`)}
              onViewDetails={(car) => navigate(`/vehicles/${car.id}`)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/vehicles')}>Browse All Vehicles</Button>
            </div>
          </Card>
        </div>
        <SubscriptionForm />
        <Footer />
      </div>
    </>
  );
}
