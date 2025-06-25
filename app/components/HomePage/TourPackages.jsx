import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ChevronRight } from "lucide-react";

const tourData = [
    {
      title: "Best & Affordable Tour Packages",
      img: "/shiger.jpg",
      heading: "Shigar Valley",
    },
    {
      title: "Explore Hidden Gems",
      img: "https://static.vecteezy.com/system/resources/previews/001/254/857/large_2x/autumn-in-hunza-nagar-valley-free-photo.jpg",
      heading: "Hunza Valley",
    },
    {
      title: "A Journey to the Cold Desert",
      img: "https://flypakistan.pk/assets/img/attractions/Katpana%20Cold%20Desert.png",
      heading: "Katpana Desert",
    },
    {
      title: "Adventure at the Top of the World",
      img: "https://www.k2basecamptrekking.com/cdn/shop/products/2-concordia-trek-pakistan-1.jpg?v=1579699269",
      heading: "Concordia – K2 Base Camp",
    },
    {
      title: "Where Mountains Meet the Sky",
      img: "https://btvadventures.com/wp-content/uploads/2025/02/Skardu-valley-1.jpg",
      heading: "Skardu City",
    },
    {
      title: "Nature's Serenity and Peace",
      img: "https://media.licdn.com/dms/image/v2/D4D10AQFfp8JgwxapVA/image-shrink_1280/image-shrink_1280/0/1714322533209?e=2147483647&v=beta&t=KYZ1csjmClYaWLcZA_ZqmnctbYOJbMsLEL-NYUl8T6Y",
      heading: "Satpara Lake",
    },
    {
      title: "Discover the Hidden Jewel of Baltistan",
      img: "https://i0.wp.com/gbit.pk/wp-content/uploads/2021/03/Road-to-Khaplu-Valley.jpg?fit=1200%2C720&ssl=1",
      heading: "Khaplu Valley",
    },
    {
      title: "Experience Baltistan's Cultural Legacy",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi2MB-Xi9ddL6GMDUifDB0wiKPMK1sk0K7wA&s",
      heading: "Khaplu Fort",
    },
    {
      title: "An Emerald Lake in the Mountains",
      img: "https://i.ytimg.com/vi/DVDoJo98OZw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCqdD_yMosGTuhtEUHBr0UASqh8xA",
      heading: "Sheosar Lake",
    },
    {
      title: "A Place of Legends and Beauty",
      img: "https://www.pakistantravelblog.com/wp-content/uploads/2020/06/photographer_of_worlds_101339325_596411301289404_4082144345295678995_n.jpg",
      heading: "Deosai National Park",
    },
  ];
  

export default function TourPackages() {
  const [index, setIndex] = useState(0);
  const imageRef = useRef(null);
  const headingRef = useRef(null);
  const exploreBtnRef = useRef(null);
  const titleRef = useRef(null);
  const leftContentRef = useRef(null);

  const handleExplore = () => {
    const tl = gsap.timeline();
    
    // Animate out ALL content
    tl.to(
      [imageRef.current, headingRef.current, exploreBtnRef.current, titleRef.current, leftContentRef.current], 
      {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.in",
        stagger: 0.05
      }
    );
    
    // Change content
    tl.add(() => {
      setIndex((prev) => (prev + 1) % tourData.length);
    });
    
    // Animate in new content
    tl.fromTo(
      [imageRef.current, headingRef.current, exploreBtnRef.current, titleRef.current, leftContentRef.current],
      { opacity: 0, y: -20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1
      }
    );
  };

  return (
    <div className="flex flex-col-reverse md:flex-row items-stretch justify-between w-[full] max-w-5xl mx-auto min-h-[400px] md:h-[450px] overflow-hidden bg-white shadow-lg rounded-xl mt-10">
      {/* Left Side - Content */}
      <div ref={leftContentRef} className="w-full md:w-1/2 p-4 items-start flex flex-col justify-center ">
        <button className="bg-gray-100 px-3 py-1 text-sm rounded-full w-max mb-4 flex items-center space-x-1">
          <span>🧭</span>
          <span>Tours</span>
        </button>
        <p ref={titleRef} className="text-4xl font-semibold leading-tight">
        Experience World Wonders <br />
          <span className="text-red-600 font-bold">{tourData[index].title}</span>
        </p>
      </div>

      {/* Right Side - Image */}
      <div className="relative w-full md:w-1/2 h-64 md:h-auto">
        <div className="absolute inset-0 h-[75%] w-full">
          <img
            ref={imageRef}
            src={tourData[index].img}
            alt="Tour Location"
            className="w-full h-full object-cover md:rounded-r-xl"
          />
          <div 
            ref={exploreBtnRef}
            className="absolute top-4 right-4 flex items-center text-sm bg-white px-3 py-1 rounded-full shadow cursor-pointer"
            onClick={handleExplore}
          >
            <span className="mr-1">Explore</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <h1
            ref={headingRef}
            className="absolute bottom-4 left-4 text-white text-xl font-semibold drop-shadow-lg"
          >
            {tourData[index].heading}
          </h1>
        </div>
      </div>
    </div>
  );
}