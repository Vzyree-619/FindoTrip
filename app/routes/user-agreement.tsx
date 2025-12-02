import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { FileText, CheckCircle, Shield, Users, AlertCircle } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function UserAgreement() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-[#01502E]" />
            <h1 className="text-4xl font-bold text-gray-900">User Agreement</h1>
          </div>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Agreement Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#01502E]" />
                  Introduction
                </h2>
                <p className="text-gray-700 mb-4">
                  Welcome to FindoTrip. This User Agreement ("Agreement") governs your access to and use of the FindoTrip platform, 
                  including our website, mobile applications, and services (collectively, the "Service"). By accessing or using 
                  our Service, you agree to be bound by this Agreement.
                </p>
                <p className="text-gray-700">
                  If you do not agree to these terms, please do not use our Service. We may update this Agreement from time to time, 
                  and your continued use of the Service after such changes constitutes acceptance of the updated terms.
                </p>
              </section>

              {/* Account Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#01502E]" />
                  Account Terms
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Creation</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>You must be at least 18 years old to create an account</li>
                      <li>You must provide accurate, current, and complete information</li>
                      <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                      <li>You are responsible for all activities that occur under your account</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Types</h3>
                    <p className="text-gray-700 mb-2">
                      FindoTrip offers different account types:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li><strong>Customer:</strong> For booking accommodations, vehicles, and tours</li>
                      <li><strong>Property Owner:</strong> For listing and managing properties</li>
                      <li><strong>Vehicle Owner:</strong> For listing and managing vehicle rentals</li>
                      <li><strong>Tour Guide:</strong> For offering tour packages and experiences</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Service Usage */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Usage</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Permitted Use</h3>
                    <p className="text-gray-700 mb-2">
                      You may use our Service for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Browsing and searching for travel services</li>
                      <li>Making legitimate bookings and reservations</li>
                      <li>Communicating with service providers</li>
                      <li>Managing your bookings and account</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Prohibited Activities</h3>
                    <p className="text-gray-700 mb-2">
                      You agree not to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Use the Service for any illegal or unauthorized purpose</li>
                      <li>Violate any laws, regulations, or third-party rights</li>
                      <li>Interfere with or disrupt the Service or servers</li>
                      <li>Attempt to gain unauthorized access to any part of the Service</li>
                      <li>Transmit any viruses, malware, or harmful code</li>
                      <li>Harvest or collect information about other users</li>
                      <li>Impersonate any person or entity</li>
                      <li>Post false, misleading, or fraudulent content</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Bookings and Payments */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Bookings and Payments</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Terms</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>All bookings are subject to availability and confirmation</li>
                      <li>Service providers reserve the right to refuse service</li>
                      <li>Prices are subject to change until booking is confirmed</li>
                      <li>You are responsible for reviewing all booking details before confirmation</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Terms</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Payment is required at the time of booking confirmation</li>
                      <li>We accept various payment methods as displayed during checkout</li>
                      <li>All prices are displayed in the selected currency</li>
                      <li>Additional fees (taxes, service charges) may apply</li>
                      <li>Refunds are subject to our Refund Policy</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancellation and Refunds</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Cancellation policies vary by service provider</li>
                      <li>Refund eligibility depends on the cancellation policy at time of booking</li>
                      <li>Processing fees may apply to refunds</li>
                      <li>Refunds are processed within 5-10 business days</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Service Provider Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Provider Terms</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Listing Requirements</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>All listings must be accurate and up-to-date</li>
                      <li>You must have legal authority to offer the services listed</li>
                      <li>All required documentation must be provided and verified</li>
                      <li>Listings are subject to approval by FindoTrip administrators</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Standards</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>You must provide services as described in your listings</li>
                      <li>You must honor confirmed bookings</li>
                      <li>You must maintain appropriate licenses and insurance</li>
                      <li>You must comply with all applicable laws and regulations</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Commission and Fees</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>FindoTrip charges a commission on completed bookings</li>
                      <li>Commission rates are disclosed during the registration process</li>
                      <li>Payouts are processed according to our payment schedule</li>
                      <li>Additional fees may apply for premium features</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Reviews and Ratings */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews and Ratings</h2>
                <div className="space-y-4">
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Users may leave reviews and ratings after completing a booking</li>
                    <li>Reviews must be honest, accurate, and based on actual experience</li>
                    <li>False, defamatory, or abusive reviews are prohibited</li>
                    <li>Service providers may respond to reviews</li>
                    <li>FindoTrip reserves the right to remove inappropriate reviews</li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    The Service, including its content, features, and functionality, is owned by FindoTrip and protected by 
                    international copyright, trademark, and other intellectual property laws.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>You may not copy, modify, or distribute any content from the Service without permission</li>
                    <li>You retain ownership of content you submit, but grant FindoTrip a license to use it</li>
                    <li>FindoTrip trademarks and logos may not be used without written permission</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-[#01502E]" />
                  Limitation of Liability
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    FindoTrip acts as a platform connecting customers with service providers. We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>The quality, safety, or legality of services provided by third parties</li>
                    <li>The accuracy of listings or information provided by service providers</li>
                    <li>Disputes between customers and service providers</li>
                    <li>Any damages resulting from the use of services booked through our platform</li>
                  </ul>
                  <p className="text-gray-700">
                    To the maximum extent permitted by law, FindoTrip's liability is limited to the amount you paid for 
                    the specific booking in question.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    We reserve the right to suspend or terminate your account at any time for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Violation of this Agreement</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Abuse of the Service or other users</li>
                    <li>Failure to pay required fees</li>
                  </ul>
                  <p className="text-gray-700">
                    You may terminate your account at any time by contacting our support team. Upon termination, 
                    your right to use the Service will immediately cease.
                  </p>
                </div>
              </section>

              {/* Dispute Resolution */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    If you have a dispute with a service provider, we encourage you to contact them directly. 
                    FindoTrip may assist in resolving disputes but is not obligated to do so.
                  </p>
                  <p className="text-gray-700">
                    Any disputes arising from this Agreement shall be resolved through binding arbitration in 
                    accordance with the laws of Pakistan, unless otherwise required by applicable law.
                  </p>
                </div>
              </section>

              {/* Changes to Agreement */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Agreement</h2>
                <p className="text-gray-700">
                  We may modify this Agreement at any time. Material changes will be notified through email or 
                  prominent notice on the Service. Your continued use of the Service after changes become effective 
                  constitutes acceptance of the modified Agreement.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about this User Agreement, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@findotrip.com</p>
                  <p><strong>Support:</strong> support@findotrip.com</p>
                  <p><strong>Phone:</strong> +92 XXX XXXXXXX</p>
                  <p><strong>Address:</strong> Skardu, Pakistan</p>
                </div>
              </section>

              {/* Acceptance */}
              <section className="mt-8 pt-6 border-t">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Agreement Acceptance</h3>
                      <p className="text-green-800 text-sm">
                        By using FindoTrip, you acknowledge that you have read, understood, and agree to be bound by 
                        this User Agreement. If you do not agree to these terms, please discontinue use of the Service.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

