import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";
import { Link } from "@remix-run/react";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.to(menuRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
    } else {
      gsap.to(menuRef.current, { x: "100%", duration: 0.5, ease: "power3.in" });
    }
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center relative">
      {/* Logo */}
      <div className="text-xl font-bold text-green-600">
        <Link to="/">
          <img
            src="/FindoTripLogo.png"
            alt="Findo Trip Logo"
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden z-20" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={30} /> : <Menu size={30} />}
      </button>

      {/* Desktop Menu */}
      <ul className="hidden md:flex space-x-6 font-semibold items-center">
        <li className="hover:text-[#01502E] cursor-pointer transition">
          <Link to="/accommodations/search">Stays</Link>
        </li>
        <li className="hover:text-[#01502E] cursor-pointer transition">
          <Link to="/car_rentals">Car Rentals</Link>
        </li>
        <li className="hover:text-[#01502E] cursor-pointer transition">
          <Link to="/tours">Tours</Link>
        </li>
        <li className="hover:text-[#01502E] cursor-pointer transition">
          <Link to="/blogs">Blogs</Link>
        </li>
        <li>
          <Link to="/login" className="border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition font-semibold">
            Sign In
          </Link>
        </li>
        <li>
          <Link to="/register" className="bg-[#01502E] text-white px-4 py-2 rounded-lg hover:bg-[#013d23] transition font-semibold">
            Register
          </Link>
        </li>
      </ul>


      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 h-full w-3/4 bg-white shadow-lg flex flex-col space-y-6 p-6 transform translate-x-full md:hidden z-10"
      >
        <ul className="space-y-4 font-semibold">
          <li className="hover:text-[#01502E] cursor-pointer transition">
            <Link to="/accommodations/search" onClick={() => setIsOpen(false)}>Stays</Link>
          </li>
          <li className="hover:text-[#01502E] cursor-pointer transition">
            <Link to="/car_rentals" onClick={() => setIsOpen(false)}>Car Rentals</Link>
          </li>
          <li className="hover:text-[#01502E] cursor-pointer transition">
            <Link to="/tours" onClick={() => setIsOpen(false)}>Tours</Link>
          </li>
          <li className="hover:text-[#01502E] cursor-pointer transition">
            <Link to="/blogs" onClick={() => setIsOpen(false)}>Blogs</Link>
          </li>
          <li>
            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition">
              Sign In
            </Link>
          </li>
          <li>
            <Link to="/register" onClick={() => setIsOpen(false)} className="block text-center bg-[#01502E] text-white px-4 py-2 rounded-lg hover:bg-[#013d23] transition">
              Register
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
