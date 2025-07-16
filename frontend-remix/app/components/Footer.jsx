import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from 'react-icons/fa6';
// import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-green-900 w-[99vw] text-white py-10 px-6 md:px-16 overflow-y-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        {/* Terms & Settings */}
        <div>
          <h3 className="font-bold mb-3">Terms & Settings</h3>
          <p className="mb-2">Terms & Conditions</p>
          <p>Privacy & Cookies</p>
        </div>

        {/* Booking */}
        <div>
          <h3 className="font-bold mb-3">Booking</h3>
          <p className="mb-2">Hotel Booking</p>
          <p className="mb-2">Tour Packages</p>
          <p className="mb-2">Car Rentals</p>
          <p>Activities</p>
        </div>

        {/* Help */}
        <div>
          <h3 className="font-bold mb-3">Help</h3>
          <p className="mb-2">Contact Customer Service</p>
          <p className="mb-2">Report a complaint</p>
          <p>Contact Us</p>
        </div>

        {/* About */}
        <div>
          <h3 className="font-bold mb-3">About</h3>
          <p className="mb-6">About Findo Trip</p>

          {/* Social Icons */}
          <div className="flex space-x-4 text-xl ">
            <FaFacebookF className="cursor-pointer text-[4vh]" />
            <FaInstagram className="cursor-pointer text-[4vh]" />
            <FaXTwitter className="cursor-pointer text-[4vh]" />
            <FaYoutube className="cursor-pointer text-[4vh]" />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="mt-10 flex justify-start md:justify-start">
        <img className='text-white bg-white rounded'
          src="/FindoTripLogo.png"
          alt="Findo Trip Logo"
          width={100}
          height={40}
        />
      </div>
    </footer>
  );
}
