import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Eye, Ear, MousePointer, Keyboard, Smartphone, CheckCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Accessibility() {
  const features = [
    {
      icon: Keyboard,
      title: "Keyboard Navigation",
      description: "Full keyboard accessibility for all interactive elements",
    },
    {
      icon: Eye,
      title: "Screen Reader Support",
      description: "Compatible with major screen readers (NVDA, JAWS, VoiceOver)",
    },
    {
      icon: MousePointer,
      title: "High Contrast Mode",
      description: "Enhanced visibility options for better readability",
    },
    {
      icon: Smartphone,
      title: "Mobile Accessibility",
      description: "Optimized for assistive technologies on mobile devices",
    },
    {
      icon: Ear,
      title: "Audio Alternatives",
      description: "Text alternatives for audio content and captions for videos",
    },
    {
      icon: CheckCircle,
      title: "WCAG Compliance",
      description: "Following WCAG 2.1 Level AA accessibility standards",
    },
  ];

  const commitments = [
    "Regular accessibility audits and testing",
    "User feedback integration",
    "Continuous improvement of accessibility features",
    "Training for our development team",
    "Partnership with accessibility organizations",
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
            <h1 className="text-5xl font-bold mb-6">Accessibility</h1>
            <p className="text-xl text-white/90">
              FindoTrip is committed to making travel accessible to everyone, regardless of abilities.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Commitment */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Commitment</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              At FindoTrip, we believe that travel should be accessible to everyone. We are committed to 
              ensuring that our website, mobile applications, and services are accessible to people with 
              disabilities. We strive to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 
              Level AA standards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commitments.map((commitment, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#01502E] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{commitment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Accessibility Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#01502E]/10 rounded-full p-4">
                      <Icon className="w-8 h-8 text-[#01502E]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{feature.title}</h3>
                  <p className="text-gray-600 text-center">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Use Accessibility Features */}
        <div className="mb-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Using Accessibility Features</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Keyboard Shortcuts</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Tab:</strong> Navigate through interactive elements</li>
                <li>• <strong>Enter/Space:</strong> Activate buttons and links</li>
                <li>• <strong>Escape:</strong> Close modals and popups</li>
                <li>• <strong>Arrow Keys:</strong> Navigate menus and lists</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Screen Reader Users</h3>
              <p className="text-gray-700 mb-2">
                Our website is optimized for screen readers. All images have alt text, forms have proper 
                labels, and content is structured with semantic HTML.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Visual Adjustments</h3>
              <p className="text-gray-700 mb-2">
                You can adjust text size, contrast, and other visual settings through your browser or 
                device settings. We also provide high contrast mode options.
              </p>
            </div>
          </div>
        </div>

        {/* Reporting Issues */}
        <div className="mb-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Accessibility Issues</h2>
          <p className="text-gray-700 mb-4">
            If you encounter any accessibility barriers on our website or have suggestions for improvement, 
            we want to hear from you. Your feedback helps us make FindoTrip more accessible for everyone.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
            >
              Contact Us
            </Link>
            <Link
              to="/feedback"
              className="px-6 py-3 bg-white text-[#01502E] border-2 border-[#01502E] rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Share Feedback
            </Link>
          </div>
        </div>

        {/* Standards Compliance */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Standards & Compliance</h2>
          <p className="text-gray-700 mb-4">
            FindoTrip is committed to following accessibility standards and best practices:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>• <strong>WCAG 2.1 Level AA:</strong> Web Content Accessibility Guidelines</li>
            <li>• <strong>Section 508:</strong> U.S. federal accessibility standards</li>
            <li>• <strong>ADA Compliance:</strong> Americans with Disabilities Act</li>
            <li>• <strong>ARIA:</strong> Accessible Rich Internet Applications standards</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

