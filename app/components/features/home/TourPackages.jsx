import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ChevronRight, Star, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "@remix-run/react";

const tourData = [
  {
    id: 1,
    title: "Skardu Valley Adventure",
    img: "/skdu.jpg",
    heading: "Skardu Valley",
    price: "PKR 25,000",
    duration: "5 Days",
    rating: 4.9,
    reviews: 128,
    groupSize: "Max 12",
    location: "Skardu, Pakistan",
    description: "Experience the stunning landscapes of Skardu Valley with guided tours to lakes, deserts, and mountain peaks.",
    features: ["Professional Guide", "Transport", "Meals", "Accommodation"]
  },
  {
    id: 2,
    title: "Deosai Plains Safari",
    img: "/deosai.jpg", 
    heading: "Deosai National Park",
    price: "PKR 18,000",
    duration: "3 Days",
    rating: 4.8,
    reviews: 95,
    groupSize: "Max 8",
    location: "Deosai, Pakistan",
    description: "Discover the Land of Giants with our exclusive jeep safari through Deosai Plains.",
    features: ["Jeep Safari", "Wildlife Spotting", "Photography", "Camping"]
  },
  {
    id: 3,
    title: "Khaplu Palace Heritage",
    img: "/khaplu.jpg",
    heading: "Khaplu Palace",
    price: "PKR 15,000",
    duration: "2 Days",
    rating: 4.7,
    reviews: 67,
    groupSize: "Max 10",
    location: "Khaplu, Pakistan",
    description: "Explore the rich cultural heritage and stunning architecture of Khaplu Palace.",
    features: ["Cultural Tour", "Heritage Sites", "Local Cuisine", "Photography"]
  },
  {
    id: 4,
    title: "Shigar Fort Experience",
    img: "/shiger.jpg",
    heading: "Shigar Fort",
    price: "PKR 12,000",
    duration: "2 Days",
    rating: 4.6,
    reviews: 43,
    groupSize: "Max 8",
    location: "Shigar, Pakistan",
    description: "Step back in time with a visit to the historic Shigar Fort and surrounding areas.",
    features: ["Historical Tour", "Fort Visit", "Local Culture", "Scenic Views"]
  },
  {
    id: 5,
    title: "Basho Valley Trek",
    img: "/basho.jpg",
    heading: "Basho Valley",
    price: "PKR 20,000",
    duration: "4 Days",
    rating: 4.8,
    reviews: 89,
    groupSize: "Max 6",
    location: "Basho, Pakistan",
    description: "Trek through the pristine Basho Valley with its crystal-clear streams and lush meadows.",
    features: ["Trekking", "Nature Photography", "Camping", "Local Guide"]
  },
  {
    id: 6,
    title: "Hunza Valley Discovery",
    img: "/himmel.jpg",
    heading: "Hunza Valley",
    price: "PKR 22,000",
    duration: "4 Days",
    rating: 4.9,
    reviews: 156,
    groupSize: "Max 10",
    location: "Hunza, Pakistan",
    description: "Discover the beauty and culture of Hunza Valley with its friendly locals and stunning vistas.",
    features: ["Cultural Exchange", "Mountain Views", "Local Cuisine", "Photography"]
  }
];
  

export default function TourPackages() {
  const [currentTours, setCurrentTours] = useState([0, 1]); // Show first two tours
  const cardRefs = useRef([]);

  const handleExploreMore = () => {
    // Navigate to tours page
    window.location.href = '/tours';
  };

  const handleTourClick = (tourId) => {
    // Navigate to specific tour or tours page
    window.location.href = `/tours?tour=${tourId}`;
  };

  // Get the two tours to display
  const displayedTours = currentTours.map(index => tourData[index]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-[#01502E]/10 text-[#01502E] px-4 py-2 rounded-full text-sm font-medium mb-4">
          <span>🧭</span>
          <span>Tours</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Experience World Wonders
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Best & Affordable Tour Packages
        </p>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {displayedTours.map((tour, index) => (
          <div
            key={tour.id}
            ref={(el) => (cardRefs.current[index] = el)}
            className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            onClick={() => handleTourClick(tour.id)}
          >
            {/* Image Section */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={tour.img}
                alt={tour.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{tour.rating}</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
                <div className="flex items-center gap-1 text-white text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{tour.location}</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#01502E] transition-colors">
                  {tour.title}
                </h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#01502E]">{tour.price}</div>
                  <div className="text-sm text-gray-500">per person</div>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{tour.description}</p>

              {/* Tour Details */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{tour.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{tour.groupSize}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{tour.reviews} reviews</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {tour.features.slice(0, 3).map((feature, idx) => (
                  <span
                    key={idx}
                    className="bg-[#01502E]/10 text-[#01502E] px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {feature}
                  </span>
                ))}
                {tour.features.length > 3 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    +{tour.features.length - 3} more
                  </span>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-2 text-[#01502E] font-semibold hover:text-[#013d23] transition-colors">
                  <span>Explore Tour</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="text-sm text-gray-500">
                  Starting from {tour.price}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Explore More Section */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Ready for Your Next Adventure?</h3>
          <p className="text-lg mb-6 opacity-90">
            Discover more amazing tours and create unforgettable memories
          </p>
          <button
            onClick={handleExploreMore}
            className="bg-white text-[#01502E] px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            <span>Explore All Tours</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
