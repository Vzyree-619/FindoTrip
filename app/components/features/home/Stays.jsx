import { Link } from "@remix-run/react";

const trendingStaysStatic = [
  {
    name: "Al Noor Starlet Hotel",
    location: "Skardu, Pakistan",
    price: "Starting from 12,000 PKR",
    rating: 9.5,
    reviews: "50 reviews",
    image: "/alnoor.png",
  },
  {
    name: "Sehrish Guest House",
    location: "Skardu, Pakistan",
    price: "Starting from 10,000 PKR",
    rating: 8.3,
    reviews: "65 reviews",
    image: "/razaqi.jpg",
  },
  {
    name: "Legend Hotel",
    location: "Skardu, Pakistan",
    price: "Starting from 10,000 PKR",
    rating: 9.5,
    reviews: "50 reviews",
    image: "/legend.jpg",
  },
  {
    name: "Himmel",
    location: "Shigar, Pakistan",
    price: "Starting from 35,000 PKR",
    rating: 7.5,
    reviews: "14 reviews",
    image: "himmel.jpg",
  },
];

export default function Stays({ stays = [] }) {
  // Use database data if available, limit to 4 items, otherwise show empty state
  const displayStays = stays.length > 0 ? stays.slice(0, 4) : [];
  
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Trending stays to book!</h2>
        <Link to="/hotelList" className="text-green-700 font-medium hover:underline">
          View More
        </Link>
      </div>

      {displayStays.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No properties available at the moment.</p>
          <Link to="/hotelList" className="text-green-600 hover:underline mt-2 inline-block">
            Browse all properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayStays.map((stay, idx) => (
            <Link
              key={stay.id || idx}
              to={`/accommodations/${stay.id}`}
              className="bg-white shadow-md rounded-lg overflow-hidden transition transform hover:scale-105 hover:shadow-lg block"
            >
              <img 
                src={stay.image || "/placeholder-hotel.jpg"} 
                alt={stay.name} 
                className="w-full h-48 object-cover" 
              />
              <div className="p-4">
                <h3 className="text-green-800 font-semibold text-sm">{stay.name}</h3>
                <p className="text-gray-600 text-sm">{stay.location}</p>
                <p className="text-sm mt-1">{stay.price}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span
                    className={`text-white text-xs font-bold px-2 py-1 rounded ${
                      stay.rating >= 9
                        ? "bg-green-600"
                        : stay.rating >= 8
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                  >
                    {stay.rating}
                  </span>
                  <span className="text-sm text-gray-600">{stay.reviews}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
