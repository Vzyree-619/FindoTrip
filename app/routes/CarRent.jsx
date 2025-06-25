import NavBar from "../components/navigation/NavBar"
import Landing from "../components/carRent/landing"
import CarsPage from "../components/carRent/carsPage"
import FAQ from "../components/RoomPages/Faq"
import SubscriptionForm from '../components/HomePage/SubscriptionForm'
import Footer from "../components/Footer"
import { useNavigate } from "@remix-run/react";

export default function Room(){
    const navigate = useNavigate();
    return (
        <>
        <div className=" overflow-y-hidden">
        <NavBar/>
        <Landing/>
        <CarsPage onBookCar={(car) => navigate(`/car/${car.id}`)} onViewDetails={(car) => navigate(`/car/${car.id}`)} />
        <FAQ/>
        <SubscriptionForm/>
        <Footer/>
        </div>
       </>
    )
}