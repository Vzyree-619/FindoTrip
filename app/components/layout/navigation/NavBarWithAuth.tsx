import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut, Settings, Heart, Calendar, ChevronDown, MessageCircle, Plus } from "lucide-react";
import { Link, Form, useLocation } from "@remix-run/react";

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
  const location = useLocation();

  // Helper function to check if a link is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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

  // Role-aware dashboard path
  const dashboardPath =
    user?.role === "PROPERTY_OWNER"
      ? "/dashboard/provider"
      : user?.role === "VEHICLE_OWNER"
        ? "/dashboard/vehicle-owner"
        : user?.role === "TOUR_GUIDE"
          ? "/dashboard/guide"
          : "/dashboard";
  const isProvider =
    user?.role === "PROPERTY_OWNER" ||
    user?.role === "VEHICLE_OWNER" ||
    user?.role === "TOUR_GUIDE";
  
  const isAdmin = 
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "PROVIDER_ADMIN" ||
    user?.role === "CUSTOMER_ADMIN";

  // Provider-specific labels/paths
  const providerManagePath =
    user?.role === "PROPERTY_OWNER"
      ? "/dashboard/provider"
      : user?.role === "VEHICLE_OWNER"
        ? "/dashboard/vehicle-owner"
        : user?.role === "TOUR_GUIDE"
          ? "/dashboard/guide"
          : undefined;
  const providerCreatePath = providerManagePath ? `${providerManagePath}#create` : undefined;
  const providerManageLabel =
    user?.role === "PROPERTY_OWNER"
      ? "Manage Properties"
      : user?.role === "VEHICLE_OWNER"
        ? "Manage Vehicles"
        : user?.role === "TOUR_GUIDE"
          ? "Manage Tours"
          : undefined;
  const providerCreateLabel =
    user?.role === "PROPERTY_OWNER"
      ? "Add Property"
      : user?.role === "VEHICLE_OWNER"
        ? "Add Vehicle"
        : user?.role === "TOUR_GUIDE"
          ? "Create Tour"
          : undefined;

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
      <ul className="hidden md:flex space-x-6 items-center">
        {!isProvider && !isAdmin && (
        <li>
          <Link 
            to="/accommodations"
            className={`cursor-pointer transition-colors duration-200 ${
              isActive('/accommodations') 
                ? 'font-semibold text-[#01502E]' 
                : 'font-normal text-gray-700 hover:text-orange-500'
            }`}
          >
            Stays
          </Link>
        </li>
        )}
        {!isProvider && !isAdmin && (
        <li>
          <Link 
            to="/vehicles"
            className={`cursor-pointer transition-colors duration-200 ${
              isActive('/vehicles') 
                ? 'font-semibold text-[#01502E]' 
                : 'font-normal text-gray-700 hover:text-orange-500'
            }`}
          >
            Car Rentals
          </Link>
        </li>
        )}
        {!isProvider && !isAdmin && (
        <li>
          <Link 
            to="/tours"
            className={`cursor-pointer transition-colors duration-200 ${
              isActive('/tours') 
                ? 'font-semibold text-[#01502E]' 
                : 'font-normal text-gray-700 hover:text-orange-500'
            }`}
          >
            Tours
          </Link>
        </li>
        )}
        {!isProvider && !isAdmin && (
        <li>
          <Link 
            to="/blogs"
            className={`cursor-pointer transition-colors duration-200 ${
              isActive('/blogs') 
                ? 'font-semibold text-[#01502E]' 
                : 'font-normal text-gray-700 hover:text-orange-500'
            }`}
          >
            Blogs
          </Link>
        </li>
        )}

        {/* Admin Dashboard Link */}
        {isAdmin && (
          <li>
            <Link
              to="/admin"
              className={`cursor-pointer transition-colors duration-200 ${
                isActive('/admin') 
                  ? 'font-semibold text-[#01502E]' 
                  : 'font-normal text-gray-700 hover:text-orange-500'
              }`}
            >
              Admin Panel
            </Link>
          </li>
        )}

        {/* Removed top-level Dashboard item to avoid duplication and reduce redirect loops */}
        {user && (
          <li>
            <Link
              to="/dashboard/messages"
              className={`relative cursor-pointer transition-colors duration-200 ${
                isActive('/dashboard/messages')
                  ? 'font-semibold text-[#01502E]'
                  : 'font-normal text-gray-700 hover:text-orange-500'
              }`}
            >
              <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Messages</span>
              <UnreadBadge />
            </Link>
          </li>
        )}

        {user ? (
          /* User Menu (Logged In) */
          <li className="relative z-50">
            <div ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
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
                    to={dashboardPath}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} />
                    Dashboard
                  </Link>

                  {isProvider && (
                    <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500">Provider</div>
                  )}

                  {isProvider && providerManagePath && providerManageLabel && (
                    <Link
                      to={providerManagePath}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={16} />
                      {providerManageLabel}
                    </Link>
                  )}

                  {isProvider && providerCreatePath && providerCreateLabel && (
                    <Link
                      to={providerCreatePath}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Plus size={16} />
                      {providerCreateLabel}
                    </Link>
                  )}

                  <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500">Account</div>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} />
                    My Profile
                  </Link>

                  {!isProvider && (
                    <Link
                      to="/dashboard/bookings"
                      reloadDocument
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Calendar size={16} />
                      My Bookings
                    </Link>
                  )}

                  {!isProvider && (
                    <Link
                      to="/dashboard/favorites"
                      reloadDocument
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart size={16} />
                      Wishlist
                    </Link>
                  )}

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
                className="border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition-colors duration-200 font-medium"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className="border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition-colors duration-200 font-medium"
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
          <ul className="space-y-4">
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
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-[#01502E]/10 text-[#01502E]">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </li>
            )}

            {!isProvider && !isAdmin && (
            <li>
              <Link 
                to="/accommodations" 
                onClick={() => setIsOpen(false)}
                className={`cursor-pointer transition-colors duration-200 ${
                  isActive('/accommodations') 
                    ? 'font-semibold text-[#01502E]' 
                    : 'font-normal text-gray-700 hover:text-orange-500'
                }`}
              >
                Stays
              </Link>
            </li>
            )}
            {!isProvider && !isAdmin && (
            <li>
              <Link 
                to="/vehicles" 
                onClick={() => setIsOpen(false)}
                className={`cursor-pointer transition-colors duration-200 ${
                  isActive('/vehicles') 
                    ? 'font-semibold text-[#01502E]' 
                    : 'font-normal text-gray-700 hover:text-orange-500'
                }`}
              >
                Car Rentals
              </Link>
            </li>
            )}
            {!isProvider && !isAdmin && (
            <li>
              <Link 
                to="/tours" 
                onClick={() => setIsOpen(false)}
                className={`cursor-pointer transition-colors duration-200 ${
                  isActive('/tours') 
                    ? 'font-semibold text-[#01502E]' 
                    : 'font-normal text-gray-700 hover:text-orange-500'
                }`}
              >
                Tours
              </Link>
            </li>
            )}
            {!isProvider && !isAdmin && (
            <li>
              <Link 
                to="/blogs" 
                onClick={() => setIsOpen(false)}
                className={`cursor-pointer transition-colors duration-200 ${
                  isActive('/blogs') 
                    ? 'font-semibold text-[#01502E]' 
                    : 'font-normal text-gray-700 hover:text-orange-500'
                }`}
              >
                Blogs
              </Link>
            </li>
            )}

            {isAdmin && (
              <li className="pt-4 border-t border-gray-200">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={18} />
                  Admin Panel
                </Link>
              </li>
            )}

            {user ? (
              <>
                <li className="pt-4 border-t border-gray-200">
                  <Link
                    to={dashboardPath}
                    className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={18} />
                    Dashboard
                  </Link>
                </li>

                {isProvider && providerManagePath && providerManageLabel && (
                  <>
                    <li className="px-1 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500">Provider</li>
                    <li>
                      <Link
                        to={providerManagePath}
                        className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                        onClick={() => setIsOpen(false)}
                      >
                        <Settings size={18} />
                        {providerManageLabel}
                      </Link>
                    </li>
                  </>
                )}

                {isProvider && providerCreatePath && providerCreateLabel && (
                  <li>
                    <Link
                      to={providerCreatePath}
                      className="flex items-center gap-3 text-gray-700 hover:text-[#01502E] transition"
                      onClick={() => setIsOpen(false)}
                    >
                      <Plus size={18} />
                      {providerCreateLabel}
                    </Link>
                  </li>
                )}
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
                {!isProvider && (
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
                )}
                {!isProvider && (
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
                )}
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
                    className="block text-center border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition-colors duration-200 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="block text-center border border-[#01502E] text-[#01502E] px-4 py-2 rounded-lg hover:bg-[#01502E] hover:text-white transition-colors duration-200 font-medium"
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

function UnreadBadge() {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/chat/unread-count');
        const json = await res.json();
        if (mounted) setCount(json?.data?.total || 0);
      } catch {}
    })();
    // Poll every 30s
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/chat/unread-count');
        const json = await res.json();
        setCount(json?.data?.total || 0);
      } catch {}
    }, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);
  if (!count) return null;
  return (
    <span className="absolute -top-2 -right-3 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
      {count}
    </span>
  );
}
