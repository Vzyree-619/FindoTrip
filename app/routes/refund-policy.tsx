import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="flex items-center text-sm text-gray-600 hover:text-[#01502E] mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12 prose prose-lg max-w-none">
          <h2>1. Overview</h2>
          <p>
            This Refund Policy outlines the terms and conditions under which FindoTrip processes refunds 
            for bookings made through our platform. Refund eligibility and processing times vary depending 
            on the type of service booked and the cancellation policy of the service provider.
          </p>

          <h2>2. General Refund Principles</h2>
          <ul>
            <li>Refunds are processed according to the cancellation policy of each service provider</li>
            <li>Refund eligibility depends on the timing of cancellation and the specific terms of your booking</li>
            <li>Processing fees may apply as outlined in our Terms of Service</li>
            <li>Refunds are processed to the original payment method used for the booking</li>
          </ul>

          <h2>3. Accommodation Bookings</h2>
          
          <h3>3.1 Free Cancellation</h3>
          <p>
            If your booking qualifies for free cancellation (typically within 24-48 hours before check-in), 
            you will receive a full refund minus any processing fees.
          </p>

          <h3>3.2 Partial Refunds</h3>
          <p>
            For bookings with moderate or strict cancellation policies, refunds are calculated based on:
          </p>
          <ul>
            <li>The cancellation policy of the property</li>
            <li>The time remaining until check-in</li>
            <li>Any applicable penalties or fees</li>
          </ul>

          <h3>3.3 No Refund</h3>
          <p>
            Non-refundable bookings cannot be cancelled or refunded. These are clearly marked at the 
            time of booking.
          </p>

          <h2>4. Vehicle Rental Bookings</h2>
          <p>
            Refund policies for vehicle rentals depend on:
          </p>
          <ul>
            <li>The rental company's cancellation policy</li>
            <li>Advance notice provided (typically 24-48 hours)</li>
            <li>Whether the vehicle was already dispatched</li>
          </ul>

          <h2>5. Tour Bookings</h2>
          <p>
            Tour booking refunds are subject to:
          </p>
          <ul>
            <li>The tour guide's cancellation policy</li>
            <li>Minimum group size requirements</li>
            <li>Advance booking notice (typically 24-72 hours)</li>
            <li>Weather or safety-related cancellations (usually full refund)</li>
          </ul>

          <h2>6. Refund Processing Time</h2>
          <p>
            Once a refund is approved:
          </p>
          <ul>
            <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
            <li><strong>Bank Transfers:</strong> 7-14 business days</li>
            <li><strong>Mobile Wallets:</strong> 1-3 business days</li>
            <li><strong>Cash Payments:</strong> Contact customer service for processing</li>
          </ul>

          <h2>7. Service Fees</h2>
          <p>
            The following fees may apply to refunds:
          </p>
          <ul>
            <li><strong>Processing Fee:</strong> 2-5% of the refund amount (varies by payment method)</li>
            <li><strong>Cancellation Fee:</strong> As specified in the service provider's policy</li>
            <li><strong>Currency Conversion:</strong> If refund currency differs from booking currency</li>
          </ul>

          <h2>8. Special Circumstances</h2>
          
          <h3>8.1 Force Majeure</h3>
          <p>
            In cases of natural disasters, pandemics, or other force majeure events, special refund 
            policies may apply. Contact our support team for assistance.
          </p>

          <h3>8.2 Service Provider Cancellation</h3>
          <p>
            If a service provider cancels your booking, you are entitled to a full refund or alternative 
            accommodation/service at no additional cost.
          </p>

          <h3>8.3 Quality Issues</h3>
          <p>
            If you experience significant quality issues with your booking, contact us within 24 hours 
            of check-in or service start. We will investigate and may provide partial or full refunds 
            based on the circumstances.
          </p>

          <h2>9. How to Request a Refund</h2>
          <ol>
            <li>Log in to your FindoTrip account</li>
            <li>Navigate to "My Bookings"</li>
            <li>Select the booking you wish to cancel</li>
            <li>Click "Cancel Booking" and follow the prompts</li>
            <li>Review the refund amount and terms</li>
            <li>Confirm cancellation</li>
          </ol>
          <p>
            Alternatively, contact our customer support team for assistance with refund requests.
          </p>

          <h2>10. Disputes and Appeals</h2>
          <p>
            If you disagree with a refund decision:
          </p>
          <ul>
            <li>Contact our customer support team with booking details</li>
            <li>Provide any relevant documentation (photos, emails, etc.)</li>
            <li>Our team will review your case within 5-7 business days</li>
            <li>You may appeal the decision if you have additional information</li>
          </ul>

          <h2>11. Contact Information</h2>
          <p>
            For refund inquiries or assistance:
          </p>
          <ul>
            <li>Email: refunds@findotrip.com</li>
            <li>Phone: +92 300 123 4567</li>
            <li>Support Hours: 24/7</li>
          </ul>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-0">
              This refund policy is subject to change. Please review it periodically for updates. 
              For specific questions about your booking, please contact our support team.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/"
            className="px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

