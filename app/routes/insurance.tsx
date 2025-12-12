import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, FileText, Phone } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Insurance() {
  const coverageTypes = [
    {
      icon: Shield,
      title: "Medical Coverage",
      description: "Emergency medical expenses, hospitalization, and medical evacuation",
      details: [
        "Emergency medical treatment",
        "Hospital stays and surgery",
        "Medical evacuation",
        "Repatriation of remains",
      ],
    },
    {
      icon: AlertTriangle,
      title: "Trip Cancellation",
      description: "Protection against unexpected trip cancellations and interruptions",
      details: [
        "Illness or injury",
        "Family emergencies",
        "Natural disasters",
        "Travel provider bankruptcy",
      ],
    },
    {
      icon: FileText,
      title: "Baggage Protection",
      description: "Coverage for lost, stolen, or damaged luggage and personal items",
      details: [
        "Lost or stolen baggage",
        "Delayed baggage expenses",
        "Damaged personal items",
        "Replacement of essential items",
      ],
    },
    {
      icon: Phone,
      title: "24/7 Assistance",
      description: "Round-the-clock support for emergencies and travel assistance",
      details: [
        "Emergency hotline",
        "Travel assistance services",
        "Legal assistance",
        "Translation services",
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
              <Shield className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Travel Insurance</h1>
            <p className="text-xl text-white/90">
              Protect your trip and travel with peace of mind. Comprehensive coverage for your adventures.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Travel Insurance */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Why Travel Insurance?</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Travel insurance provides financial protection and peace of mind for unexpected events during your trip. 
              Whether it's a medical emergency, trip cancellation, lost baggage, or other unforeseen circumstances, 
              travel insurance helps you recover costs and get the assistance you need.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#01502E] mb-2">24/7</div>
                <div className="text-gray-600">Emergency Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#01502E] mb-2">100%</div>
                <div className="text-gray-600">Financial Protection</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#01502E] mb-2">Worldwide</div>
                <div className="text-gray-600">Coverage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">What's Covered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coverageTypes.map((coverage, index) => {
              const Icon = coverage.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#01502E]/10 rounded-full p-3">
                      <Icon className="w-6 h-6 text-[#01502E]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{coverage.title}</h3>
                  </div>
                  <p className="text-gray-700 mb-4">{coverage.description}</p>
                  <ul className="space-y-2">
                    {coverage.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-[#01502E] mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Your Plan</h3>
              <p className="text-sm text-gray-600">Select coverage that fits your travel needs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Instant Coverage</h3>
              <p className="text-sm text-gray-600">Receive your policy confirmation immediately</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Travel Protected</h3>
              <p className="text-sm text-gray-600">Enjoy your trip with peace of mind</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">File a Claim</h3>
              <p className="text-sm text-gray-600">Easy online claims process if needed</p>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Important Notes</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Read policy terms and conditions carefully before purchasing</li>
                <li>• Coverage varies by plan - choose the one that best fits your needs</li>
                <li>• Pre-existing conditions may require additional coverage</li>
                <li>• Keep all receipts and documentation for claims</li>
                <li>• Contact insurance provider immediately in case of emergency</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Get Protected Today</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Don't let unexpected events ruin your trip. Get comprehensive travel insurance coverage 
            and travel with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="px-8 py-4 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
            >
              Get a Quote
            </Link>
            <a
              href="tel:+923001234567"
              className="px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg hover:bg-white/20 transition font-semibold text-lg"
            >
              Call for Assistance
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

