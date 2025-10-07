import NavBar from "../components/navigation/NavBar";
import { useState } from "react";
import { FaUser, FaSuitcase, FaHeart, FaEnvelope, FaStar, FaCreditCard, FaChartBar, FaLifeRing, FaBell } from "react-icons/fa";

// Dummy Data
const user = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 234 567 890",
  avatar: "/avatar.png",
  loyalty: { level: 2, points: 3200, nextLevel: 5000 },
};
const bookings = [
  { id: 1, type: "Hotel", title: "Roxy Hotel New York", image: "/basho.jpg", date: "2024-07-10", status: "Upcoming", price: "PKR 37,488" },
  { id: 2, type: "Car", title: "Honda BRV", image: "/brv.png", date: "2024-06-01", status: "Past", price: "PKR 15,000" },
  { id: 3, type: "Tour", title: "Skardu Valley Adventure", image: "/skdu.jpg", date: "2024-05-15", status: "Cancelled", price: "PKR 30,000" },
];
const wishlist = [
  { id: 1, type: "Hotel", title: "The Velvet Rope PS", image: "/skdu.jpg" },
  { id: 2, type: "Car", title: "Toyota Land Cruiser", image: "/landCruser.png" },
];
const messages = [
  { from: "Support", subject: "Booking Confirmation", date: "2024-05-01", unread: true },
  { from: "Ali Khan (Owner)", subject: "Car Pickup Details", date: "2024-04-28", unread: false },
];
const reviews = [
  { id: 1, for: "Roxy Hotel New York", rating: 5, text: "Amazing stay!" },
  { id: 2, for: "Honda BRV", rating: 4, text: "Smooth ride, friendly owner." },
];
const payments = [
  { id: 1, method: "Visa **** 1234", default: true },
  { id: 2, method: "Mastercard **** 5678", default: false },
];
const recommendations = [
  { id: 1, type: "Hotel", title: "The Inn at Virginia Tech", image: "/basho.jpg" },
  { id: 2, type: "Tour", title: "Baltoro Glacier Trek", image: "/skdu.jpg" },
];
const supportTickets = [
  { id: 1, subject: "Refund Request", status: "Open", date: "2024-05-02" },
  { id: 2, subject: "Change Booking Date", status: "Closed", date: "2024-04-20" },
];

const sections = [
  { key: "profile", label: "Profile", icon: <FaUser /> },
  { key: "bookings", label: "Bookings", icon: <FaSuitcase /> },
  { key: "wishlist", label: "Wishlist", icon: <FaHeart /> },
  { key: "messages", label: "Messages", icon: <FaEnvelope /> },
  { key: "reviews", label: "Reviews", icon: <FaStar /> },
  { key: "payments", label: "Payments", icon: <FaCreditCard /> },
  { key: "recommendations", label: "Recommendations", icon: <FaChartBar /> },
  { key: "support", label: "Support", icon: <FaLifeRing /> },
];

function Sidebar({ current, setCurrent, unread }) {
  return (
    <aside className="sticky top-0 bg-white shadow rounded-lg p-4 flex flex-row lg:flex-col gap-2 lg:gap-4 mb-6 lg:mb-0 overflow-x-auto">
      {sections.map((s) => (
        <button
          key={s.key}
          className={`flex items-center gap-2 px-3 py-2 rounded transition font-semibold ${current === s.key ? "bg-green-100 text-[#01502E]" : "hover:bg-gray-100 text-gray-700"}`}
          onClick={() => setCurrent(s.key)}
        >
          {s.icon}
          <span className="hidden lg:inline">{s.label}</span>
          {s.key === "messages" && unread > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unread}</span>
          )}
        </button>
      ))}
    </aside>
  );
}

function ProfileSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6 bg-green-50 p-6 rounded-lg">
        <img src={user.avatar} alt="avatar" className="w-24 h-24 rounded-full border-4 border-green-200 object-cover" />
        <div>
          <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
          <div className="text-gray-600 mb-2">{user.email} | {user.phone}</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-200 text-[#01502E] px-2 py-1 rounded text-xs font-semibold">Genius Level {user.loyalty.level}</span>
            <span className="text-xs text-gray-500">{user.loyalty.points} pts</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2 mb-2">
            <div className="bg-[#01502E] h-2 rounded" style={{ width: `${(user.loyalty.points / user.loyalty.nextLevel) * 100}%` }}></div>
          </div>
          <div className="text-xs text-gray-500">{user.loyalty.nextLevel - user.loyalty.points} pts to next level</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow flex flex-col gap-2">
          <span className="font-semibold">Change Password</span>
          <button className="bg-[#01502E] text-white px-4 py-2 rounded hover:bg-[#013d23] transition-colors">Change</button>
        </div>
        <div className="bg-white p-4 rounded shadow flex flex-col gap-2">
          <span className="font-semibold">Manage Payment Methods</span>
          <button className="bg-[#01502E] text-white px-4 py-2 rounded hover:bg-[#013d23] transition-colors">Manage</button>
        </div>
        <div className="bg-white p-4 rounded shadow flex flex-col gap-2">
          <span className="font-semibold">Notification Settings</span>
          <button className="bg-[#01502E] text-white px-4 py-2 rounded hover:bg-[#013d23] transition-colors">Edit</button>
        </div>
        <div className="bg-white p-4 rounded shadow flex flex-col gap-2">
          <span className="font-semibold">Edit Profile</span>
          <button className="bg-[#01502E] text-white px-4 py-2 rounded hover:bg-[#013d23] transition-colors">Edit</button>
        </div>
      </div>
    </div>
  );
}

function BookingsSection() {
  const [tab, setTab] = useState("Upcoming");
  return (
    <div>
      <div className="flex gap-4 mb-6">
        {["Upcoming", "Past", "Cancelled"].map((t) => (
          <button key={t} className={`px-4 py-2 rounded transition-colors ${tab === t ? "bg-[#01502E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.filter(b => b.status === tab).map((b) => (
          <div key={b.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <img src={b.image} alt={b.title} className="w-full h-32 object-cover rounded mb-2" />
            <div className="font-bold text-lg">{b.title}</div>
            <div className="text-gray-500 text-sm">{b.type} | {b.date}</div>
            <div className="text-[#01502E] font-bold">{b.price}</div>
            <div className="flex gap-2 mt-2">
              <button className="bg-[#01502E] text-white px-3 py-1 rounded text-sm hover:bg-[#013d23] transition-colors">View Details</button>
              {tab === "Upcoming" && <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">Cancel</button>}
              {tab === "Past" && <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">Rebook</button>}
              <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">Contact Support</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlist.map((w) => (
        <div key={w.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
          <img src={w.image} alt={w.title} className="w-full h-32 object-cover rounded mb-2" />
          <div className="font-bold text-lg">{w.title}</div>
          <div className="text-gray-500 text-sm">{w.type}</div>
          <div className="flex gap-2 mt-2">
            <button className="bg-[#01502E] text-white px-3 py-1 rounded text-sm hover:bg-[#013d23] transition-colors">Book Now</button>
            <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSection() {
  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <div key={i} className={`flex items-center gap-4 p-4 rounded shadow ${m.unread ? "bg-green-50" : "bg-white"}`}>
          <FaEnvelope className="text-[#01502E] text-xl" />
          <div className="flex-1">
            <div className="font-semibold">{m.subject}</div>
            <div className="text-gray-500 text-sm">From: {m.from} | {m.date}</div>
          </div>
          {m.unread && <span className="bg-[#01502E] text-white text-xs rounded-full px-2 py-0.5">New</span>}
        </div>
      ))}
    </div>
  );
}

function ReviewsSection() {
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FaStar className="text-yellow-400" />
            <span className="font-bold">{r.for}</span>
            <span className="text-gray-500">({r.rating}/5)</span>
          </div>
          <div className="text-gray-700">{r.text}</div>
          <button className="bg-[#01502E] text-white px-3 py-1 rounded text-sm w-max hover:bg-[#013d23] transition-colors">Edit Review</button>
        </div>
      ))}
      <button className="bg-green-500 text-white px-4 py-2 rounded mt-4">Write a Review</button>
    </div>
  );
}

function PaymentsSection() {
  return (
    <div className="space-y-4">
      {payments.map((p) => (
        <div key={p.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <FaCreditCard className="text-[#01502E] text-xl" />
          <span className="flex-1">{p.method}</span>
          {p.default && <span className="bg-[#01502E] text-white text-xs rounded-full px-2 py-0.5">Default</span>}
          <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">Remove</button>
        </div>
      ))}
      <button className="bg-[#01502E] text-white px-4 py-2 rounded hover:bg-[#013d23] transition-colors">Add Payment Method</button>
    </div>
  );
}

function RecommendationsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((rec) => (
        <div key={rec.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
          <img src={rec.image} alt={rec.title} className="w-full h-32 object-cover rounded mb-2" />
          <div className="font-bold text-lg">{rec.title}</div>
          <div className="text-gray-500 text-sm">{rec.type}</div>
          <button className="bg-[#01502E] text-white px-3 py-1 rounded text-sm mt-2 hover:bg-[#013d23] transition-colors">View</button>
        </div>
      ))}
    </div>
  );
}

function SupportSection() {
  return (
    <div className="space-y-4">
      <button className="bg-[#01502E] text-white px-4 py-2 rounded hover:bg-[#013d23] transition-colors">Open a Ticket</button>
      {supportTickets.map((t) => (
        <div key={t.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
          <div className="font-bold">{t.subject}</div>
          <div className="text-gray-500 text-sm">{t.status} | {t.date}</div>
          <button className="bg-[#01502E] text-white px-3 py-1 rounded text-sm w-max hover:bg-[#013d23] transition-colors">View Ticket</button>
        </div>
      ))}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h3 className="font-semibold mb-2">FAQs</h3>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>How do I change my booking?</li>
          <li>How do I request a refund?</li>
          <li>How do I contact support?</li>
        </ul>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [current, setCurrent] = useState("profile");
  const unread = messages.filter((m) => m.unread).length;
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        <Sidebar current={current} setCurrent={setCurrent} unread={unread} />
        <main className="flex-1">
          {current === "profile" && <ProfileSection />}
          {current === "bookings" && <BookingsSection />}
          {current === "wishlist" && <WishlistSection />}
          {current === "messages" && <MessagesSection />}
          {current === "reviews" && <ReviewsSection />}
          {current === "payments" && <PaymentsSection />}
          {current === "recommendations" && <RecommendationsSection />}
          {current === "support" && <SupportSection />}
        </main>
      </div>
    </div>
  );
}