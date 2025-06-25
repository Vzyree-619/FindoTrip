import React from "react";

const guestRooms = [
  {
    id: 1,
    title: "Avani Express",
    location: "Skardu",
    price: "20,000",
    image: "/awariExpress.jpg",
  },
  {
    id: 2,
    title: "Legend Hotel",
    location: "Skardu",
    price: "18,000",
    image: "/legend.jpg",
  },
  {
    id: 3,
    title: "Sukoon Resort",
    location: "Skardu",
    price: "22,000",
    image: "/sukoonREsord.jpg",
  },
  {
    id: 4,
    title: "Shigar Fort",
    location: "Skardu",
    price: "30,000",
    image: "/shigerFort.jpg",
  },
];

export default function GuestRooms() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Guest Rooms</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {guestRooms.map((room) => (
          <div key={room.id} className="bg-white shadow rounded-lg overflow-hidden">
            <img src={room.image} alt={room.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{room.title}</h2>
              <p className="text-gray-500">{room.location}</p>
              <p className="text-sm text-blue-600">Starting from PKR {room.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
