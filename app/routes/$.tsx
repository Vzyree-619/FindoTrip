import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLocation } from "@remix-run/react";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { generateMeta } from "~/components/common/SEOHead";

export const meta = () => generateMeta({
  title: "Page Not Found - FindoTrip",
  description: "The page you're looking for doesn't exist. Explore our accommodations, car rentals, and tour guides instead.",
  keywords: "404, not found, error, travel, accommodations"
});

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Log 404s for analytics
  console.log(`404 Error: ${url.pathname} - Referrer: ${request.headers.get('referer') || 'Direct'}`);
  
  return json({ pathname: url.pathname }, { status: 404 });
}

export default function NotFound() {
  const location = useLocation();
  
  const suggestions = [
    {
      icon: Home,
      title: "Go Home",
      description: "Start fresh from our homepage",
      to: "/",
      color: "bg-[#01502E] hover:bg-[#013d23]"
    },
    {
      icon: Search,
      title: "Search Accommodations",
      description: "Find your perfect stay",
      to: "/accommodations/search",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: MapPin,
      title: "Find Tour Guides",
      description: "Discover local experiences",
      to: "/tour_guides",
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-[#01502E] rounded-full mb-6">
            <span className="text-4xl font-bold text-white">404</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <p className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded inline-block">
            {location.pathname}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <Link
                key={suggestion.to}
                to={suggestion.to}
                className={`p-6 rounded-xl text-white transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${suggestion.color}`}
              >
                <Icon className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">{suggestion.title}</h3>
                <p className="text-sm opacity-90">{suggestion.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Alternative Actions */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
          
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors"
          >
            Report Issue
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you believe this is an error or you were expecting to find something here, please let us know.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a 
              href="mailto:support@findotrip.com" 
              className="text-[#01502E] hover:underline"
            >
              support@findotrip.com
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <a 
              href="tel:+92XXXXXXXXX" 
              className="text-[#01502E] hover:underline"
            >
              +92 XXX XXXXXXX
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
