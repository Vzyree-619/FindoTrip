import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Lightbulb, Shield, DollarSign, MapPin, Clock, Users } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Tips() {
  const tipCategories = [
    {
      icon: DollarSign,
      title: "Budget Travel Tips",
      tips: [
        "Book accommodations in advance for better rates",
        "Travel during off-peak seasons for lower prices",
        "Use local transportation instead of taxis",
        "Look for package deals combining accommodation and tours",
        "Eat at local restaurants for authentic and affordable meals",
      ],
    },
    {
      icon: Shield,
      title: "Safety Tips",
      tips: [
        "Keep copies of important documents (passport, ID) separate",
        "Share your itinerary with family or friends",
        "Stay aware of your surroundings, especially in crowded areas",
        "Keep emergency contact numbers saved",
        "Purchase travel insurance for peace of mind",
      ],
    },
    {
      icon: MapPin,
      title: "Planning Tips",
      tips: [
        "Research your destination before traveling",
        "Check weather forecasts and pack accordingly",
        "Learn basic local phrases",
        "Download offline maps and translation apps",
        "Create a flexible itinerary with backup plans",
      ],
    },
    {
      icon: Clock,
      title: "Time Management",
      tips: [
        "Arrive at airports/bus stations early",
        "Account for traffic and delays in your schedule",
        "Prioritize must-see attractions",
        "Allow time for rest and unexpected discoveries",
        "Book time-sensitive activities in advance",
      ],
    },
    {
      icon: Users,
      title: "Cultural Etiquette",
      tips: [
        "Respect local customs and traditions",
        "Dress appropriately for religious sites",
        "Ask permission before taking photos of people",
        "Learn about local tipping customs",
        "Be patient and respectful in all interactions",
      ],
    },
    {
      icon: Lightbulb,
      title: "General Tips",
      tips: [
        "Pack light but include essentials",
        "Stay hydrated, especially in hot climates",
        "Keep a power bank for your devices",
        "Use FindoTrip app for easy booking management",
        "Leave reviews to help other travelers",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-white/80 hover:text-white mb-8 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <Lightbulb className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Travel Tips</h1>
            <p className="text-xl text-white/90">
              Expert advice to make your travels smoother, safer, and more enjoyable.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Tips by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {tipCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#01502E]/10 rounded-full p-3">
                    <Icon className="w-6 h-6 text-[#01502E]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                </div>
                <ul className="space-y-3">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2 text-gray-700">
                      <span className="text-[#01502E] mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Quick Tips Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Travel Checklist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Before You Go</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Book accommodations and transportation</li>
                <li>✓ Check visa and passport requirements</li>
                <li>✓ Purchase travel insurance</li>
                <li>✓ Inform your bank about travel plans</li>
                <li>✓ Download necessary apps and maps</li>
                <li>✓ Pack essential items and medications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">During Your Trip</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Keep important documents safe</li>
                <li>✓ Stay connected with family/friends</li>
                <li>✓ Respect local culture and customs</li>
                <li>✓ Stay hydrated and eat well</li>
                <li>✓ Take photos but be present</li>
                <li>✓ Keep emergency contacts handy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white">
          <h2 className="text-3xl font-bold mb-4 text-center">Need More Help?</h2>
          <p className="text-lg text-white/90 mb-6 text-center max-w-2xl mx-auto">
            Explore our travel guides, connect with local experts, or contact our support team for personalized assistance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/guides"
              className="px-6 py-3 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              View Travel Guides
            </Link>
            <Link
              to="/tours"
              className="px-6 py-3 bg-white/10 text-white border-2 border-white rounded-lg hover:bg-white/20 transition font-semibold"
            >
              Find Tour Guides
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 bg-white/10 text-white border-2 border-white rounded-lg hover:bg-white/20 transition font-semibold"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

