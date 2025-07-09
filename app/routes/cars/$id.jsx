import { useParams, useNavigate } from "@remix-run/react";
import NavBar from "../../components/navigation/NavBar";
import { useState } from "react";

const cars = [
  { id: 1, title: "Honda BRV", description: "Comfortable and reliable with spacious seating.", price: "PKR 15,000/day", image: "/brv.png" },
  { id: 2, title: "Toyota Land Cruiser", description: "Luxury and performance combined.", price: "PKR 25,000/day", image: "/landCruser.png" },
  { id: 3, title: "Hiace Van", description: "Spacious van ideal for group travels.", price: "PKR 15,500/day", image: "/van.jpg" },
  { id: 4, title: "Honda BRV", description: "Another view of the Honda BRV.", price: "PKR 15,000/day", image: "/car.jpg" },
];

const owner = {
  name: "Ali Khan",
  rating: 4.8,
  phone: "+92 300 1234567",
  image: "/owner.jpg",
  reviews: 32,
};

const addOns = [
  { name: "Full Insurance", price: "PKR 2,000/day" },
  { name: "Child Seat", price: "PKR 500/day" },
  { name: "Additional Driver", price: "PKR 1,000/day" },
];

const reviews = [
  { user: "Sara Ahmed", comment: "Great car, smooth ride!", rating: 5 },
  { user: "Bilal Raza", comment: "Owner was very helpful.", rating: 4 },
];

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { from: "owner", text: "Hello! How can I help you?" },
  ]);
  const car = cars.find((c) => c.id === Number(id));

  if (!car) return <div className="p-8">Car not found.</div>;

  const handleSend = () => {
    if (chatMsg.trim()) {
      setChatHistory([...chatHistory, { from: "user", text: chatMsg }]);
      setChatMsg("");
      setTimeout(() => {
        setChatHistory((h) => [...h, { from: "owner", text: "Thanks for your message! (Dummy)" }]);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <img src={car.image} alt={car.title} className="w-full h-64 md:h-80 object-cover rounded mb-6" />
            <h1 className="text-3xl font-bold mb-2">{car.title}</h1>
            <p className="mb-4 text-gray-700">{car.description}</p>
            <p className="mb-4 font-semibold text-lg">Price: {car.price}</p>
            <div className="mb-6 flex items-center gap-4 bg-gray-100 p-4 rounded">
              <img src={owner.image} alt={owner.name} className="w-16 h-16 rounded-full object-cover border" />
              <div>
                <div className="font-bold">Owner: {owner.name}</div>
                <div className="text-sm text-gray-600">Rating: {owner.rating} ⭐ ({owner.reviews} reviews)</div>
                <div className="text-sm text-gray-600">Phone: {owner.phone}</div>
                <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full md:w-auto" onClick={() => setChatOpen(true)}>Chat with Owner</button>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Add-ons & Options</h2>
              <ul className="list-disc pl-5 space-y-1">
                {addOns.map((a, i) => (
                  <li key={i}>{a.name} <span className="text-gray-500">({a.price})</span></li>
                ))}
              </ul>
            </div>
            <button className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 w-full md:w-auto" onClick={() => navigate("/carPay")}>Proceed to Pay</button>
          </div>
          <div>
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Recent Reviews</h2>
              <ul className="divide-y">
                {reviews.map((r, i) => (
                  <li key={i} className="py-2"><span className="font-bold">{r.user}:</span> {r.comment} <span className="text-yellow-500">{'★'.repeat(r.rating)}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setChatOpen(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Chat with {owner.name}</h2>
            <div className="h-40 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={msg.from === "user" ? "text-right" : "text-left"}>
                  <span className={msg.from === "user" ? "bg-green-100 px-2 py-1 rounded inline-block my-1" : "bg-blue-100 px-2 py-1 rounded inline-block my-1"}>
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" className="flex-1 border rounded px-2 py-1" value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSend()} />
              <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleSend}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 