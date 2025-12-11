import { useState, useEffect } from "react";
import { Bed, Users, Maximize2, Check, X } from "lucide-react";
import { differenceInDays } from "date-fns";
import { AvailabilityMessage } from "~/components/booking/AvailabilityMessage";
import { AlternativeDates } from "~/components/booking/AlternativeDates";
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
    // New fields from availability system
    availabilityCalendar?: any[];
    dateRangeInfo?: {
      isAvailable: boolean;
      pricing?: {
        nights: any[];
        subtotal: number;
        cleaningFee: number;
        serviceFee: number;
        taxAmount: number;
        total: number;
        averagePricePerNight: number;
      };
      conflicts?: any[];
      reason?: string;
      suggestions?: any[];
      numberOfNights?: number;
    };
  };
  checkIn: Date | null;
  checkOut: Date | null;
  numberOfNights: number;
  numberOfRooms: number;
  propertyCleaningFee: number;
  propertyServiceFee: number;
  propertyTaxRate: number;
  onSelect: (roomId: string) => void;
  isSelected?: boolean;
  onBook?: (roomId: string) => void;
  onViewDetails?: (roomId: string) => void;
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
  isSelected = false,
  onBook,
  onViewDetails
}: RoomCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Use the availability data from the loader instead of API calls
  const dateRangeInfo = room.dateRangeInfo;
  const isAvailable = dateRangeInfo?.isAvailable ?? null;
  const pricingInfo = dateRangeInfo?.pricing;
  const pricing = pricingInfo ? {
    basePrice: pricingInfo.subtotal,
    cleaningFee: pricingInfo.cleaningFee,
    serviceFee: pricingInfo.serviceFee,
    taxes: pricingInfo.taxAmount,
    total: pricingInfo.total
  } : calculateBookingPrice(
    room.basePrice,
    numberOfNights,
    numberOfRooms,
    propertyCleaningFee,
    propertyServiceFee,
    propertyTaxRate
  );

  const mainImage = room.mainImage || room.images[0] || "/landingPageImg.jpg";
  const hasValidDates = checkIn && checkOut && checkIn instanceof Date && checkOut instanceof Date && checkIn < checkOut;
  const hasDateRangeInfo = Boolean(dateRangeInfo);
  const canShowPricing = Boolean(pricingInfo);
  const canShowUnavailable = (hasValidDates || hasDateRangeInfo) && dateRangeInfo?.isAvailable === false;
  const canShowPricingDisplay = hasValidDates || canShowPricing;
  const breakdownNights = pricingInfo?.nights || [];
  const limitedNights = showBreakdown ? breakdownNights : breakdownNights.slice(0, 3);
  const hasMoreNights = breakdownNights.length > 3;

  return (
    <div className={`bg-white rounded-xl border-2 ${isSelected ? 'border-[#01502E] shadow-lg' : 'border-gray-200'} overflow-hidden transition-all duration-300 hover:shadow-md min-h-[440px]`}>
      <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-6 p-6">
        {/* Room Image */}
        <div className="relative h-64 md:h-72 rounded-lg overflow-hidden bg-gray-200">
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
        <div className="flex flex-col gap-4">
          {/* Room Name and Basic Info */}
          <div>
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

          {/* Compact price & action inside the card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
            <div className="text-xs text-gray-600">Starting from</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#01502E]">
                {room.currency} {room.basePrice.toLocaleString()}
              </span>
              <span className="text-gray-600 text-sm">/ night</span>
            </div>

            {hasValidDates || hasDateRangeInfo ? (
              pricingInfo ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Total for stay</span>
                  <span className="font-semibold text-[#01502E]">
                    {room.currency} {pricingInfo.total.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Calculating total… (select dates)
                </div>
              )
            ) : (
              <div className="text-sm text-gray-600">Select dates to check price</div>
            )}

            {hasDateRangeInfo && (
              <div className="text-xs font-semibold">
                {dateRangeInfo?.isAvailable
                  ? <span className="text-green-700">Available for selected dates</span>
                  : <span className="text-red-600">Not available for selected dates</span>}
              </div>
            )}

            {pricingInfo && (
              <div className="border-t border-gray-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
                >
                  <span>Price details</span>
                  <span className="text-xs text-gray-500">{showBreakdown ? 'Hide' : 'Show'}</span>
                </button>
                {showBreakdown && (
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    {limitedNights.map((night, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>{room.currency} {night.finalPrice.toLocaleString()}</span>
                      </div>
                    ))}
                    {hasMoreNights && !showBreakdown && (
                      <div className="text-xs text-gray-500">+{breakdownNights.length - limitedNights.length} more nights</div>
                    )}
                    <div className="border-t border-gray-200 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{room.currency} {pricingInfo.subtotal.toLocaleString()}</span>
                      </div>
                      {pricingInfo.cleaningFee > 0 && (
                        <div className="flex justify-between">
                          <span>Cleaning fee</span>
                          <span>{room.currency} {pricingInfo.cleaningFee.toLocaleString()}</span>
                        </div>
                      )}
                      {pricingInfo.serviceFee > 0 && (
                        <div className="flex justify-between">
                          <span>Service fee</span>
                          <span>{room.currency} {pricingInfo.serviceFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Taxes</span>
                        <span>{room.currency} {pricingInfo.taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[#01502E] pt-1">
                        <span>Total</span>
                        <span>{room.currency} {pricingInfo.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {onBook && (
                <button
                  onClick={() => onBook(room.id)}
                  disabled={!hasValidDates || dateRangeInfo?.isAvailable === false}
                  className="w-full max-w-xs mx-auto py-3 bg-[#01502E] text-white rounded-lg font-semibold hover:bg-[#013d23] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {dateRangeInfo?.isAvailable === false ? 'Not Available' : 'Book now'}
                </button>
              )}
              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('RoomCard: View details clicked, roomId:', room.id);
                    console.log('RoomCard: onViewDetails function:', onViewDetails);
                    onViewDetails(room.id);
                  }}
                  className="w-full max-w-xs mx-auto py-2 text-sm border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition"
                >
                  View details & photos
                </button>
              )}
              <p className="text-center text-xs text-gray-600">You won't be charged yet</p>
            </div>
          </div>

          {/* Room Features */}
          <div>
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
          <div className="flex gap-4 text-xs text-gray-600">
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
        </div>

      </div>
    </div>
  );
}

