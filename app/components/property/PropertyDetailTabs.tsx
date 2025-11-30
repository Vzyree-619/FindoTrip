import { useState } from "react";
import { MapPin, Star, Check, X } from "lucide-react";
import RoomCard from "./RoomCard";

interface PropertyDetailTabsProps {
  property: {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    amenities: string[];
    latitude?: number;
    longitude?: number;
    cleaningFee: number;
    serviceFee: number;
    taxRate: number;
    currency: string;
  };
  roomTypes: any[];
  reviews: any[];
  checkIn: Date | null;
  checkOut: Date | null;
  numberOfNights: number;
  numberOfRooms: number;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onDateChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onGuestsChange: (adults: number, children: number) => void;
}

export default function PropertyDetailTabs({
  property,
  roomTypes,
  reviews,
  checkIn,
  checkOut,
  numberOfNights,
  numberOfRooms,
  selectedRoomId,
  onRoomSelect,
  onDateChange,
  onGuestsChange
}: PropertyDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'location' | 'amenities' | 'reviews'>('rooms');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onDateChange(date, checkOut);
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onDateChange(checkIn, date);
  };

  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = checkIn ? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : today;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'rooms', label: 'Rooms' },
            { id: 'location', label: 'Location' },
            { id: 'amenities', label: 'Amenities' },
            { id: 'reviews', label: 'Reviews' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#01502E] text-[#01502E]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Property</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {property.amenities.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Most Popular Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {property.amenities.slice(0, 8).map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
                {property.amenities.length > 8 && (
                  <button className="mt-4 text-[#01502E] font-medium hover:underline">
                    View all {property.amenities.length} amenities
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ROOMS TAB - Most Important */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            {/* Date & Guest Selection (Sticky) */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sticky top-4 z-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn ? checkIn.toISOString().split('T')[0] : ''}
                    onChange={handleCheckInChange}
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut ? checkOut.toISOString().split('T')[0] : ''}
                    onChange={handleCheckOutChange}
                    min={minCheckOut}
                    disabled={!checkIn}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adults
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setAdults(val);
                      onGuestsChange(val, children);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Children
                  </label>
                  <select
                    value={children}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChildren(val);
                      onGuestsChange(adults, val);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    {[0, 1, 2, 3, 4].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  // Trigger room availability refresh
                  window.location.reload();
                }}
                className="mt-4 w-full bg-[#01502E] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#013d23] transition-colors"
              >
                Update Search
              </button>
            </div>

            {/* Available Rooms */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Available Rooms {roomTypes.length > 0 && `(showing ${roomTypes.length} room type${roomTypes.length !== 1 ? 's' : ''})`}
              </h2>

              {!checkIn || !checkOut ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800">Please select check-in and check-out dates to see available rooms and prices.</p>
                </div>
              ) : roomTypes.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No room types available for this property.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {roomTypes.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      checkIn={checkIn!}
                      checkOut={checkOut!}
                      numberOfNights={numberOfNights}
                      numberOfRooms={numberOfRooms}
                      propertyCleaningFee={property.cleaningFee}
                      propertyServiceFee={property.serviceFee}
                      propertyTaxRate={property.taxRate}
                      onSelect={onRoomSelect}
                      isSelected={selectedRoomId === room.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOCATION TAB */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900 font-medium">{property.address}</p>
                    <p className="text-gray-600">{property.city}, {property.country}</p>
                  </div>
                </div>

                {property.latitude && property.longitude && (
                  <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Interactive Map (Google Maps integration)</span>
                    {/* TODO: Integrate Google Maps or Mapbox */}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Nearby Attractions</h3>
                  <div className="space-y-2 text-gray-700">
                    <p>• Times Square - 0.5 km</p>
                    <p>• Central Park - 1.2 km</p>
                    <p>• Empire State Building - 2.0 km</p>
                    {/* TODO: Fetch from database or API */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AMENITIES TAB */}
        {activeTab === 'amenities' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Amenities</h2>
            {property.amenities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No amenities listed.</p>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {review.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{review.rating}</span>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

