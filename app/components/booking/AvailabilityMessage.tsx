import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface AvailabilityMessageProps {
  availability: DateRangeAvailabilityResult;
  roomName: string;
}

export function AvailabilityMessage({
  availability,
  roomName
}: AvailabilityMessageProps) {

  if (availability.isAvailable) {
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-green-800 mb-1">
            ✓ {roomName} is available for your dates!
          </h4>
          <p className="text-sm text-green-700">
            You can proceed with booking
          </p>
        </div>
      </div>
    );
  }

  // Not available - show specific reason
  if (availability.minStay && availability.requestedNights && availability.requestedNights < availability.minStay) {
    return (
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
            Minimum Stay Requirement
          </h4>
          <p className="text-sm text-yellow-700 mb-2">
            This room requires a minimum stay of {availability.minStay} nights for your selected dates.
            You selected {availability.requestedNights} nights.
          </p>
          <p className="text-sm text-yellow-700">
            Please select at least {availability.minStay - availability.requestedNights} more night(s).
          </p>
        </div>
      </div>
    );
  }

  if (availability.conflicts && availability.conflicts.length > 0) {
    const blockedDates = availability.conflicts.filter(c => c.type === 'BLOCKED');
    const bookedDates = availability.conflicts.filter(c => c.type === 'FULLY_BOOKED');

    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            ✗ {roomName} is not available for these dates
          </h4>

          {blockedDates.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-red-700 mb-1">
                Blocked Dates ({blockedDates.length}):
              </h5>
              <ul className="text-xs text-red-600 space-y-1">
                {blockedDates.slice(0, 3).map(conflict => (
                  <li key={conflict.date} className="flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>
                      {format(new Date(conflict.date), 'MMM d, yyyy')}: {conflict.reason}
                    </span>
                  </li>
                ))}
                {blockedDates.length > 3 && (
                  <li className="text-red-500">
                    ... and {blockedDates.length - 3} more dates
                  </li>
                )}
              </ul>
            </div>
          )}

          {bookedDates.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-red-700 mb-1">
                Fully Booked ({bookedDates.length}):
              </h5>
              <ul className="text-xs text-red-600 space-y-1">
                {bookedDates.slice(0, 3).map(conflict => (
                  <li key={conflict.date} className="flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>
                      {format(new Date(conflict.date), 'MMM d, yyyy')}: {conflict.reason}
                    </span>
                  </li>
                ))}
                {bookedDates.length > 3 && (
                  <li className="text-red-500">
                    ... and {bookedDates.length - 3} more dates
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-800 mb-1">
          ✗ {roomName} is not available
        </h4>
        <p className="text-sm text-red-700">
          {availability.reason || 'Please select different dates'}
        </p>
      </div>
    </div>
  );
}

// TypeScript interfaces
interface DateRangeAvailabilityResult {
  isAvailable: boolean;
  conflicts?: Array<{
    date: string;
    type: 'BLOCKED' | 'FULLY_BOOKED' | 'PARTIALLY_AVAILABLE';
    reason: string;
    availableUnits: number;
  }>;
  reason?: string;
  minStay?: number;
  requestedNights?: number;
}
