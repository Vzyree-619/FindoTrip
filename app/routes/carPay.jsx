import NavBar from "../components/navigation/NavBar";
import { useState } from "react";

export default function CarPay() {
  const [paid, setPaid] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow mt-10">
        <h1 className="text-2xl font-bold mb-4">Car Payment</h1>
        <div className="mb-4">Car: <span className="font-semibold">Honda BRV</span></div>
        <div className="mb-4">Price: <span className="font-semibold">PKR 15,000/day</span></div>
        {!paid ? (
          <button className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600" onClick={() => setPaid(true)}>
            Pay Now
          </button>
        ) : (
          <div className="text-green-600 font-bold mt-4">Payment Successful! (Dummy)</div>
        )}
      </div>
    </div>
  );
} 