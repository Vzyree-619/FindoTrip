import { useParams } from "@remix-run/react";
import NavBar from "~/components/layout/navigation/NavBar";

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

export default function RoomDetail() {
  const { id } = useParams(); // Restore dynamic ID retrieval
  console.log("Room ID:", id); // Log the room ID
  const room = rooms.find((r) => r.id === parseInt(id));
  console.log("Found Room:", room); // Log the found room

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <>
      <NavBar />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{room.title} - Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <img
              src={room.image}
              alt={room.title}
              className="w-full h-40 object-cover rounded mb-4"
            />
          </div>
          <div>
            <p className="mb-2">Location: {room.location}</p>
            <p className="mb-2">Price: PKR {room.price}</p>
            <h3 className="font-semibold mt-2">Amenities:</h3>
            <ul className="list-disc pl-5">
              {room.amenities.map((amenity, i) => (
                <li key={i}>{amenity}</li>
              ))}
            </ul>
            <h3 className="font-semibold mt-2">Room Types:</h3>
            <ul className="list-disc pl-5">
              {room.roomTypes.map((type, i) => (
                <li key={i}>
                  {type.name} - {type.price} - {type.description}
                </li>
              ))}
            </ul>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2">
              Chat with Us
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
