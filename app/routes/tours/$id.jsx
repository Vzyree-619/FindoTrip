import { useParams } from "@remix-run/react";
import NavBar from "../../components/navigation/NavBar";
import { useState } from "react";

const tours = [
  {
    id: 1,
    title: "Skardu Valley Adventure",
    description: "Experience the stunning landscapes of Skardu Valley with guided tours to lakes, deserts, and mountain peaks.",
    reviews: "1,230 reviews",
    score: "9.2",
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

export default function TourDetail() {
  const { id } = useParams();
  const tour = tours.find(t => t.id === parseInt(id));
  const [showPayment, setShowPayment] = useState(false);

  if (!tour) {
    return <div>Tour not found</div>;
  }

  return (
    <>
      <NavBar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">{tour.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <img src={tour.image} alt={tour.title} className="w-full h-40 object-cover rounded mb-4" />
            <div className="flex gap-2 overflow-x-auto">
              {tour.gallery.map((img, i) => (
                <img key={i} src={img} alt={`Gallery ${i+1}`} className="w-20 h-20 object-cover rounded" />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2">{tour.description}</p>
            <p className="mb-2 font-semibold">Reviews: {tour.reviews}</p>
            <p className="mb-2">Group Size: {tour.groupSize}</p>
            <p className="mb-2">Duration: {tour.duration}</p>
            <p className="mb-2">Language: {tour.language}</p>
            <p className="mb-2">Price: {tour.price} <span className="text-red-500 line-through">{tour.discount}</span></p>
            <p className="mb-2">Location: {tour.location}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {tour.badges.map((badge, i) => (
                <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{badge}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Amenities</h3>
          <ul className="list-disc pl-5">
            {tour.amenities.map((amenity, i) => (
              <li key={i}>{amenity}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Itinerary</h3>
          <ul className="list-disc pl-5">
            {tour.itinerary.map((day, i) => (
              <li key={i}>{day}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Payment Options</h3>
          <div className="flex flex-col gap-2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => setShowPayment(true)}>Pay with Credit Card</button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Pay with Jazz Cash</button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Pay on Site</button>
          </div>
        </div>
        {showPayment && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Credit Card Payment</h3>
            <form className="space-y-4">
              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
                <input id="card-number" type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="1234 5678 9012 3456" />
              </div>
              <div>
                <label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-700">Cardholder Name</label>
                <input id="cardholder-name" type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input id="expiry-date" type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="MM/YY" />
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">CVV</label>
                  <input id="cvv" type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="123" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Pay Now</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
} 