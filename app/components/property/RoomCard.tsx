import { useState, useEffect } from "react";
import { Bed, Users, Maximize2, Check, X } from "lucide-react";
import { calculateBookingPrice } from "~/lib/property.utils";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    currency: string;
    maxOccupancy: number;
    adults: number;
    children: number;
    bedType: string;
    numberOfBeds: number;
    bedConfiguration: string;
    roomSize?: number;
    roomSizeUnit: string;
    floor?: string;
    view?: string;
    images: string[];
    mainImage?: string;
    amenities: string[];
    features: string[];
    totalUnits: number;
    weekendPrice?: number;
    discountPercent?: number;
    specialOffer?: string;
    smokingAllowed: boolean;
    petsAllowed: boolean;
  };
  checkIn: Date;
  checkOut: Date;
  numberOfNights: number;
  numberOfRooms: number;
  propertyCleaningFee: number;
  propertyServiceFee: number;
  propertyTaxRate: number;
  onSelect: (roomId: string) => void;
  isSelected?: boolean;
}

export default function RoomCard({
  room,
  checkIn,
  checkOut,
  numberOfNights,
  numberOfRooms,
  propertyCleaningFee,
  propertyServiceFee,
  propertyTaxRate,
  onSelect,
  isSelected = false
}: RoomCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availableUnits, setAvailableUnits] = useState<number | null>(null);

  // Calculate price
  const roomRate = room.basePrice;
  const pricing = calculateBookingPrice(
    roomRate,
    numberOfNights,
    numberOfRooms,
    propertyCleaningFee,
    propertyServiceFee,
    propertyTaxRate
  );

  // Check availability on mount and when dates change
  useEffect(() => {
    const checkAvail = async () => {
      setIsCheckingAvailability(true);
      try {
        const response = await fetch(
          `/api/rooms/${room.id}/availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&numberOfRooms=${numberOfRooms}`
        );
        if (response.ok) {
          const data = await response.json();
          setIsAvailable(data.available);
          setAvailableUnits(data.availableUnits || null);
        } else {
          // If endpoint doesn't exist yet, assume available
          setIsAvailable(true);
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        // Default to available if check fails
        setIsAvailable(true);
      } finally {
        setIsCheckingAvailability(false);
      }
    };
    if (checkIn && checkOut) {
      checkAvail();
    } else {
      setIsAvailable(null);
    }
  }, [room.id, checkIn, checkOut, numberOfRooms]);

  const mainImage = room.mainImage || room.images[0] || "/landingPageImg.jpg";
  const displayPrice = room.weekendPrice && 
    (checkIn.getDay() === 5 || checkIn.getDay() === 6 || checkOut.getDay() === 5 || checkOut.getDay() === 6)
    ? room.weekendPrice 
    : room.basePrice;

  return (
    <div className={`bg-white rounded-xl border-2 ${isSelected ? 'border-[#01502E] shadow-lg' : 'border-gray-200'} overflow-hidden transition-all duration-300 hover:shadow-md`}>
      <div className="grid md:grid-cols-[300px_1fr] gap-6 p-6">
        {/* Room Image */}
        <div className="relative h-64 md:h-full rounded-lg overflow-hidden bg-gray-200">
          <img
            src={mainImage}
            alt={room.name}
            className="w-full h-full object-cover"
          />
          {room.specialOffer && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {room.specialOffer}
            </div>
          )}
          {room.discountPercent && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {room.discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="flex flex-col">
          {/* Room Name and Basic Info */}
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{room.name}</h3>
            
            {/* Room Specs */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{room.bedConfiguration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Sleeps {room.maxOccupancy}</span>
              </div>
              {room.roomSize && (
                <div className="flex items-center gap-1">
                  <Maximize2 className="w-4 h-4" />
                  <span>{room.roomSize} {room.roomSizeUnit}</span>
                </div>
              )}
              {room.floor && (
                <span>🏢 {room.floor}</span>
              )}
              {room.view && (
                <span>🌅 {room.view}</span>
              )}
            </div>

            {/* Description */}
            <p className={`text-gray-700 ${showFullDescription ? '' : 'line-clamp-2'}`}>
              {room.description}
            </p>
            {room.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-[#01502E] text-sm font-medium mt-1 hover:underline"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Room Features */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Room Features:</h4>
            <div className="flex flex-wrap gap-2">
              {room.features.slice(0, 6).map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  <Check className="w-3 h-3 text-green-600" />
                  {feature}
                </span>
              ))}
              {room.features.length > 6 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{room.features.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Policies */}
          <div className="flex gap-4 text-xs text-gray-600 mb-4">
            {room.smokingAllowed && (
              <span className="flex items-center gap-1">
                <X className="w-3 h-3 text-red-500" />
                Smoking allowed
              </span>
            )}
            {room.petsAllowed && (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" />
                Pets allowed
              </span>
            )}
          </div>

          {/* Pricing and Booking Section */}
          <div className="mt-auto border-t border-gray-200 pt-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">
                {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}: {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {room.currency} {displayPrice.toLocaleString()}/night × {numberOfNights} night{numberOfNights !== 1 ? 's' : ''} × {numberOfRooms} room{numberOfRooms !== 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">{room.currency} {pricing.basePrice.toLocaleString()}</span>
                </div>
                {propertyCleaningFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Cleaning fee</span>
                    <span>{room.currency} {propertyCleaningFee.toLocaleString()}</span>
                  </div>
                )}
                {propertyServiceFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Service fee</span>
                    <span>{room.currency} {propertyServiceFee.toLocaleString()}</span>
                  </div>
                )}
                {pricing.taxes > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxes & fees</span>
                    <span>{room.currency} {pricing.taxes.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-[#01502E]">
                      {room.currency} {pricing.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              {isCheckingAvailability ? (
                <div className="text-sm text-gray-500 mb-3">Checking availability...</div>
              ) : isAvailable === false ? (
                <div className="text-sm text-red-600 mb-3 font-medium">
                  ⚠️ Not available for selected dates
                </div>
              ) : availableUnits !== null && availableUnits < 5 ? (
                <div className="text-sm text-orange-600 mb-3 font-medium">
                  ⚠️ Only {availableUnits} room{availableUnits !== 1 ? 's' : ''} left at this price!
                </div>
              ) : null}

              {/* Policies */}
              <div className="space-y-1 text-xs text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Free cancellation until {new Date(checkIn.getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>No prepayment needed</span>
                </div>
              </div>

              {/* Select Button */}
              <button
                onClick={() => onSelect(room.id)}
                disabled={isAvailable === false}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isSelected
                    ? 'bg-[#013d23] text-white'
                    : isAvailable === false
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#01502E] text-white hover:bg-[#013d23]'
                }`}
              >
                {isSelected ? 'Selected' : isAvailable === false ? 'Not Available' : 'Select This Room'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

