// import { Link } from "@remix-run/react";
// import { FaUser } from "react-icons/fa"; // Import React Icons

// export default function Pricing() {
//   const rooms = [
//     { type: "Suite", guests: 4, bed: "1 king bed" },
//     { type: "Deluxe Double Room", guests: 2, bed: "1 king bed" },
//     { type: "Deluxe Twin Room", guests: 2, bed: "2 twin beds" },
//   ];

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Availability</h1>
//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white border">
//           <thead>
//             <tr>
//               <th className="py-2 px-4 border-b">Room Type</th>
//               <th className="py-2 px-4 border-b">Number of guests</th>
//               <th className="py-2 px-4 border-b">Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rooms.map((room, index) => (
//               <tr key={index} className="hover:bg-gray-100">
//                 <td className="py-2 px-4 border-b">
//                   <Link
//                     to={`/room/${room.type.toLowerCase().replace(/ /g, "-")}`}
//                     className="text-blue-500 hover:underline"
//                   >
//                     {room.type}
//                   </Link>
//                 </td>
//                 <td className="py-2 px-4 border-b flex items-center">
//                   {Array.from({ length: room.guests }, (_, i) => (
//                     <FaUser key={i} className="mr-1" />
//                   ))}
//                 </td>
//                 <td className="py-2 px-4 border-b">$200</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
import { MdEmojiPeople } from "react-icons/md";
import { Link } from "@remix-run/react";
import { FaUser } from "react-icons/fa";

export default function Pricing({ hotel }) {
  if (!hotel) {
    return <p>No pricing data available.</p>;
  }
 
  return (
    <div className="p-4">
      
      <h1 className="text-2xl font-bold mb-4">Availability</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Room Type</th>
              <th className="py-2 px-4 border-b">Number of guests</th>
              <th className="py-2 px-4 border-b">Price</th>
            </tr>
          </thead>
          <tbody>
            {hotel.rooms &&
              hotel.rooms.map((room, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">
                    <Link
                      to={`/room/${room.type.toLowerCase().replace(/ /g, "-")}`}
                      state={{ room }} // Pass room data to the details page
                      className="text-blue-500 hover:underline"
                    >
                      {room.type}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b flex items-center">
                    {Array.from({ length: room.guests }, (_, i) => (
                      <FaUser key={i} className="mr-1" />
                    ))}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {room.price ? `$${room.price}` : "N/A"}
                  </td>
                </tr>
              ))}

            {/* Additional room prices from database */}
            {hotel.suitePrice && (
              <tr className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">
                  <Link to="/room/suite" className="text-blue-500 hover:underline">
                    Suite
                  </Link>
                </td>
                <td className="py-2 px-4 border-b inline"><MdEmojiPeople /> x 4</td>
                <td className="py-2 px-4 border-b">${hotel.suitePrice}</td>
              </tr>
            )}
            {hotel.DeluxeDouble && (
              <tr className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">
                  <Link to="/room/deluxe-double-room" className="text-blue-500 hover:underline">
                    Deluxe Double
                  </Link>
                </td>
                <td className="py-2 px-4 border-b"><MdEmojiPeople /><MdEmojiPeople /> </td>
                <td className="py-2 px-4 border-b">${hotel.DeluxeDouble}</td>
              </tr>
            )}
            {hotel.DeluxeTwin && (
              <tr className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">
                  <Link to="/room/deluxe-twin-room" className="text-blue-500 hover:underline">
                    Deluxe Twin
                  </Link>
                </td>
                <td className="py-2 px-4 border-b"><MdEmojiPeople /><MdEmojiPeople /> </td>
                <td className="py-2 px-4 border-b">${hotel.DeluxeTwin}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
