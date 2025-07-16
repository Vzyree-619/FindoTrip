// app/components/TourSection.jsx
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import PropTypes from "prop-types";

const tours = [
  {
    id: 1,
    title: "Skardu Valley Adventure",
    description: "Experience the stunning landscapes of Skardu Valley with guided tours to lakes, deserts, and mountain peaks.",
    reviews: "1,230 reviews",
    score: "9.2",
    buttonText: "Explore Tour",
    image: "/skdu.jpg",
    gallery: ["/skdu.jpg", "/deosai.jpg", "/khaplu.jpg"],
    amenities: ["WiFi", "Meals Included", "Transport", "Professional Guide", "Accommodation"],
    itinerary: [
      "Day 1: Arrival and welcome dinner",
      "Day 2: Visit Satpara Lake and local markets",
      "Day 3: Hiking in the surrounding mountains",
      "Day 4: Cultural tour and farewell"
    ],
    groupSize: "Max 12 people",
    duration: "4 days",
    language: "English, Urdu",
    price: "PKR 45,000",
    discount: "10% off",
    badges: ["Free Cancellation", "Instant Confirmation", "Family Favorite"],
    location: "Skardu, Pakistan"
  },
  {
    id: 2,
    title: "Hiking Expedition in Baltoro",
    description: "Join our trekking expedition through Baltoro Glacier, one of the most breathtaking trails in the Karakoram range.",
    reviews: "987 reviews",
    score: "9.5",
    buttonText: "View Trek",
    image: "https://th.bing.com/th/id/OIP.vRGrvXRJcG7FWYev0ay2-gHaFj?rs=1&pid=ImgDetMain",
    gallery: ["https://th.bing.com/th/id/OIP.vRGrvXRJcG7FWYev0ay2-gHaFj?rs=1&pid=ImgDetMain", "/deosai.jpg", "/khaplu.jpg"],
    amenities: ["Camping Equipment", "Meals Included", "Transport", "Professional Guide", "First Aid Kit"],
    itinerary: [
      "Day 1: Arrival and briefing",
      "Day 2: Start trek to Baltoro Glacier",
      "Day 3: Explore the glacier and surrounding peaks",
      "Day 4: Return to base camp"
    ],
    groupSize: "Max 8 people",
    duration: "4 days",
    language: "English, Urdu",
    price: "PKR 60,000",
    discount: "15% off",
    badges: ["Free Cancellation", "Instant Confirmation", "Popular with Groups"],
    location: "Baltoro, Pakistan"
  },
  {
    id: 3,
    title: "Cultural Tour of Shigar Valley",
    description: "Discover ancient forts, beautiful mosques, and the unique culture of Shigar Valley with our guided cultural tours.",
    reviews: "742 reviews",
    score: "9.0",
    buttonText: "See Details",
    image: "https://th.bing.com/th/id/OIP.8mA5erSB4UTHqFoZRvv-GQHaEH?rs=1&pid=ImgDetMain",
    gallery: ["https://th.bing.com/th/id/OIP.8mA5erSB4UTHqFoZRvv-GQHaEH?rs=1&pid=ImgDetMain", "/shiger.jpg", "/shigerFort.jpg"],
    amenities: ["WiFi", "Meals Included", "Transport", "Professional Guide", "Accommodation"],
    itinerary: [
      "Day 1: Arrival and welcome dinner",
      "Day 2: Visit Shigar Fort and local markets",
      "Day 3: Cultural workshops and local cuisine",
      "Day 4: Farewell and departure"
    ],
    groupSize: "Max 15 people",
    duration: "4 days",
    language: "English, Urdu",
    price: "PKR 50,000",
    discount: "5% off",
    badges: ["Free Cancellation", "Instant Confirmation", "Cultural Experience"],
    location: "Shigar, Pakistan"
  }
];

export default function TourSection({ onBookTour }) {
  const cardsRef = useRef([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);

  useEffect(() => {
    cardsRef.current.forEach((card) => {
      if (card) {
        gsap.set(card, { scale: 1 });

        card.addEventListener("mouseenter", () => {
          gsap.to(card, { scale: 1.02, duration: 0.4, ease: "power2.out" });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, { scale: 1, duration: 0.4, ease: "power2.out" });
        });
      }
    });
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Baltistan Tour Packages</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {tours.map((tour, index) => (
          <div
            key={tour.id}
            ref={(el) => (cardsRef.current[index] = el)}
            className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden transform transition-transform duration-300 h-full"
          >
            <div className="w-full h-56 sm:h-48 md:h-56 lg:h-64 overflow-hidden">
              <img
                src={tour.image}
                alt={tour.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-between p-6 flex-1">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{tour.title}</h2>
                <p className="text-gray-600 mb-4">{tour.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tour.badges.map((badge, i) => (
                    <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{badge}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-sm">{tour.groupSize} • {tour.duration} • {tour.language}</p>
                <p className="text-green-600 font-bold mt-2">{tour.price} <span className="text-red-500 line-through">{tour.discount}</span></p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-gray-500 text-sm">{tour.reviews}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-yellow-400">⭐</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="text-green-600 font-bold text-lg">{tour.score}</div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition w-full sm:w-auto" onClick={() => { setSelectedTour(tour); setModalOpen(true); }}>
                    {tour.buttonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setModalOpen(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">{selectedTour.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <img src={selectedTour.image} alt={selectedTour.title} className="w-full h-40 object-cover rounded mb-4" />
                <div className="flex gap-2 overflow-x-auto">
                  {selectedTour.gallery.map((img, i) => (
                    <img key={i} src={img} alt={`Gallery ${i+1}`} className="w-20 h-20 object-cover rounded" />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2">{selectedTour.description}</p>
                <p className="mb-2 font-semibold">Reviews: {selectedTour.reviews}</p>
                <p className="mb-2">Group Size: {selectedTour.groupSize}</p>
                <p className="mb-2">Duration: {selectedTour.duration}</p>
                <p className="mb-2">Language: {selectedTour.language}</p>
                <p className="mb-2">Price: {selectedTour.price} <span className="text-red-500 line-through">{selectedTour.discount}</span></p>
                <p className="mb-2">Location: {selectedTour.location}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTour.badges.map((badge, i) => (
                    <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{badge}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Amenities</h3>
              <ul className="list-disc pl-5">
                {selectedTour.amenities.map((amenity, i) => (
                  <li key={i}>{amenity}</li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Itinerary</h3>
              <ul className="list-disc pl-5">
                {selectedTour.itinerary.map((day, i) => (
                  <li key={i}>{day}</li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Payment Options</h3>
              <div className="flex flex-col gap-2">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Pay with Credit Card</button>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Pay with Jazz Cash</button>
                <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Pay on Site</button>
              </div>
            </div>
            <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mt-4" onClick={() => setModalOpen(false)}>
              Confirm Tour Booking (Dummy)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

TourSection.propTypes = {
  onBookTour: PropTypes.func,
};
