import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { getHotelData } from '../data/input.server';

export default function HotelData() {
  // Fetch data using Remix loader
  const data = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Hotel Booking Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data && data.length > 0 ? (
          data.map((hotel, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300"
            >
              <h2 className="text-xl font-semibold mb-2">Destination: {hotel.destination}</h2>
              <p className="mb-1">Check-In: {hotel.checkIn}</p>
              <p className="mb-1">Check-Out: {hotel.checkOut}</p>
              <p className="mb-1">Adults: {hotel.adults}</p>
              <p className="mb-1">Children: {hotel.childs}</p>
              <p className="mb-1">Rooms: {hotel.rooms}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No hotel data available.</p>
        )}
      </div>
    </div>
  );
}

// Remix loader function
export async function loader() {
  return getHotelData();
}
