import NavBar from "../../components/navigation/NavBar";
import HomePage from "../../components/RoomPages/HomePage";
import PopularAttractions from "../../components/RoomPages/PopularAttractions";
import GuestRooms from "../../components/RoomPages/GuestRooms";
import Apartments from "../../components/RoomPages/Apartments";
import FAQ from "../../components/RoomPages/Faq";
import SubscriptionForm from "../../components/HomePage/SubscriptionForm";
import Footer from "../../components/Footer";
import { useNavigate } from "@remix-run/react";

const rooms = [
  {
    id: 1,
    title: "Avani Express",
    location: "Skardu",
    price: "20,000",
    image: "/awariExpress.jpg",
    amenities: ["WiFi", "Air Conditioning", "Mini Bar", "Room Service", "TV"],
    roomTypes: [
      {
        name: "Standard Room",
        price: "PKR 20,000",
        description: "Comfortable room with essential amenities.",
      },
      {
        name: "Deluxe Room",
        price: "PKR 25,000",
        description: "Spacious room with additional luxury features.",
      },
    ],
  },
  {
    id: 2,
    title: "Legend Hotel",
    location: "Skardu",
    price: "18,000",
    image: "/legend.jpg",
    amenities: [
      "WiFi",
      "Air Conditioning",
      "Mini Bar",
      "Room Service",
      "TV",
      "Gym",
    ],
    roomTypes: [
      {
        name: "Standard Room",
        price: "PKR 18,000",
        description: "Cozy room with modern amenities.",
      },
      {
        name: "Suite",
        price: "PKR 30,000",
        description: "Luxury suite with a separate living area.",
      },
    ],
  },
  {
    id: 3,
    title: "Sukoon Resort",
    location: "Skardu",
    price: "22,000",
    image: "/sukoonREsord.jpg",
    amenities: [
      "WiFi",
      "Air Conditioning",
      "Mini Bar",
      "Room Service",
      "TV",
      "Pool",
    ],
    roomTypes: [
      {
        name: "Standard Room",
        price: "PKR 22,000",
        description: "Relaxing room with scenic views.",
      },
      {
        name: "Family Room",
        price: "PKR 35,000",
        description: "Large room suitable for families.",
      },
    ],
  },
  {
    id: 4,
    title: "Shigar Fort",
    location: "Skardu",
    price: "30,000",
    image: "/shigerFort.jpg",
    amenities: [
      "WiFi",
      "Air Conditioning",
      "Mini Bar",
      "Room Service",
      "TV",
      "Historic Experience",
    ],
    roomTypes: [
      {
        name: "Standard Room",
        price: "PKR 30,000",
        description: "Unique room with historic charm.",
      },
      {
        name: "Deluxe Room",
        price: "PKR 40,000",
        description: "Luxury room with historic features.",
      },
    ],
  },
];

export default function Rooms() {
  const navigate = useNavigate();

  const handleRoomClick = (room) => {
    navigate(`/Room/${room.id}`);
  };

  return (
    <>
      <NavBar />
      {/* <div>
           <img className='w-[100vw] rounded h-[75vh] object-cover object-[50%_35%]' src="homePage.png" alt="homeImg" />
      </div> */}
      <HomePage />
      <PopularAttractions />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Guest Rooms</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <img
                src={room.image}
                alt={room.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{room.title}</h2>
                <p className="text-gray-500">{room.location}</p>
                <p className="text-sm text-blue-600">
                  Starting from PKR {room.price}
                </p>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                  onClick={() => handleRoomClick(room)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Apartments />
      <FAQ />
      <SubscriptionForm />
      <Footer />
    </>
  );
}
