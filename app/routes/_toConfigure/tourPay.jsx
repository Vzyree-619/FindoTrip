import NavBar from "~/components/layout/navigation/NavBar";

export default function TourPay() {
  return (
    <>
      <NavBar />
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Credit Card Payment</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Card Number
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="1234 5678 9012 3456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cardholder Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="John Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CVV
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="123"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Pay Now
          </button>
        </form>
      </div>
    </>
  );
}
