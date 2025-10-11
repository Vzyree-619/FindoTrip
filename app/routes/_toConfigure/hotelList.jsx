
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import HotelDetails from "./HotelDetails";
import { getHotel } from "../../data/input.server";

export async function loader() {
  try {
    const hotelData = await getHotel();
    console.log("Hotel Data from Database:", hotelData); // Debugging

    if (!hotelData || hotelData.length === 0) {
      console.warn("No hotel data found.");
      return { hotels: [] };
    }

    return { hotels: hotelData };
  } catch (error) {
    console.error("Error fetching hotel data:", error);
    return { hotels: [] };
  }
}

export default function HotelList() {
  const { hotels } = useLoaderData();
  const [selectedHotel, setSelectedHotel] = useState(null);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {selectedHotel ? (
        // Show Hotel Details
        <HotelDetails
          hotel={selectedHotel}
          onBack={() => setSelectedHotel(null)}
        />
      ) : (
        // Show Hotel List
        hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="bg-white rounded-lg shadow-lg border p-4 flex flex-col md:flex-row items-start md:items-center md:justify-between"
          >
            {/* Left Section - Image and Details */}
            <div className="flex items-start space-x-4">
              {/* Image */}
              <div className="w-36 h-36 flex-shrink-0">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-[50%] object-cover rounded-lg"
                />
              </div>

              {/* Details */}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold">{hotel.name}</h3>
                  <span className="text-yellow-500 text-sm">
                    <FaStar className="inline" /> {hotel.rating}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{hotel.location}</p>
                <p className="text-sm text-gray-600">{hotel.reviews}</p>

                {/* Room Type */}
                <p className="text-sm mt-2">
                  <span className="font-semibold">Room Type:</span>{" "}
                  {hotel.roomType}
                </p>

                {/* Facilities */}
                <div className="flex space-x-2 mt-2">
                  {hotel.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="text-green-600 text-xs font-semibold bg-green-100 px-2 py-1 rounded"
                    >
                      {facility}
                    </span>
                  ))}
                </div>

                {/* Price and Button */}
                <div className="text-right flex flex-col items-start">
                  {/* Price */}
                  <div className="mt-3">
                    {hotel.originalPrice && (
                      <span className="text-gray-500 line-through mr-2 decoration-blue-500">
                        {hotel.originalPrice}
                      </span>
                    )}
                    <span className="text-lg font-bold text-blue-600">
                      {hotel.price}
                    </span>
                  </div>

                  {/* Availability Button */}
                  <button
                    onClick={() => setSelectedHotel(hotel)}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    See Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
