import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut, Settings, Heart, Calendar, ChevronDown } from "lucide-react";
import { Link, Form } from "@remix-run/react";

interface NavBarUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
}

interface NavBarProps {
  user?: NavBarUser | null;
}

const NavBar = ({ user }: NavBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <>
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center relative z-50">
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
      <button 
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="block md:hidden z-[999] p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
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

        {user ? (
          /* User Menu (Logged In) */
          <li className="relative z-50">
            <div ref={userMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("User menu clicked!");
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#01502E] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-gray-700">{user.name.split(" ")[0]}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[999]">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-[#01502E]/10 text-[#01502E]">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>

                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} />
                    My Profile
                  </Link>

                  <Link
                    to="/dashboard/bookings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Calendar size={16} />
                    My Bookings
                  </Link>

                  <Link
                    to="/dashboard/favorites"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Heart size={16} />
                    Wishlist
                  </Link>

                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>

                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <Form method="post" action="/logout">
                      <button
                        type="submit"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </Form>
                  </div>
                </div>
              )}
            </div>
          </li>
        ) : (
          /* Login/Register Buttons (Logged Out) */
          <>
            <li>
              <Link
                to="/login"
                className="border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition font-semibold"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className="bg-[#01502E] text-white px-4 py-2 rounded-lg hover:bg-[#013d23] transition font-semibold"
              >
                Register
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* Mobile Menu Overlay - Only render when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-[997] md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Only render on mobile */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:hidden transform ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        } transition-transform duration-300 ease-in-out z-[998] bg-white`}
      >
        <div className="flex flex-col h-full divide-y divide-gray-200 shadow-xl p-6">
          <ul className="space-y-4 font-semibold">
            {user && (
              <li className="pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#01502E] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </li>
            )}

            <li className="hover:text-[#01502E] cursor-pointer transition">
              <Link to="/accommodations/search" onClick={() => setIsOpen(false)}>
                Stays
              </Link>
            </li>
            <li className="hover:text-[#01502E] cursor-pointer transition">
              <Link to="/car_rentals" onClick={() => setIsOpen(false)}>
                Car Rentals
              </Link>
            </li>
            <li className="hover:text-[#01502E] cursor-pointer transition">
              <Link to="/tours" onClick={() => setIsOpen(false)}>
                Tours
              </Link>
            </li>
            <li className="hover:text-[#01502E] cursor-pointer transition">
              <Link to="/blogs" onClick={() => setIsOpen(false)}>
                Blogs
              </Link>
            </li>

            {user ? (
              <>
                <li className="pt-4 border-t border-gray-200">
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={18} />
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/bookings"
                    className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <Calendar size={18} />
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/favorites"
                    className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <Heart size={18} />
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                </li>
                <li className="pt-4">
                  <Form method="post" action="/logout">
                    <button
                      type="submit"
                      className="flex items-center gap-3 text-red-600 hover:text-red-700 transition w-full"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </Form>
                </li>
              </>
            ) : (
              <>
                <li className="pt-4">
                  <Link
                    to="/login"
                    className="block text-center border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="block text-center bg-[#01502E] text-white px-4 py-2 rounded-lg hover:bg-[#013d23] transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
    </>
  );
};

export default NavBar;