import { useParams } from "@remix-run/react";
import { useNavigate } from "@remix-run/react";
export default function RoomDetail() {
  const { type } = useParams();
  let navigate = useNavigate(); 
  const roomDetails = {
    suite: {
      size: "28 m²",
      bed: "1 king bed",
      bathroom: "Private bathroom with shower",
      view: "Mountain view",
      facilities: [
        "Desk",
        "Heating",
        "Flat-screen TV",
        "Fan",
        "Electric kettle",
        "Wake-up service",
      ],
      image: "https://img.freepik.com/free-photo/luxury-bedroom-hotel_1150-10836.jpg?ga=GA1.1.1062691103.1729089081&semt=ais_hybrid", // Dummy image link
    },
    "deluxe-double-room": {
      size: "30 m²",
      bed: "1 king bed",
      bathroom: "Private bathroom with shower",
      view: "City view",
      facilities: ["Desk", "Heating", "Flat-screen TV", "Fan", "Electric kettle"],
      image: "https://img.freepik.com/free-photo/luxury-classic-modern-bedroom-suite-hotel_105762-1787.jpg?ga=GA1.1.1062691103.1729089081&semt=ais_hybrid", // Dummy image link
    },
    "deluxe-twin-room": {
      size: "32 m²",
      bed: "2 twin beds",
      bathroom: "Private bathroom with shower",
      view: "Garden view",
      facilities: ["Desk", "Heating", "Flat-screen TV", "Fan", "Electric kettle"],
      image: "https://img.freepik.com/free-photo/interior-modern-comfortable-hotel-room_1232-1822.jpg?ga=GA1.1.1062691103.1729089081&semt=ais_hybrid", // Dummy image link
    },
  };

  const room = roomDetails[type];

  if (!room) {
    return <div className="p-4 text-red-500">Room not found.</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
         <button
        onClick={() => navigate(-1)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        ← Back
      </button>
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Image Section */}
        <div className="w-full h-64 overflow-hidden">
          <img
            src={room.image}
            alt={type.replace(/-/g, " ").toUpperCase()}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Room Details Section */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {type.replace(/-/g, " ").toUpperCase()}
          </h1>
          <div className="space-y-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-lg text-gray-700">
                <strong className="text-gray-900">Size:</strong> {room.size}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-lg text-gray-700">
                <strong className="text-gray-900">Bed:</strong> {room.bed}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-lg text-gray-700">
                <strong className="text-gray-900">Bathroom:</strong> {room.bathroom}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-lg text-gray-700">
                <strong className="text-gray-900">View:</strong> {room.view}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <strong className="text-lg text-gray-900">Facilities:</strong>
              <ul className="mt-2 space-y-2">
                {room.facilities.map((facility, index) => (
                  <li key={index} className="text-lg text-gray-700">
                    {facility}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}