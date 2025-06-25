import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { Link } from "@remix-run/react";
import PropTypes from "prop-types";

const cars = [
  {
    id: 1,
    title: "Honda BRV",
    description: "Comfortable and reliable with spacious seating. Choose from our premium fleet for your next trip.",
    price: "PKR 15,000 - 18,000/day",
    image: "/brv.png",
  },
  {
    id: 2,
    title: "Toyota Land Cruiser",
    description: "Luxury and performance combined. Perfect for both city and adventure rides.",
    price: "PKR 25,000/day",
    image: "/landCruser.png",
  },
  {
    id: 3,
    title: "Hiace Van",
    description: "Spacious van ideal for group travels and long trips, ensuring maximum comfort.",
    price: "PKR 15,500/day",
    image: "/van.jpg",
  },
  {
    id: 4,
    title: "Honda BRV",
    description: "Another view of the Honda BRV, versatile and reliable for your travels.",
    price: "PKR 15,000/day",
    image: "/car.jpg",
  },
];

export default function CarsPage({ onBookCar, onViewDetails }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  useEffect(() => {
    gsap.utils.toArray(".car-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, { scale: 1.03, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)", duration: 0.3 });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { scale: 1, boxShadow: "0px 4px 6px rgba(0,0,0,0.1)", duration: 0.3 });
      });
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Available Cars</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {cars.map((car) => (
          <div
            key={car.id}
            className="car-card flex flex-col bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-transform duration-300 cursor-pointer h-full"
          >
            <div className="w-full h-56 sm:h-48 md:h-56 lg:h-64 overflow-hidden">
              <img
                src={car.image}
                alt={car.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col flex-1 justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{car.title}</h2>
                <p className="text-gray-600 text-sm mb-4">{car.description}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-auto">
                <p className="text-green-600 font-bold text-lg">{car.price}</p>
                <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition w-full sm:w-auto" onClick={() => onBookCar && onBookCar(car)}>
                    Book Now
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition w-full sm:w-auto" onClick={() => onViewDetails && onViewDetails(car)}>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setModalOpen(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Book {selectedCar.title}</h2>
            <img src={selectedCar.image} alt={selectedCar.title} className="w-full h-40 object-cover rounded mb-4" />
            <p className="mb-2">{selectedCar.description}</p>
            <p className="mb-2 font-semibold">Price: {selectedCar.price}</p>
            <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mt-4" onClick={() => setModalOpen(false)}>
              Confirm Booking (Dummy)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

CarsPage.propTypes = {
  onBookCar: PropTypes.func,
  onViewDetails: PropTypes.func,
};
