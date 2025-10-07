import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { WifiOff, RefreshCw, Home, Search } from "lucide-react";
import { generateMeta } from "~/components/SEOHead";

export const meta = () => generateMeta({
  title: "You're Offline - FindoTrip",
  description: "You're currently offline. Check your internet connection and try again.",
  keywords: "offline, no internet, connection"
});

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Offline() {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      // Show a message that they're still offline
      alert('You\'re still offline. Please check your internet connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-200 rounded-full mb-6">
            <WifiOff className="h-12 w-12 text-gray-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Offline
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            It looks like you've lost your internet connection. Check your network settings and try again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <button
            onClick={handleRefresh}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={handleRetry}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-semibold"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Homepage
          </button>
        </div>

        {/* Offline Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What you can do offline:
          </h3>
          
          <ul className="text-left space-y-3 text-gray-600">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              View previously loaded pages
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Browse cached accommodation details
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Review your saved favorites
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Check your booking history
            </li>
          </ul>
        </div>

        {/* Network Status */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Tip:</strong> Your actions will be saved and synced when you're back online.
          </p>
        </div>

        {/* Connection Help */}
        <div className="mt-8 text-sm text-gray-500">
          <p className="mb-2">Having trouble connecting?</p>
          <div className="space-y-1">
            <p>• Check your WiFi or mobile data</p>
            <p>• Try moving to a different location</p>
            <p>• Restart your router or device</p>
          </div>
        </div>
      </div>
    </div>
  );
}
