// import React from 'react';
// import { useLoaderData } from '@remix-run/react';
// import { getCarData } from '../data/input.server';

// export default function CarData() {
//   // Fetch data using Remix loader
//   const data = useLoaderData();

//   return (
//     <div className="min-h-screen bg-gray-100 p-4">
//       <h1 className="text-3xl font-bold text-center mb-6">Car Booking Data</h1>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {data && data.length > 0 ? (
//           data.map((cars, index) => (
//             <div
//               key={index}
//               className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300"
//             >
//               <h2 className="text-xl font-semibold mb-2">Destination: {cars.pickupLocation}</h2>
//               <p className="mb-1">Check-In: {cars.pickupDate}</p>
//               <p className="mb-1">Check-Out: {cars.dropoffDate}</p>
            
             
//             </div>
//           ))
//         ) : (
//           <p className="text-center text-gray-500">No car data available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// // Remix loader function
// export async function loader() {
//   return getCarData();
// }
import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { getCarData } from '../data/input.server';

export default function CarData() {
  const data = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Car Booking Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((car, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300"
            >
              <h2 className="text-xl font-semibold mb-2">
                 Location: {car.pickupLocation || 'Unknown'}
              </h2>
              <p className="mb-1">
              PickUp Date: {car.pickupDate ? new Date(car.pickupDate).toLocaleDateString() : 'N/A'}
              </p>
              <p className="mb-1">
              DropOf Date: {car.dropoffDate ? new Date(car.dropoffDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No car data available.</p>
        )}
      </div>
    </div>
  );
}

// Remix loader function
export async function loader() {
  const data = await getCarData();
  return data || [];
}
