import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Terms() {
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
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12 prose prose-lg max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using FindoTrip ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            FindoTrip is a travel platform that connects travelers with accommodation providers, car rental services, and tour guides. We facilitate bookings and provide a marketplace for travel-related services.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To access certain features of the Service, you must register for an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and up-to-date information</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>

          <h2>4. User Responsibilities</h2>
          <p>As a user of FindoTrip, you agree to:</p>
          <ul>
            <li>Use the Service only for lawful purposes</li>
            <li>Provide accurate information in all communications</li>
            <li>Respect the rights and property of others</li>
            <li>Not engage in any fraudulent or deceptive practices</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h2>5. Booking and Payment Terms</h2>
          <p>
            When you make a booking through FindoTrip:
          </p>
          <ul>
            <li>You enter into a contract directly with the service provider</li>
            <li>Payment is processed securely through our platform</li>
            <li>Cancellation policies vary by provider and are clearly stated</li>
            <li>Refunds are subject to the provider's cancellation policy</li>
          </ul>

          <h2>6. Service Provider Responsibilities</h2>
          <p>
            Service providers (accommodation owners, car providers, tour guides) agree to:
          </p>
          <ul>
            <li>Provide accurate descriptions of their services</li>
            <li>Honor confirmed bookings</li>
            <li>Maintain appropriate licenses and insurance</li>
            <li>Comply with local laws and regulations</li>
            <li>Provide services as described</li>
          </ul>

          <h2>7. Prohibited Activities</h2>
          <p>You may not:</p>
          <ul>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Transmit any harmful or malicious code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Impersonate any person or entity</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by FindoTrip and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>

          <h2>9. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
          </p>

          <h2>10. Disclaimers</h2>
          <p>
            FindoTrip acts as an intermediary between users and service providers. We do not own, operate, or control the accommodations, vehicles, or tour services listed on our platform. We are not responsible for:
          </p>
          <ul>
            <li>The quality, safety, or legality of services provided</li>
            <li>The accuracy of listings or descriptions</li>
            <li>The actions or omissions of service providers</li>
            <li>Any disputes between users and service providers</li>
          </ul>

          <h2>11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, FindoTrip shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless FindoTrip from and against any claims, damages, costs, and expenses arising from your use of the Service or violation of these Terms.
          </p>

          <h2>13. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Pakistan, without regard to its conflict of law provisions.
          </p>

          <h2>16. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@findotrip.com</li>
            <li>Address: FindoTrip Legal Department, Pakistan</li>
          </ul>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-0">
              By using FindoTrip, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
          >
            I Accept - Continue Registration
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
