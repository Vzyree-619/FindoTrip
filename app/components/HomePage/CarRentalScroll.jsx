import { useRef, useEffect } from 'react';
import { FaCarSide, FaUserFriends } from 'react-icons/fa';
import { gsap } from 'gsap';
// import Image from 'next/image';

const cars = [
  {
    name: 'Toyota Prado',
    seats: 7,
    img: '/prado.png',
  },
  {
    name: 'Toyota GLI',
    seats: 4,
    img: '/car.jpg',
  },
  {
    name: 'Toyota Hiace',
    seats: 12,
    img: '/van.jpg',
  },

  {
    name: 'Toyota Prado',
    seats: 7,
    img: '/prado.png',
  },
  {
    name: 'Toyota GLI',
    seats: 4,
    img: '/car.jpg',
  },
  {
    name: 'Toyota Hiace',
    seats: 12,
    img: '/van.jpg',
  },
  {
    name: 'Toyota Prado',
    seats: 7,
    img: '/prado.png',
  },
  {
    name: 'Toyota GLI',
    seats: 4,
    img: '/car.jpg',
  },
  {
    name: 'Toyota Hiace',
    seats: 12,
    img: '/van.jpg',
  },
  {
    name: 'Toyota Prado',
    seats: 7,
    img: '/prado.png',
  },
  {
    name: 'Toyota GLI',
    seats: 4,
    img: '/car.jpg',
  },
  {
    name: 'Toyota Hiace',
    seats: 12,
    img: '/van.jpg',
  },
  {
    name: 'Toyota Prado',
    seats: 7,
    img: '/prado.png',
  },
  {
    name: 'Toyota GLI',
    seats: 4,
    img: '/car.jpg',
  },
  {
    name: 'Toyota Hiace',
    seats: 12,
    img: '/van.jpg',
  },
  // Add more cars as needed
];

export default function CarRentalScroll() {
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      container.classList.add('cursor-grabbing');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      container.classList.remove('cursor-grabbing');
    };

    const handleMouseUp = () => {
      isDown = false;
      container.classList.remove('cursor-grabbing');
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      gsap.to(container, {
        scrollLeft: scrollLeft - walk,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className="py-10 px-6 md:px-16">
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-black border border-black px-3 py-1 w-fit rounded-full">
        <FaCarSide className="text-lg" />
        <span>Car Rentals</span>
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-black mb-6 underline underline-offset-4">
        Book your perfect ride for a seamless journey!
      </h2>

      <div
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto cursor-grab scroll-smooth pb-4"
      >
        {cars.map((car, index) => (
          <div
            key={index}
            className="min-w-[220px] bg-white rounded-lg shadow-md p-4 flex-shrink-0"
          >
            <div className="w-full h-40 relative mb-4 select-none">
              <img
                src={car.img}
                alt={car.name}
                layout="fill"
                objectFit="contain"
                className="rounded  h-[30vh] select-none"
              />
            </div>
          
            <div className="flex flex-col  items-baseline justify-around text-sm text-gray-700 select-none">
            <h3 className="text-md font-semibold text-black mb-2  z-10">{car.name}</h3>
              <FaUserFriends className="mr-2" />
              {car.seats} Seats
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
