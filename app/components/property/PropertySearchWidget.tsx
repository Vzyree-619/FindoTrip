import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useNavigation } from "@remix-run/react";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { DatePicker } from "~/components/ui/date-picker";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface PropertySearchWidgetProps {
  propertyId: string;
  sticky?: boolean;
}

export default function PropertySearchWidget({ propertyId, sticky = true }: PropertySearchWidgetProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isRouteNavigation = navigation.location?.pathname === `/accommodations/${propertyId}`;
  const navBusy = navigation.state !== "idle" && isRouteNavigation;
  const [isUpdating, setIsUpdating] = useState(false);

  // Mirror Remix navigation state but avoid getting stuck; also add a timeout guard
  useEffect(() => {
    if (navBusy) {
      setIsUpdating(true);
    } else {
      setIsUpdating(false);
    }
  }, [navBusy]);

  useEffect(() => {
    if (!isUpdating) return;
    const t = setTimeout(() => setIsUpdating(false), 15000); // fallback if something hangs
    return () => clearTimeout(t);
  }, [isUpdating]);

  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    checkInParam ? new Date(checkInParam) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    checkOutParam ? new Date(checkOutParam) : undefined
  );
  const [adults, setAdults] = useState(searchParams.get('adults') || '2');
  const [children, setChildren] = useState(searchParams.get('children') || '0');
  const [errors, setErrors] = useState<{ checkIn?: string; checkOut?: string }>({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const minCheckOut = checkIn 
    ? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)
    : new Date(today.getTime() + 24 * 60 * 60 * 1000);
  minCheckOut.setHours(0, 0, 0, 0);

  const validateDates = () => {
    const newErrors: { checkIn?: string; checkOut?: string } = {};
    
    if (checkIn && checkOut) {
      if (checkOut <= checkIn) {
        newErrors.checkOut = 'Check-out must be after check-in';
      }
      
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
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
    setIsUpdating(true);

    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn.toISOString().split('T')[0]);
    if (checkOut) params.set('checkOut', checkOut.toISOString().split('T')[0]);
    params.set('adults', adults);
    params.set('children', children);

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

    if (urlCheckIn) setCheckIn(new Date(urlCheckIn));
    if (urlCheckOut) setCheckOut(new Date(urlCheckOut));
    if (urlAdults) setAdults(urlAdults);
    if (urlChildren) setChildren(urlChildren);
  }, [searchParams]);

  return (
    <div
      className={`bg-white border-b border-gray-200 shadow-sm ${sticky ? 'sticky top-16 z-40' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Check-in */}
          <div className="space-y-2 opacity-100">
            <Label htmlFor="check-in" className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              Check-in
            </Label>
            <DatePicker
              date={checkIn}
              onSelect={(date) => {
                setCheckIn(date);
                if (errors.checkIn) setErrors({ ...errors, checkIn: undefined });
              }}
              placeholder="Select check-in date"
              minDate={today}
              className={errors.checkIn ? 'border-red-500' : ''}
              disabled={!!isUpdating}
            />
            {errors.checkIn && (
              <p className="text-xs text-red-600">{errors.checkIn}</p>
            )}
          </div>

          {/* Check-out */}
          <div className="space-y-2 opacity-100">
            <Label htmlFor="check-out" className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              Check-out
            </Label>
            <DatePicker
              date={checkOut}
              onSelect={(date) => {
                setCheckOut(date);
                if (errors.checkOut) setErrors({ ...errors, checkOut: undefined });
              }}
              placeholder="Select check-out date"
              minDate={minCheckOut}
              className={errors.checkOut ? 'border-red-500' : ''}
              disabled={!!isUpdating || !checkIn}
            />
            {errors.checkOut && (
              <p className="text-xs text-red-600">{errors.checkOut}</p>
            )}
          </div>

          {/* Adults */}
          <div className="space-y-2 opacity-100">
            <Label htmlFor="adults" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Adults
            </Label>
            <Select value={adults} onValueChange={setAdults} disabled={!!isUpdating}>
              <SelectTrigger id="adults">
                <SelectValue placeholder="Adults" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Adult' : 'Adults'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Children */}
          <div className="space-y-2 opacity-100">
            <Label htmlFor="children" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Children
            </Label>
            <Select value={children} onValueChange={setChildren} disabled={!!isUpdating}>
              <SelectTrigger id="children">
                <SelectValue placeholder="Children" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Child' : 'Children'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Update Button */}
          <div className="flex items-end">
            <Button
              onClick={handleUpdate}
              className="w-full bg-[#01502E] hover:bg-[#013d23] text-white flex items-center justify-center gap-2"
              disabled={!!isUpdating}
            >
              {isUpdating && (
                <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              )}
              {isUpdating ? "Updating..." : "Update Search"}
            </Button>
          </div>
        </div>

        {/* Show nights if dates selected */}
        {checkIn && checkOut && !errors.checkOut && (
          <div className="mt-3 text-sm text-muted-foreground">
            {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} night(s) selected
          </div>
        )}
      </div>
    </div>
  );
}

