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
  return (
    <>
      <div className="w-full min-h-screen bg-white">
        <InputForm />
        <AddPage />
        <Stays />
        <TourPackages />
        <Register />
        <CarRentalSection />
        <FAQSection />
        <SubscriptionForm />
        <Footer />
      </div>
    </>
  );
}
