import type { MetaFunction } from "@remix-run/node";
import InputForm from "~/components/HomePage/InputForm";
import NavBar from "../components/navigation/NavBar"
// import AddPage from "../components/HomePage/AddPage"
import Footer from "../components/Footer"
import CarRentScroll from "../components/HomePage/CarRentalScroll"
import Register from '../components/HomePage/Register'
import TourPackages from '../components/HomePage/TourPackages'
import FAQ from '../components/HomePage/Faq'
import SubscriptionForm from '../components/HomePage/SubscriptionForm'
import AddPage from '../components/HomePage/AddPage'
import Stays from '../components/HomePage/Stays'
export default function Index() {
  return (
   <>
<div className="div overflow-y-hidden">
<NavBar/>
<InputForm />
<AddPage/>
<Stays/>
<TourPackages/>
<Register/>
<CarRentScroll/>


<FAQ/>
<SubscriptionForm/>
<Footer/>
</div>
   </>
    )
  }