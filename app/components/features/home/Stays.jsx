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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-[#01502E]/10 text-[#01502E] px-4 py-2 rounded-full text-sm font-medium mb-4">
          <span>🏨</span>
          <span>Stays</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Trending Stays to Book
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover amazing accommodations for your perfect getaway
        </p>
      </div>

      {displayStays.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-2xl p-8">
            <p className="text-gray-500 text-lg mb-4">No properties available at the moment.</p>
            <Link 
              to="/hotelList" 
              className="inline-flex items-center gap-2 bg-[#01502E] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#013d23] transition-colors"
            >
              Browse All Properties
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {displayStays.map((stay, idx) => (
              <Link
                key={stay.id || idx}
                to={`/accommodations/${stay.id}`}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={stay.image || "/landingPageImg.jpg"} 
                    alt={stay.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <span className="text-yellow-500">★</span>
                      <span>{stay.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#01502E] transition-colors mb-2">{stay.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{stay.location}</p>
                  <p className="text-lg font-semibold text-[#01502E] mb-3">{stay.price}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{stay.reviews}</span>
                    <div className="flex items-center gap-1 text-sm text-[#01502E] font-medium">
                      <span>View Details</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View More Section */}
          <div className="text-center">
            <Link 
              to="/hotelList" 
              className="inline-flex items-center gap-2 bg-[#01502E] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#013d23] transition-colors"
            >
              <span>View All Properties</span>
              <span>→</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
