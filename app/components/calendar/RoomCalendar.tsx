import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, Users, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";

export interface DateInfo {
  date: Date;
  price: number;
  basePrice: number;
  available: number;
  totalUnits: number;
  isBlocked: boolean;
  blockReason?: string;
  hasBooking: boolean;
  bookings?: Array<{
    id: string;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
  }>;
  minStay?: number;
  maxStay?: number;
}

interface RoomCalendarProps {
  roomName: string;
  basePrice: number;
  currency: string;
  totalUnits: number;
  dates: Map<string, DateInfo>;
  onDateClick?: (date: Date, info: DateInfo) => void;
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  monthsToShow?: number;
  className?: string;
}

export function RoomCalendar({
  roomName,
  basePrice,
  currency,
  totalUnits,
  dates,
  onDateClick,
  onDateRangeSelect,
  monthsToShow = 3,
  className,
}: RoomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectionStart, setSelectionStart] = React.useState<Date | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileMonthsToShow, setMobileMonthsToShow] = React.useState(1);

  // Detect mobile and adjust months to show
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setMobileMonthsToShow(1); // Single month on mobile
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveMonthsToShow = isMobile ? mobileMonthsToShow : monthsToShow;
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(addMonths(currentMonth, effectiveMonthsToShow - 1));
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDateInfo = (date: Date): DateInfo => {
    const key = format(date, "yyyy-MM-dd");
    const info = dates.get(key);
    
    if (info) return info;
    
    return {
      date,
      price: basePrice,
      basePrice,
      available: totalUnits,
      totalUnits,
      isBlocked: false,
      hasBooking: false,
    };
  };

  const getAvailabilityColor = (info: DateInfo): string => {
    if (info.isBlocked) return "bg-gray-900 text-white";
    if (info.hasBooking && info.available === 0) return "bg-red-500 text-white";
    
    const occupancyRate = info.totalUnits > 0 
      ? (info.totalUnits - info.available) / info.totalUnits 
      : 0;
    
    if (occupancyRate === 0) return "bg-green-100 hover:bg-green-200 border-green-300";
    if (occupancyRate < 0.5) return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300";
    if (occupancyRate < 1) return "bg-orange-100 hover:bg-orange-200 border-orange-300";
    return "bg-red-100 hover:bg-red-200 border-red-300";
  };

  const getPriceColor = (info: DateInfo): string => {
    if (info.price !== info.basePrice) return "text-purple-700 font-semibold";
    return "text-gray-700";
  };

  const handleDateMouseDown = (date: Date) => {
    setIsSelecting(true);
    setSelectionStart(date);
    setSelectedDates([date]);
  };

  const handleDateMouseEnter = (date: Date) => {
    if (isSelecting && selectionStart) {
      const start = selectionStart < date ? selectionStart : date;
      const end = selectionStart < date ? date : selectionStart;
      const range = eachDayOfInterval({ start, end });
      setSelectedDates(range);
    }
  };

  const handleDateMouseUp = () => {
    if (isSelecting && selectedDates.length > 0) {
      const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      if (onDateRangeSelect && sorted.length > 1) {
        onDateRangeSelect(sorted[0], sorted[sorted.length - 1]);
      } else if (onDateClick && sorted.length === 1) {
        onDateClick(sorted[0], getDateInfo(sorted[0]));
      }
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectedDates([]);
    }
  };

  React.useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting) {
        handleDateMouseUp();
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isSelecting, selectedDates]);

  const groupedByMonth = React.useMemo(() => {
    const groups: { month: Date; days: Date[] }[] = [];
    let currentGroup: { month: Date; days: Date[] } | null = null;

    allDays.forEach((day) => {
      const monthStart = startOfMonth(day);
      if (!currentGroup || !isSameMonth(currentGroup.month, monthStart)) {
        currentGroup = { month: monthStart, days: [] };
        groups.push(currentGroup);
      }
      currentGroup.days.push(day);
    });

    return groups;
  }, [allDays]);

  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some((d) => isSameDay(d, date));
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ROOM CALENDAR: {roomName}
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Base Price: {currency} {basePrice.toLocaleString()}/night
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {totalUnits} rooms available
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-base sm:text-lg font-semibold text-gray-900 px-2 sm:px-4 text-center flex-1 sm:flex-none">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant={monthsToShow === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => {/* Handle 3 months view */}}
            >
              3 Months
            </Button>
            <Button
              variant={monthsToShow === 6 ? "default" : "outline"}
              size="sm"
              onClick={() => {/* Handle 6 months view */}}
            >
              6 Months
            </Button>
          </div>
        )}
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="w-full"
          >
            Go to Today
          </Button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-8">
        {groupedByMonth.map(({ month, days }) => (
          <Card key={format(month, "yyyy-MM")} className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {format(month, "MMMM yyyy")}
            </h3>
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-700 py-2 text-sm"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty cells for days before month start */}
              {Array.from({ length: days[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Actual days */}
              {days.map((day) => {
                const info = getDateInfo(day);
                const isSelected = isDateSelected(day);
                const isCurrentDay = isToday(day);
                const bgColor = getAvailabilityColor(info);
                const priceColor = getPriceColor(info);
                const hasCustomPrice = info.price !== info.basePrice;

                return (
                  <div
                    key={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "aspect-square border-2 rounded-lg p-1 sm:p-2 cursor-pointer transition-all touch-manipulation",
                      bgColor,
                      isSelected && "ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2",
                      isCurrentDay && "ring-2 ring-[#01502E]",
                      info.hasBooking && "border-blue-500 border-2",
                      hasCustomPrice && "border-purple-500"
                    )}
                    onMouseDown={() => !isMobile && handleDateMouseDown(day)}
                    onMouseEnter={() => !isMobile && handleDateMouseEnter(day)}
                    onTouchStart={() => isMobile && handleDateMouseDown(day)}
                    onClick={() => onDateClick?.(day, info)}
                  >
                    <div className="flex flex-col h-full">
                      <div className={cn(
                        "text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1",
                        info.isBlocked ? "text-white" : "text-gray-900"
                      )}>
                        {format(day, "d")}
                      </div>
                      <div className={cn("text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1", priceColor)}>
                        {currency} {info.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs mt-auto">
                        {info.isBlocked ? (
                          <span className="text-white font-medium">
                            {isMobile ? "✗" : (info.blockReason || "BLOCKED")}
                          </span>
                        ) : info.hasBooking && info.available === 0 ? (
                          <span className="text-white font-medium">{isMobile ? "✗" : "BOOKED"}</span>
                        ) : (
                          <span className={cn(
                            info.available === info.totalUnits ? "text-green-700" :
                            info.available < info.totalUnits / 2 ? "text-orange-700" :
                            "text-yellow-700"
                          )}>
                            {isMobile ? `✓${info.available}` : `✓${info.available}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="mt-6 p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">LEGEND:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
            <span>Available (All rooms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
            <span>Limited (&lt; 50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
            <span>Mostly Booked (1-49%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Fully Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500 border-2 border-purple-500" />
            <span>Custom Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-900" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-500" />
            <span>Has Bookings</span>
          </div>
        </div>
      </Card>

      {/* Selection Info */}
      {selectedDates.length > 0 && (
        <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">SELECTION:</span>
              <span className="ml-2 text-sm text-gray-700">
                {selectedDates.length === 1
                  ? format(selectedDates[0], "MMMM d, yyyy")
                  : `${format(selectedDates[0], "MMM d")} - ${format(selectedDates[selectedDates.length - 1], "MMM d, yyyy")} (${selectedDates.length} dates)`}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDates([])}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

