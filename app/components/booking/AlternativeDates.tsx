import { Calendar, ChevronRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface AlternativeDatesProps {
  suggestions: DateSuggestion[];
  onSelect: (checkIn: string, checkOut: string) => void;
  currency?: string;
}

export function AlternativeDates({
  suggestions,
  onSelect,
  currency = "PKR"
}: AlternativeDatesProps) {

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-800">
          📅 Try These Available Dates Instead:
        </h4>
      </div>
      <p className="text-sm text-blue-700 mb-4">
        We found {suggestions.length} alternative option{suggestions.length !== 1 ? 's' : ''} near your preferred dates
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const checkIn = new Date(suggestion.checkInDate);
          const checkOut = new Date(suggestion.checkOutDate);
          const nights = differenceInDays(checkOut, checkIn);

          return (
            <div key={index} className="bg-white border border-blue-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {format(checkIn, 'MMM d')} - {format(checkOut, 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-600">
                        ({nights} night{nights !== 1 ? 's' : ''})
                      </div>
                    </div>
                  </div>

                  {suggestion.daysDifferent !== 0 && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      suggestion.daysDifferent < 0
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {Math.abs(suggestion.daysDifferent)} day{Math.abs(suggestion.daysDifferent) !== 1 ? 's' : ''} {
                        suggestion.daysDifferent < 0 ? 'earlier' : 'later'
                      }
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-[#01502E]">
                    {currency} {suggestion.totalPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {currency} {suggestion.avgPricePerNight.toFixed(0)}/night avg
                  </div>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#01502E] text-white text-sm font-medium rounded-md hover:bg-[#013d23] transition-colors"
                onClick={() => onSelect(suggestion.checkInDate, suggestion.checkOutDate)}
              >
                Select These Dates
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {suggestions.length >= 5 && (
        <div className="text-center mt-4">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View more options →
          </button>
        </div>
      )}
    </div>
  );
}

// TypeScript interfaces
interface DateSuggestion {
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  avgPricePerNight: number;
  daysDifferent: number; // negative = before, positive = after
}
