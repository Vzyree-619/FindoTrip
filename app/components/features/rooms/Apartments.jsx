import React from "react";

const apartments = [
  {
    id: 1,
    title: "Hussain House",
    location: "Skardu",
    price: "20,000",
    image: "/three.jpg",
  },
  {
    id: 2,
    title: "Sharif House",
    location: "Skardu",
    price: "16,000",
    image: "/one.jpg",
  },
  {
    id: 3,
    title: "Jaffar House",
    location: "Skardu",
    price: "22,000",
    image: "/four.jpg",
  },
  {
    id: 4,
    title: "Tajbal House",
    location: "Skardu",
    price: "32,000",
    image: "/two.jpg",
  },
];

export default function Apartments() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Apartments</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {apartments.map((apt) => (
          <div key={apt.id} className="bg-white shadow rounded-lg overflow-hidden">
            <img src={apt.image} alt={apt.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{apt.title}</h2>
              <p className="text-gray-500">{apt.location}</p>
              <p className="text-sm text-blue-600">Starting from PKR {apt.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
