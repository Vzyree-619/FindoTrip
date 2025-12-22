import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Phone, AlertTriangle, Shield, Clock, MapPin } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Emergency() {
  const emergencyContacts = [
    {
      title: "24/7 Emergency Hotline",
      number: "+92 300 123 4567",
      description: "Available round the clock for urgent travel emergencies",
      icon: Phone,
      color: "bg-red-600",
    },
    {
      title: "Medical Emergency",
      number: "1122",
      description: "Pakistan Emergency Services",
      icon: AlertTriangle,
      color: "bg-red-500",
    },
    {
      title: "Police Emergency",
      number: "15",
      description: "Local police emergency services",
      icon: Shield,
      color: "bg-blue-600",
    },
  ];

  const emergencyScenarios = [
    {
      title: "Lost or Stolen Items",
      steps: [
        "Contact the property owner or service provider immediately",
        "File a report with local authorities if necessary",
        "Contact our emergency hotline for assistance",
        "Check your travel insurance coverage",
      ],
    },
    {
      title: "Medical Emergency",
      steps: [
        "Call 1122 for immediate medical assistance",
        "Contact your travel insurance provider",
        "Notify the property owner or tour guide",
        "Contact our support team for coordination",
      ],
    },
    {
      title: "Booking Issues",
      steps: [
        "Contact the property owner or service provider directly",
        "Reach out to our 24/7 support team",
        "Check your booking confirmation email",
        "Document the issue with photos if applicable",
      ],
    },
    {
      title: "Safety Concerns",
      steps: [
        "If immediate danger, call local emergency services (15)",
        "Contact our emergency hotline",
        "Move to a safe location if possible",
        "Document the situation for our support team",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-20 px-4 sm:px-6 lg:px-8">
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
              <AlertTriangle className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Emergency Support</h1>
            <p className="text-xl text-white/90">
              We're here to help 24/7. If you're experiencing an emergency, contact us immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Emergency Contacts */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {emergencyContacts.map((contact, index) => {
              const Icon = contact.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
                >
                  <div className={`${contact.color} rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{contact.title}</h3>
                  <a
                    href={`tel:${contact.number.replace(/\s/g, '')}`}
                    className="text-2xl font-bold text-[#01502E] hover:underline block mb-2"
                  >
                    {contact.number}
                  </a>
                  <p className="text-gray-600 text-sm">{contact.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Scenarios */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Common Emergency Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emergencyScenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{scenario.title}</h3>
                <ol className="space-y-2">
                  {scenario.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#01502E] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {stepIndex + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Important Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Our emergency support team is available 24/7</li>
                <li>• For life-threatening emergencies, always call local emergency services first (1122 or 15)</li>
                <li>• Keep your booking confirmation and travel insurance details accessible</li>
                <li>• Document any incidents with photos and notes when safe to do so</li>
                <li>• We can help coordinate with local authorities and service providers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-[#01502E]" />
              <h3 className="text-xl font-semibold text-gray-900">24/7 Support</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Our support team is available around the clock to assist with any emergencies or urgent issues.
            </p>
            <a
              href="tel:+923001234567"
              className="text-[#01502E] font-semibold hover:underline"
            >
              Call Now →
            </a>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-[#01502E]" />
              <h3 className="text-xl font-semibold text-gray-900">Local Assistance</h3>
            </div>
            <p className="text-gray-700 mb-4">
              We can connect you with local emergency services, medical facilities, and authorities in your area.
            </p>
            <Link
              to="/contact"
              className="text-[#01502E] font-semibold hover:underline"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

