
import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { getTourData } from '../data/input.server';

export default function TourData() {
  const data = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Tour Booking Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((tour, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300"
            >
              <h2 className="text-xl font-semibold mb-2">
                Tour to: {tour.location || 'Unknown'}
              </h2>
              <p className="mb-1">
                pickUp Date: {tour.tourDate ? new Date(tour.tourDate).toLocaleDateString() : 'N/A'}
              </p>
             
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No tour data available.</p>
        )}
      </div>
    </div>
  );
}

// Remix loader function
export async function loader() {
  const data = await getTourData();
  return data || [];
}
