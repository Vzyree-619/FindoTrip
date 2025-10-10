import { useState, useEffect } from "react";
import { Link, useLocation } from "@remix-run/react";
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Heart, 
  User, 
  Calendar,
  Car,
  MapPin,
  LogOut,
  Settings
} from "lucide-react";

interface MobileNavigationProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function MobileNavigation({ user }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/accommodations", icon: Search, label: "Search" },
    { to: "/vehicles", icon: Car, label: "Car Rentals" },
    { to: "/tours", icon: MapPin, label: "Tours" },
  ];

  const userMenuItems = user ? [
    { to: "/dashboard", icon: User, label: "Dashboard" },
    { to: "/dashboard/bookings", icon: Calendar, label: "My Bookings" },
    { to: "/dashboard/favorites", icon: Heart, label: "Favorites" },
    { to: "/dashboard/profile", icon: Settings, label: "Profile" },
  ] : [
    { to: "/login", icon: User, label: "Sign In" },
    { to: "/register", icon: User, label: "Sign Up" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <nav
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="/FindoTripLogo.png"
                  alt="FindoTrip"
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-[#01502E]">FindoTrip</span>
              </Link>
            </div>
            
            {user && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#01502E] text-white rounded-full">
                  {user.role.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Explore
              </p>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#01502E] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="px-4 mt-6 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </p>
              {userMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#01502E] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <form method="post" action="/logout">
                <button
                  type="submit"
                  className="flex items-center w-full px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation for Mobile (Alternative/Additional) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4 h-16">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? 'text-[#01502E] bg-green-50'
                    : 'text-gray-600 hover:text-[#01502E] hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
