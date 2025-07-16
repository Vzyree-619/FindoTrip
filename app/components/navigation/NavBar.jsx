import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";
import { Link } from "@remix-run/react";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.to(menuRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
    } else {
      gsap.to(menuRef.current, { x: "100%", duration: 0.5, ease: "power3.in" });
    }
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-md px-6 py-2 flex justify-between items-center relative">
      {/* Logo */}
      <div className="text-xl font-bold text-green-600">
        <Link to="/">
          <img src="/FindoTripLogo.png" alt="Findo Trip Logo" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden z-20" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={30} /> : <Menu size={30} />}
      </button>

      {/* Desktop Menu */}
      <ul className="hidden md:flex space-x-6 font-normal items-center">
        <li className="hover:text-green-500 cursor-pointer">
          <Link to="/hotels/rooms/Room">Rooms</Link>
        </li>
        <li className="hover:text-green-500 cursor-pointer">
          <Link to="/CarRent">Car Rentals</Link>
        </li>
        <li className="hover:text-green-500 cursor-pointer">
          <Link to="/Tours">Tours</Link>
        </li>
        <li className="hover:text-green-500 cursor-pointer">
          <Link to="/Blogs">Blogs</Link>
        </li>
        <li>
          <Link to="/auth" className="border-2 items-center border-[#01502E] text-[#01502E] px-4 py-1 rounded-md hover:bg-[#01502E] hover:text-white">Sign In</Link>
        </li>
        <li>
          <button className="border-2 border-red-500 text-red-500 px-4 py-1 rounded-md hover:bg-red-500 hover:text-white" onClick={() => setShowRegisterModal(true)}>
            Register
          </button>
        </li>
      </ul>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xs relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowRegisterModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-center">Register As</h2>
            <div className="flex flex-col gap-4">
              <Link to="/signup?type=user" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center">User</Link>
              <Link to="/signup?type=provider" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center">Service Provider</Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 h-full w-3/4 bg-white shadow-lg flex flex-col space-y-6 p-6 transform translate-x-full md:hidden z-10"
      >
        <ul className="space-y-4 font-semibold">
          <li className="hover:text-green-500 cursor-pointer">
            <Link to="/Room">Rooms</Link>
          </li>
          <li className="hover:text-green-500 cursor-pointer">
            <Link to="/CarRent">Car Rentals</Link>
          </li>
          <li className="hover:text-green-500 cursor-pointer">
            <Link to="/Tours">Tours</Link>
          </li>
          <li className="hover:text-green-500 cursor-pointer">
            <Link to="/Blogs">Blogs</Link>
          </li>
          <li>
            <button className="border border-green-500 text-green-500 px-4 py-1 rounded-md w-full hover:bg-green-500 hover:text-white">Sign In</button>
          </li>
          <li>
            <button className="border border-red-500 text-red-500 px-4 py-1 rounded-md w-full hover:bg-red-500 hover:text-white" onClick={() => setShowRegisterModal(true)}>Register</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
