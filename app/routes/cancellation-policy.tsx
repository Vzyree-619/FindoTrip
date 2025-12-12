import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function CancellationPolicy() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cancellation Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12 prose prose-lg max-w-none">
          <h2>1. Overview</h2>
          <p>
            This Cancellation Policy explains the terms and conditions for cancelling bookings made 
            through FindoTrip. Cancellation policies vary by service type and provider. Please review 
            the specific cancellation terms for your booking before confirming.
          </p>

          <h2>2. Cancellation Policy Types</h2>
          
          <h3>2.1 Free Cancellation</h3>
          <p>
            Bookings with free cancellation can be cancelled without penalty up to a specified time 
            before check-in or service start (typically 24-48 hours).
          </p>
          <ul>
            <li>Full refund minus processing fees</li>
            <li>No cancellation charges</li>
            <li>Must cancel within the free cancellation window</li>
          </ul>

          <h3>2.2 Moderate Cancellation</h3>
          <p>
            Moderate cancellation policies allow free cancellation up to a certain point, after which 
            partial refunds apply.
          </p>
          <ul>
            <li>Free cancellation: 5-7 days before check-in</li>
            <li>50% refund: 2-5 days before check-in</li>
            <li>No refund: Less than 48 hours before check-in</li>
          </ul>

          <h3>2.3 Strict Cancellation</h3>
          <p>
            Strict cancellation policies have limited refund options.
          </p>
          <ul>
            <li>50% refund: 7+ days before check-in</li>
            <li>No refund: Less than 7 days before check-in</li>
          </ul>

          <h3>2.4 Non-Refundable</h3>
          <p>
            Non-refundable bookings cannot be cancelled or modified. These are clearly marked at booking.
          </p>

          <h2>3. Service-Specific Policies</h2>
          
          <h3>3.1 Accommodations</h3>
          <p>
            Each property sets its own cancellation policy. The policy is clearly displayed:
          </p>
          <ul>
            <li>On the property listing page</li>
            <li>During the booking process</li>
            <li>In your booking confirmation email</li>
          </ul>

          <h3>3.2 Vehicle Rentals</h3>
          <p>
            Vehicle rental cancellations typically require:
          </p>
          <ul>
            <li>24-48 hours advance notice for full refund</li>
            <li>Less than 24 hours: 50% refund or credit</li>
            <li>Same-day cancellations: No refund (unless vehicle unavailable)</li>
          </ul>

          <h3>3.3 Tours and Activities</h3>
          <p>
            Tour cancellation policies consider:
          </p>
          <ul>
            <li>Group size requirements</li>
            <li>Weather-dependent activities</li>
            <li>Guide availability</li>
            <li>Typically 24-72 hours advance notice required</li>
          </ul>

          <h2>4. How to Cancel</h2>
          <ol>
            <li>Log in to your FindoTrip account</li>
            <li>Go to "My Bookings"</li>
            <li>Select the booking you want to cancel</li>
            <li>Click "Cancel Booking"</li>
            <li>Review cancellation terms and refund amount</li>
            <li>Confirm cancellation</li>
            <li>You will receive a confirmation email with refund details</li>
          </ol>

          <h2>5. Cancellation Fees</h2>
          <p>
            The following fees may apply:
          </p>
          <ul>
            <li><strong>Service Provider Fee:</strong> As per their cancellation policy</li>
            <li><strong>Platform Processing Fee:</strong> 2-5% of booking amount</li>
            <li><strong>Payment Gateway Fee:</strong> Non-refundable if already processed</li>
          </ul>

          <h2>6. Refund Processing</h2>
          <p>
            After cancellation:
          </p>
          <ul>
            <li>Refund amount is calculated based on cancellation policy</li>
            <li>Refund is processed to original payment method</li>
            <li>Processing time: 5-14 business days depending on payment method</li>
            <li>You will receive email confirmation with refund timeline</li>
          </ul>

          <h2>7. Special Circumstances</h2>
          
          <h3>7.1 Medical Emergencies</h3>
          <p>
            In case of documented medical emergencies, we may offer more flexible cancellation terms. 
            Contact support with medical documentation.
          </p>

          <h3>7.2 Natural Disasters</h3>
          <p>
            If your destination is affected by natural disasters or severe weather, we work with service 
            providers to offer full refunds or alternative dates.
          </p>

          <h3>7.3 Travel Restrictions</h3>
          <p>
            Government-imposed travel restrictions may qualify for special cancellation terms. Contact 
            our support team for assistance.
          </p>

          <h2>8. Modifications vs. Cancellations</h2>
          <p>
            Some bookings can be modified instead of cancelled:
          </p>
          <ul>
            <li>Date changes may be possible (subject to availability)</li>
            <li>Modification fees may apply</li>
            <li>Contact the service provider or our support team</li>
            <li>Modifications are subject to availability and provider approval</li>
          </ul>

          <h2>9. No-Show Policy</h2>
          <p>
            If you do not show up for your booking without cancelling:
          </p>
          <ul>
            <li>No refund will be provided</li>
            <li>Full booking amount is forfeited</li>
            <li>Service provider may charge additional fees</li>
            <li>Contact support immediately if you missed your booking due to extenuating circumstances</li>
          </ul>

          <h2>10. Service Provider Cancellations</h2>
          <p>
            If a service provider cancels your booking:
          </p>
          <ul>
            <li>You will receive a full refund</li>
            <li>We will help you find alternative options</li>
            <li>You may receive compensation or credit for future bookings</li>
            <li>We will notify you immediately via email and phone</li>
          </ul>

          <h2>11. Contact for Cancellations</h2>
          <p>
            For cancellation assistance:
          </p>
          <ul>
            <li>Email: support@findotrip.com</li>
            <li>Phone: +92 300 123 4567 (24/7)</li>
            <li>Live Chat: Available on website and app</li>
            <li>Emergency: Use emergency support for urgent cancellations</li>
          </ul>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Reminders</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Always review cancellation policies before booking</li>
              <li>• Cancel as early as possible to maximize refund eligibility</li>
              <li>• Keep your booking confirmation for reference</li>
              <li>• Contact support immediately for special circumstances</li>
            </ul>
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

