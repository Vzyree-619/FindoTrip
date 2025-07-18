import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const commentsData = [
  { name: "Nicola", country: "USA", text: "Amazing place! Highly recommend." },
  { name: "Patricia", country: "UK", text: "Loved the decor, bar, and food." },
  { name: "Steve", country: "Canada", text: "The ambiance was incredible!" },
  { name: "Lisa", country: "Germany", text: "Service was top-notch!" },
  { name: "Raj", country: "India", text: "Food was delicious and authentic!" },
];

const CommentSlider = () => {
  const [index, setIndex] = useState(0);
  const sliderRef = useRef(null);

  const nextSlide = () => {
    gsap.to(sliderRef.current, {
      x: "-100%",
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        setIndex((prev) => (prev + 1) % commentsData.length);
        gsap.set(sliderRef.current, { x: "100%", opacity: 0 });
        gsap.to(sliderRef.current, { x: "0%", opacity: 1, duration: 0.6 });
      },
    });
  };

  const prevSlide = () => {
    gsap.to(sliderRef.current, {
      x: "100%",
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        setIndex((prev) => (prev - 1 + commentsData.length) % commentsData.length);
        gsap.set(sliderRef.current, { x: "-100%", opacity: 0 });
        gsap.to(sliderRef.current, { x: "0%", opacity: 1, duration: 0.6 });
      },
    });
  };

  return (
    <div className="relative flex items-center justify-center w-full h-[300px] overflow-hidden bg-gray-100 rounded-lg mt-10">
      <button
        onClick={prevSlide}
        className="absolute left-2 z-10 p-2 text-white bg-gray-600 rounded-full hover:bg-gray-800 transition-all"
      >
        ❮
      </button>

      <div ref={sliderRef} className="w-4/5 text-center p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold">{commentsData[index].name}</h3>
        <p className="text-sm text-gray-500">{commentsData[index].country}</p>
        <p className="mt-2 text-gray-700">{commentsData[index].text}</p>
      </div>

      <button
        onClick={nextSlide}
        className="absolute right-2 z-10 p-2 text-white bg-gray-600 rounded-full hover:bg-gray-800 transition-all"
      >
        ❯
      </button>
    </div>
  );
};

export default CommentSlider;
