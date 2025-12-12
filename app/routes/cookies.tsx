import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Cookies() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 lg:p-12 prose prose-lg max-w-none">
          <h2>1. Introduction</h2>
          <p>
            This Cookie Policy explains how FindoTrip ("we," "our," or "us") uses cookies and similar 
            tracking technologies on our website and mobile applications. By using our services, you 
            consent to the use of cookies as described in this policy.
          </p>

          <h2>2. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device (computer, tablet, or mobile) 
            when you visit a website. They are widely used to make websites work more efficiently and 
            provide information to website owners.
          </p>

          <h2>3. Types of Cookies We Use</h2>
          
          <h3>3.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality 
            such as security, network management, and accessibility. You cannot opt-out of these cookies.
          </p>
          <ul>
            <li>Session management cookies</li>
            <li>Authentication cookies</li>
            <li>Security cookies</li>
            <li>Load balancing cookies</li>
          </ul>

          <h3>3.2 Performance Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website by collecting and 
            reporting information anonymously. This helps us improve the way our website works.
          </p>
          <ul>
            <li>Analytics cookies (Google Analytics, etc.)</li>
            <li>Performance monitoring cookies</li>
            <li>Error tracking cookies</li>
          </ul>

          <h3>3.3 Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalization. They may be set by us or by 
            third-party providers whose services we have added to our pages.
          </p>
          <ul>
            <li>Language preference cookies</li>
            <li>User preference cookies</li>
            <li>Chat widget cookies</li>
            <li>Social media integration cookies</li>
          </ul>

          <h3>3.4 Marketing Cookies</h3>
          <p>
            These cookies are used to track visitors across websites to display relevant advertisements. 
            They help us measure the effectiveness of our marketing campaigns.
          </p>
          <ul>
            <li>Advertising cookies</li>
            <li>Retargeting cookies</li>
            <li>Social media advertising cookies</li>
          </ul>

          <h2>4. Third-Party Cookies</h2>
          <p>
            We may use third-party services that set cookies on your device. These include:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> Helps us understand website usage and improve user experience</li>
            <li><strong>Payment Processors:</strong> Secure payment processing requires certain cookies</li>
            <li><strong>Social Media Platforms:</strong> For social sharing and login functionality</li>
            <li><strong>Advertising Networks:</strong> For displaying relevant advertisements</li>
          </ul>

          <h2>5. How to Control Cookies</h2>
          <p>
            You have the right to accept or reject cookies. Most web browsers automatically accept cookies, 
            but you can usually modify your browser settings to decline cookies if you prefer.
          </p>
          
          <h3>Browser Settings</h3>
          <p>You can control cookies through your browser settings:</p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
          </ul>

          <h3>Opt-Out Tools</h3>
          <p>
            You can also opt-out of certain third-party cookies:
          </p>
          <ul>
            <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#01502E] hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
            <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" className="text-[#01502E] hover:underline" target="_blank" rel="noopener noreferrer">NAI Opt-out</a></li>
          </ul>

          <h2>6. Impact of Disabling Cookies</h2>
          <p>
            If you choose to disable cookies, some features of our website may not function properly:
          </p>
          <ul>
            <li>You may not be able to log in to your account</li>
            <li>Booking functionality may be limited</li>
            <li>Personalized content and recommendations may not be available</li>
            <li>Some website features may not work as intended</li>
          </ul>

          <h2>7. Cookie Duration</h2>
          <p>
            Cookies may be either "persistent" or "session" cookies:
          </p>
          <ul>
            <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
            <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
          </ul>

          <h2>8. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, 
            or our operations. We will notify you of any material changes by posting the new policy on this 
            page and updating the "Last updated" date.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about our use of cookies, please contact us:
          </p>
          <ul>
            <li>Email: privacy@findotrip.com</li>
            <li>Address: Skardu, Pakistan</li>
          </ul>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Privacy Matters</h3>
            <p className="text-sm text-blue-800 mb-0">
              We are committed to transparency about our use of cookies and respect your choices. 
              If you have any concerns, please don't hesitate to reach out to us.
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

