import React, { useState, useMemo } from 'react';
import { format, startOfDay, isSameDay, isBefore, isAfter, addMonths, subMonths, addDays, differenceInDays, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { toast } from 'react-hot-toast';
import { CalendarDateAvailability } from '~/lib/availability.server';

interface DatePickerProps {
  roomId: string;
  availabilityCalendar: CalendarDateAvailability[];
  onDateSelect: (checkIn: Date, checkOut: Date) => void;
  minStay?: number;
  maxStay?: number;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
}

export function DatePicker({
  roomId,
  availabilityCalendar,
  onDateSelect,
  minStay = 1,
  maxStay,
  initialCheckIn,
  initialCheckOut
}: DatePickerProps) {

  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn || null);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut || null);
  const [currentMonth, setCurrentMonth] = useState(initialCheckIn || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Create map of date availability for fast lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, CalendarDateAvailability>();
    availabilityCalendar.forEach(day => {
      map.set(format(new Date(day.date), 'yyyy-MM-dd'), day);
    });
    return map;
  }, [availabilityCalendar]);

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const availability = availabilityMap.get(dateKey);
    const today = startOfDay(new Date());

    // Cannot select past dates
    if (isBefore(date, today)) {
      toast.error('Cannot select past dates');
      return;
    }

    // Cannot select unavailable dates
    if (!availability || !availability.isAvailable) {
      const reason = availability?.blockReason || 'This date is not available';
      toast.error(reason);
      return;
    }

    // If no check-in selected, set check-in
    if (!checkIn) {
      setCheckIn(date);
      return;
    }

    // If check-in selected but no check-out
    if (checkIn && !checkOut) {
      // Check-out must be after check-in
      if (isBefore(date, checkIn)) {
        toast.error('Check-out must be after check-in');
        return;
      }

      // Check if all dates between check-in and this date are available
      const allDatesAvailable = checkDatesBetweenAvailable(checkIn, date);
      if (!allDatesAvailable.isAvailable) {
        toast.error(`Cannot select: ${allDatesAvailable.reason}`);
        return;
      }

      // Check minimum stay
      const nights = differenceInDays(date, checkIn);
      if (nights < minStay) {
        toast.error(`Minimum ${minStay} nights required`);
        return;
      }

      // Check maximum stay
      if (maxStay && nights > maxStay) {
        toast.error(`Maximum ${maxStay} nights allowed`);
        return;
      }

      // Valid selection
      setCheckOut(date);
      onDateSelect(checkIn, date);
      return;
    }

    // If both selected, start new selection
    setCheckIn(date);
    setCheckOut(null);
  };

  const checkDatesBetweenAvailable = (start: Date, end: Date) => {
    let current = new Date(start);
    const unavailableDates: Date[] = [];

    while (current < end) {
      const dateKey = format(current, 'yyyy-MM-dd');
      const availability = availabilityMap.get(dateKey);

      if (!availability || !availability.isAvailable) {
        unavailableDates.push(new Date(current));
      }

      current = addDays(current, 1);
    }

    if (unavailableDates.length > 0) {
      return {
        isAvailable: false,
        reason: `${unavailableDates.length} date(s) in range are unavailable`
      };
    }

    return { isAvailable: true };
  };

  const getDateClassName = (date: Date): string => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const availability = availabilityMap.get(dateKey);
    const today = startOfDay(new Date());

    let classes = ['date-cell'];

    // Past dates
    if (isBefore(date, today)) {
      classes.push('past-date');
      return classes.join(' ');
    }

    // Not available
    if (!availability || !availability.isAvailable) {
      if (availability?.reason === 'BLOCKED') {
        classes.push('blocked-date');
      } else {
        classes.push('booked-date');
      }
      return classes.join(' ');
    }

    // Selected dates
    if (checkIn && isSameDay(date, checkIn)) {
      classes.push('selected-checkin');
    }
    if (checkOut && isSameDay(date, checkOut)) {
      classes.push('selected-checkout');
    }

    // Dates between selection
    if (checkIn && checkOut && isAfter(date, checkIn) && isBefore(date, checkOut)) {
      classes.push('in-range');
    }

    // Hover preview
    if (checkIn && !checkOut && hoverDate && isAfter(date, checkIn) && isBefore(date, hoverDate)) {
      classes.push('hover-range');
    }

    // Availability status
    if (availability.occupancyPercent && availability.occupancyPercent > 70) {
      classes.push('limited-availability');
    } else {
      classes.push('available');
    }

    return classes.join(' ');
  };

  const clearDates = () => {
    setCheckIn(null);
    setCheckOut(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateKey = format(cloneDay, 'yyyy-MM-dd');
        const availability = availabilityMap.get(dateKey);

        days.push(
          <div
            key={day.toString()}
            className={`relative p-2 text-center cursor-pointer transition-all duration-200 ${getDateClassName(cloneDay)}`}
            onClick={() => handleDateClick(cloneDay)}
            onMouseEnter={() => setHoverDate(cloneDay)}
            onMouseLeave={() => setHoverDate(null)}
          >
            <div className="text-sm font-medium">
              {format(day, dateFormat)}
            </div>

            {/* Price indicator */}
            {availability?.price && (
              <div className="text-xs opacity-75">
                ${availability.price}
              </div>
            )}

            {/* Availability indicator */}
            {availability && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full">
                {availability.isAvailable ? (
                  availability.occupancyPercent > 70 ? (
                    <div className="w-full h-full bg-yellow-400 rounded-full"></div>
                  ) : (
                    <div className="w-full h-full bg-green-400 rounded-full"></div>
                  )
                ) : (
                  <div className="w-full h-full bg-red-400 rounded-full"></div>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="date-picker bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Dates</h2>
        {(checkIn || checkOut) && (
          <button
            onClick={clearDates}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Selected dates display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-gray-600 mb-1">Check-in</label>
            <div className="font-medium">
              {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select date'}
            </div>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Check-out</label>
            <div className="font-medium">
              {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select date'}
            </div>
          </div>
        </div>

        {checkIn && checkOut && (
          <div className="mt-2 text-sm text-gray-600">
            {differenceInDays(checkOut, checkIn)} nights selected
          </div>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar */}
      {renderCalendar()}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Limited availability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {checkIn && checkOut && (
        <div className="mt-6 flex gap-3">
          <Button
            onClick={clearDates}
            variant="outline"
            className="flex-1"
          >
            Clear Dates
          </Button>
          <Button
            onClick={() => onDateSelect(checkIn, checkOut)}
            className="flex-1 bg-[#01502E] hover:bg-[#013d23]"
          >
            Confirm Dates
          </Button>
        </div>
      )}
    </div>
  );
}

// CSS styles (would go in a CSS file)
const styles = `
.date-cell {
  @apply hover:bg-gray-100 rounded-lg transition-colors;
}

.date-cell.selected-checkin {
  @apply bg-blue-600 text-white;
}

.date-cell.selected-checkout {
  @apply bg-blue-600 text-white;
}

.date-cell.in-range {
  @apply bg-blue-100 text-blue-900;
}

.date-cell.hover-range {
  @apply bg-blue-50 text-blue-900;
}

.date-cell.available {
  @apply text-gray-900;
}

.date-cell.limited-availability {
  @apply text-yellow-700;
}

.date-cell.booked-date,
.date-cell.blocked-date,
.date-cell.past-date {
  @apply text-gray-400 cursor-not-allowed;
  @apply line-through;
}

.date-cell.booked-date {
  @apply bg-red-50;
}

.date-cell.blocked-date {
  @apply bg-gray-100;
}

.date-cell.past-date {
  @apply bg-gray-50;
}
`;
