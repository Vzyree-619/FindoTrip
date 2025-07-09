  import { useState } from "react";
  import PropTypes from "prop-types";
  import { FaWifi,  FaParking, FaSwimmingPool, FaUtensils,  FaDumbbell } from "react-icons/fa";
  import TravelersAsking from "../components/adminPages/traveler";
  import GuestReviews from "../components/adminPages/guestReview";
  import Comment from "../components/adminPages/comments";
  import Priceing from "../components/hotelPages/Priceing";
  import HotelPage from "./_hotels/HotelPage";

  export default function HotelDetails({ hotel, onBack }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    if (!hotel) return <p>No hotel selected.</p>;

    return (
      <div className="p-4">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-500 text-white rounded">
          ← Back
        </button>

        <h1 className="mb-4 text-2xl font-bold">{hotel.name}</h1>
        <p className="mb-4 text-gray-600">{hotel.location}</p>
        <p className="text-gray-700">{hotel.description}</p>

        {/* Hotel Image and Map Section */}
          {hotel.images?.length > 0 && (
            <button
              type="button"
              className="rounded-lg cursor-pointer md:w-1/2 p-0 border-0 bg-transparent focus:outline-none"
              onClick={() => setShowModal(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setShowModal(true);
                }
              }}
              aria-label={`View images of ${hotel.name}`}
            >
              <img
                src={hotel.images[0]}
                alt={hotel.name}
                className="rounded-lg w-full h-auto"
                tabIndex={-1}
                draggable={false}
              />
            </button>
          )}
          <div className="md:w-1/2">
            <div dangerouslySetInnerHTML={{ __html: hotel.mapUrl || "" }} />
          </div>

        {/* Facilities Section */}
        <>
          <h2 className="mt-4 text-xl font-bold">Facilities</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hotel.facilities?.map((facility, index) => (
              <div
                key={index}
                className="flex items-center p-4 space-x-2 bg-gray-100 rounded-lg"
              >
                <span>
                  {facility.toLowerCase() === "wifi" && <FaWifi />}
                  {facility.toLowerCase() === "parking" && <FaParking />}
                  {facility.toLowerCase() === "pool" && <FaSwimmingPool />}
                  {facility.toLowerCase() === "restaurant" && <FaUtensils />}
                  {facility.toLowerCase() === "gym" && <FaDumbbell />}
                </span>
                <p>{facility}</p>
              </div>
            ))}
          </div>
        </>

        {/* Additional Sections */}
        <>
          <TravelersAsking />
          <Comment />
          <GuestReviews />
          <Priceing hotel={hotel} />
          <HotelPage />
        </>

        {/* Modal for Viewing All Images */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative w-3/4 p-6 overflow-auto bg-white rounded-lg h-3/4">
              <button
                className="absolute text-xl text-black top-2 right-2"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
              <h2 className="mb-4 text-2xl font-bold">All Images</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {hotel.images?.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    className="p-0 border-0 bg-transparent object-cover w-full h-40 transition-transform rounded-lg cursor-pointer hover:scale-105 focus:outline-none"
                    onClick={() => setSelectedImage(img)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedImage(img);
                      }
                    }}
                    aria-label={`Enlarge view of ${hotel.name} photo ${index + 1}`}
                  >
                    <img
                      src={img}
                      alt={`View of ${hotel.name} ${index + 1}`}
                      className="object-cover w-full h-40 rounded-lg"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal for Enlarged Image */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Enlarged hotel"
                className="w-auto h-auto max-h-screen rounded-lg"
              />
              <button
                className="absolute text-xl text-white top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                ✖
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  HotelDetails.propTypes = {
    hotel: PropTypes.shape({
      name: PropTypes.string.isRequired,
      location: PropTypes.string,
      description: PropTypes.string,
      images: PropTypes.arrayOf(PropTypes.string),
      mapUrl: PropTypes.string,
      facilities: PropTypes.arrayOf(PropTypes.string),
    }),
    onBack: PropTypes.func,
  };
