import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/register"
          className="flex items-center text-sm text-gray-600 hover:text-[#01502E] mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to registration
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12 prose prose-lg max-w-none">
          <h2>1. Introduction</h2>
          <p>
            FindoTrip ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our travel platform and services.
          </p>

          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We collect personal information that you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, and phone number</li>
            <li>Profile information and preferences</li>
            <li>Payment information (processed securely by third-party providers)</li>
            <li>Booking details and travel history</li>
            <li>Reviews and ratings you provide</li>
            <li>Communications with us</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our Service, we automatically collect:</p>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, features used)</li>
            <li>Location information (with your permission)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process bookings and payments</li>
            <li>Communicate with you about your account and bookings</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our services and user experience</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We may share your information with:</p>
          
          <h3>4.1 Service Providers</h3>
          <p>
            We share necessary booking information with accommodation providers, car rental companies, and tour guides to fulfill your reservations.
          </p>

          <h3>4.2 Third-Party Service Providers</h3>
          <p>We work with trusted third parties who help us operate our business:</p>
          <ul>
            <li>Payment processors</li>
            <li>Email service providers</li>
            <li>Analytics providers</li>
            <li>Customer support tools</li>
            <li>Security services</li>
          </ul>

          <h3>4.3 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law, court order, or government regulation, or to protect our rights and safety.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your personal information</li>
            <li>Restrict processing of your information</li>
            <li>Data portability</li>
            <li>Object to processing</li>
            <li>Withdraw consent</li>
          </ul>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser preferences.
          </p>

          <h3>Types of Cookies We Use:</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
            <li><strong>Performance Cookies:</strong> Help us understand how you use our site</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
          </ul>

          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during such transfers.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
          </p>

          <h2>11. Marketing Communications</h2>
          <p>
            We may send you promotional emails about our services, special offers, and travel tips. You can opt out of marketing communications at any time by:
          </p>
          <ul>
            <li>Clicking the unsubscribe link in emails</li>
            <li>Updating your account preferences</li>
            <li>Contacting us directly</li>
          </ul>

          <h2>12. Third-Party Links</h2>
          <p>
            Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
          </p>

          <h2>13. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>14. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <ul>
            <li>Email: privacy@findotrip.com</li>
            <li>Address: FindoTrip Privacy Team, Pakistan</li>
          </ul>

          <h2>15. Data Protection Officer</h2>
          <p>
            For EU residents, you can contact our Data Protection Officer at: dpo@findotrip.com
          </p>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Privacy Matters</h3>
            <p className="text-sm text-blue-800 mb-0">
              We are committed to transparency and giving you control over your personal information. If you have any concerns or questions about how we handle your data, please don't hesitate to reach out to us.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
          >
            I Understand - Continue Registration
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
