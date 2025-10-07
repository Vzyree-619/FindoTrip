import InputForm from "../components/HomePage/InputForm.jsx";
import NavBar from "../components/navigation/NavBar.jsx";
import Footer from "../components/Footer.jsx";
import CarRentScroll from "../components/HomePage/CarRentalScroll.jsx";
import Register from "../components/HomePage/Register.jsx";
import TourPackages from "../components/HomePage/TourPackages.jsx";
import FAQ from "../components/HomePage/Faq.jsx";
import SubscriptionForm from "../components/HomePage/SubscriptionForm.jsx";
import AddPage from "../components/HomePage/AddPage.jsx";
import Stays from "../components/HomePage/Stays.jsx";
export default function Index() {
  return (
    <>
      <div className="div overflow-y-hidden">
        <InputForm />
        <AddPage />
        <Stays />
        <TourPackages />
        <Register />
        <CarRentScroll />

        <FAQ />
        <SubscriptionForm />
        <Footer />
      </div>
    </>
  );
}
