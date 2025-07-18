// app/components/OtherTours.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const tours = [
  {
    id: 1,
    title: "Satpara Lake Tour",
    location: "Skardu",
    price: "Starting from PKR 18,000",
    image: "https://i.pinimg.com/originals/aa/b5/c2/aab5c2768c55de153eecd00666007525.jpg",
  },
  {
    id: 2,
    title: "Deosai Plains Safari",
    location: "Deosai",
    price: "Starting from PKR 25,000",
    image: "https://th.bing.com/th/id/R.76f231cb75f30523fe6371a870fe6515?rik=uirLSd1j7w%2bfag&riu=http%3a%2f%2fi.dawn.com%2fprimary%2f2015%2f04%2f553e1f1bb0d7b.jpg%3fr%3d139109317&ehk=ITZbAwzLWQTe%2bXbMz6TCCAHkOa%2fDpwzsfl45BerhTt0%3d&risl=&pid=ImgRaw&r=0",
  },
  {
    id: 3,
    title: "Shigar Fort Visit",
    location: "Shigar",
    price: "Starting from PKR 15,500",
    image: "https://th.bing.com/th/id/OIP.s02hDZhG_B46GGY2moZ5LgHaE8?rs=1&pid=ImgDetMain",
  },
  {
    id: 4,
    title: "Kachura Lakes Tour",
    location: "Upper Kachura",
    price: "Starting from PKR 20,000",
    image: "https://th.bing.com/th/id/OIP.b_G6hSgMyIrBs01ucuRWGgHaFj?rs=1&pid=ImgDetMain",
  },
];

export default function OtherTours() {
  const cardsRef = useRef([]);

  useEffect(() => {
    cardsRef.current.forEach((card) => {
      if (card) {
        gsap.set(card, { scale: 1 });

        card.addEventListener("mouseenter", () => {
          gsap.to(card, { scale: 1.05, duration: 0.4, ease: "power2.out" });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, { scale: 1, duration: 0.4, ease: "power2.out" });
        });
      }
    });
  }, []);

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Other Tours</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tours.map((tour, index) => (
          <div
            key={tour.id}
            ref={(el) => (cardsRef.current[index] = el)}
            className="bg-white rounded-2xl overflow-hidden shadow-lg transform transition-transform duration-300"
          >
            <img
              src={tour.image}
              alt={tour.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{tour.title}</h2>
              <p className="text-gray-500 text-sm">{tour.location}</p>
              <p className="text-green-600 font-bold mt-2">{tour.price}</p>
              <div className="flex mt-2 gap-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-yellow-400">⭐</span>
                <span className="text-yellow-400">⭐</span>
                <span className="text-yellow-400">⭐</span>
                <span className="text-yellow-400">⭐</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
