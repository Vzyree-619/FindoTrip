import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "@remix-run/react";
import { Calendar, Users } from "lucide-react";

interface PropertySearchWidgetProps {
  propertyId: string;
  sticky?: boolean;
}

export default function PropertySearchWidget({ propertyId, sticky = true }: PropertySearchWidgetProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [adults, setAdults] = useState(parseInt(searchParams.get('adults') || '2'));
  const [children, setChildren] = useState(parseInt(searchParams.get('children') || '0'));
  const [errors, setErrors] = useState<{ checkIn?: string; checkOut?: string }>({});

  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = checkIn ? new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : today;

  const validateDates = () => {
    const newErrors: { checkIn?: string; checkOut?: string } = {};
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'Check-out must be after check-in';
      }
      
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      if (nights < 1) {
        newErrors.checkOut = 'Minimum stay is 1 night';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = () => {
    if (!validateDates()) {
      return;
    }

    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('adults', adults.toString());
    params.set('children', children.toString());

    // Update URL without full page reload
    navigate(`/accommodations/${propertyId}?${params.toString()}`, { replace: true });
    
    // Scroll to rooms section
    setTimeout(() => {
      const roomsTab = document.querySelector('[data-rooms-tab]');
      if (roomsTab) {
        roomsTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  useEffect(() => {
    // Sync with URL params on mount
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlAdults = searchParams.get('adults');
    const urlChildren = searchParams.get('children');

    if (urlCheckIn) setCheckIn(urlCheckIn);
    if (urlCheckOut) setCheckOut(urlCheckOut);
    if (urlAdults) setAdults(parseInt(urlAdults));
    if (urlChildren) setChildren(parseInt(urlChildren));
  }, [searchParams]);

  return (
    <div
      className={`bg-white border-b border-gray-200 shadow-sm ${sticky ? 'sticky top-0 z-50' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Check-in */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (errors.checkIn) setErrors({ ...errors, checkIn: undefined });
              }}
              min={today}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent ${
                errors.checkIn ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.checkIn && (
              <p className="text-xs text-red-600 mt-1">{errors.checkIn}</p>
            )}
          </div>

          {/* Check-out */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                if (errors.checkOut) setErrors({ ...errors, checkOut: undefined });
              }}
              min={minCheckOut}
              disabled={!checkIn}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.checkOut ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.checkOut && (
              <p className="text-xs text-red-600 mt-1">{errors.checkOut}</p>
            )}
          </div>

          {/* Adults */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Adults
            </label>
            <select
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
              ))}
            </select>
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Children
            </label>
            <select
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            >
              {[0, 1, 2, 3, 4].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
              ))}
            </select>
          </div>

          {/* Update Button */}
          <div className="flex items-end">
            <button
              onClick={handleUpdate}
              className="w-full bg-[#01502E] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#013d23] transition-colors"
            >
              Update Search
            </button>
          </div>
        </div>

        {/* Show nights if dates selected */}
        {checkIn && checkOut && !errors.checkOut && (
          <div className="mt-3 text-sm text-gray-600">
            {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} night(s) selected
          </div>
        )}
      </div>
    </div>
  );
}

