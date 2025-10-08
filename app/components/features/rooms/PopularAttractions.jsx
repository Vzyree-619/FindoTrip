// PopularAttractions
import React from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const attractions = [
  {
    id: 1,
    title: "Bespal",
    location: "Skardu",
    type: "Nature scenery",
    image: "/deosai.jpg",
  },
  {
    id: 2,
    title: "Katpana Lake",
    location: "Skardu",
    type: "Desert",
    image: "2.png",
  },
  {
    id: 3,
    title: "Sukoon Resort",
    location: "Skardu",
    type: "Hotel",
    image: "/sukoonREsord.jpg",
  },
  {
    id: 4,
    title: "Shigar Fort",
    location: "Skardu",
    type: "Historic Site",
    image: "shigerFort.jpg",
  },
];

export default function PopularAttractions() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Popular Attractions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {attractions.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="text-gray-500">{item.location}</p>
              <span className="text-sm text-green-500">{item.type}</span>
              <div className="mt-2">
                <Button variant="outline" onClick={() => (window.location.href = `/attractions/${item.id}`)}>View</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
