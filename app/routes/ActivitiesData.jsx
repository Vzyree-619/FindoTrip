import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { getActivitiesData } from '../data/input.server';

export default function ActivitiesData() {
  const data = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Activities Booking Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((activity, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300"
            >
              <h2 className="text-xl font-semibold mb-2">
                Tour to: {activity.activity || 'Unknown'}
              </h2>
              <p className="mb-1">
                Pick-up Date: {activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No Activities data available.</p>
        )}
      </div>
    </div>
  );
}

// Remix loader function
export async function loader() {
  const data = await getActivitiesData();
  return data || [];
}
