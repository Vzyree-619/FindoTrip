// import { Form } from "@remix-run/react";

export default function SubscriptionForm() {
  return (
    <div className="bg-black text-white p-6 rounded-lg shadow-md overflow-hidden w-full max-w-3xl mx-auto">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-center">
        Get Exciting Updates and Special Discount Offers!
      </h2>
      <form method="post" className="flex flex-col md:flex-row items-center gap-4">
        <input
          type="email"
          name="email"
          id="email"
          placeholder="Your Email Address"
          required
          className="w-full md:flex-1 px-4 py-2 rounded-lg border border-gray-300 text-black focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition duration-300"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
