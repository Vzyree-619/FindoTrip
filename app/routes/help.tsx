import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Phone, 
  Mail, 
  BookOpen, 
  Shield, 
  CreditCard, 
  MapPin, 
  Car, 
  Hotel, 
  Compass,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Users,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

const helpCategories = [
  {
    title: "Getting Started",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    links: [
      { name: "How to create an account", href: "#account" },
      { name: "How to book accommodation", href: "#booking" },
      { name: "How to rent a vehicle", href: "#vehicle" },
      { name: "How to book a tour", href: "#tour" },
    ]
  },
  {
    title: "Account & Profile",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    links: [
      { name: "Update profile information", href: "#profile" },
      { name: "Change password", href: "#password" },
      { name: "Privacy settings", href: "#privacy" },
      { name: "Delete account", href: "#delete" },
    ]
  },
  {
    title: "Bookings & Payments",
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-50",
    links: [
      { name: "Payment methods", href: "#payment" },
      { name: "Cancellation policy", href: "#cancellation" },
      { name: "Refund process", href: "#refund" },
      { name: "Booking modifications", href: "#modify" },
    ]
  },
  {
    title: "Safety & Security",
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-50",
    links: [
      { name: "Chat safety guidelines", href: "/help/chat-safety" },
      { name: "Report suspicious activity", href: "/report" },
      { name: "Privacy policy", href: "/privacy" },
      { name: "User agreement", href: "/user-agreement" },
    ]
  },
];

const quickLinks = [
  { name: "Report an Issue", href: "/report", icon: AlertCircle, color: "text-red-600" },
  { name: "User Agreement", href: "/user-agreement", icon: FileText, color: "text-blue-600" },
  { name: "Privacy Policy", href: "/privacy", icon: Shield, color: "text-green-600" },
  { name: "Currency Converter", href: "/currency", icon: CreditCard, color: "text-purple-600" },
  { name: "Weather Forecast", href: "/weather", icon: MapPin, color: "text-orange-600" },
];

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is FindoTrip?",
        a: "FindoTrip is Pakistan's premier travel platform connecting travelers with the best accommodations, car rentals, and experienced tour guides for unforgettable adventures across Pakistan."
      },
      {
        q: "How do I create an account?",
        a: "Click on 'Sign Up' in the top right corner, choose your account type (Customer, Property Owner, Vehicle Owner, or Tour Guide), fill in your details, and verify your email address."
      },
      {
        q: "Is FindoTrip free to use?",
        a: "Yes, creating an account and browsing listings is completely free. You only pay when you make a booking. Service providers pay a small commission fee on successful bookings."
      }
    ]
  },
  {
    category: "Bookings",
    questions: [
      {
        q: "How do I book accommodation?",
        a: "Search for properties using the search bar, select your dates and number of guests, choose a room type, and proceed to payment. You'll receive a confirmation email with booking details."
      },
      {
        q: "Can I cancel my booking?",
        a: "Yes, cancellation policies vary by property. Check the cancellation policy before booking. You can cancel from your dashboard under 'My Bookings'. Refunds are processed according to the property's policy."
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept major credit cards, debit cards, and bank transfers. All payments are processed securely through our encrypted payment gateway."
      },
      {
        q: "How do I modify my booking?",
        a: "You can modify bookings (dates, number of guests) from your dashboard if the property allows modifications. Contact the property owner directly or our support team for assistance."
      }
    ]
  },
  {
    category: "Service Providers",
    questions: [
      {
        q: "How do I list my property/vehicle/tour?",
        a: "Sign up as a Property Owner, Vehicle Owner, or Tour Guide. Complete your profile, add your listings with photos and details, and submit for approval. Our team reviews and approves listings within 24-48 hours."
      },
      {
        q: "What are the commission rates?",
        a: "Commission rates vary by service type. Contact our support team or check your dashboard for specific rates. We offer competitive rates and transparent pricing."
      },
      {
        q: "When do I receive payouts?",
        a: "Payouts are processed weekly on Fridays. You'll receive your earnings within 3-5 business days after the payout date to your registered bank account."
      },
      {
        q: "How do I manage my listings?",
        a: "Access your dashboard to manage all your listings, view bookings, update availability, set prices, and communicate with customers through our messaging system."
      }
    ]
  },
  {
    category: "Support",
    questions: [
      {
        q: "How can I contact support?",
        a: "You can reach us via live chat (available 24/7 in your dashboard), email at support@findotrip.com, or phone at +92 300 123 4567. You can also report issues through our Report Issue page."
      },
      {
        q: "What is your response time?",
        a: "We aim to respond to all inquiries within 24 hours. For urgent matters, use our live chat for immediate assistance."
      },
      {
        q: "Where is FindoTrip located?",
        a: "Our headquarters are located in Skardu, Pakistan. We serve customers and service providers across Pakistan."
      }
    ]
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter FAQs based on search
  const filteredFAQs = searchQuery.trim() 
    ? faqs.flatMap(category => 
        category.questions.filter(faq => 
          faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(faq => ({ ...faq, category: category.category }))
      )
    : [];

  // Filter help categories based on search
  const filteredCategories = searchQuery.trim()
    ? helpCategories.filter(category =>
        category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.links.some(link => 
          link.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : helpCategories;

  const hasSearchResults = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-12 h-12 text-[#01502E]" />
            <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Find answers to common questions, learn how to use FindoTrip, and get the support you need
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help articles, FAQs, or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Help Categories */}
        {!hasSearchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {helpCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category.title ? null : category.title)}
              >
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          to={link.href}
                          className="text-sm text-gray-600 hover:text-[#01502E] flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3" />
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}

        {/* Search Results for Categories */}
        {hasSearchResults && filteredCategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Help Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-3">{category.title}</h3>
                      <ul className="space-y-2">
                        {category.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <Link
                              to={link.href}
                              className="text-sm text-gray-600 hover:text-[#01502E] flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              {link.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        {!hasSearchResults && (
          <Card className="mb-12">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={index}
                    to={link.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#01502E] hover:bg-[#01502E]/5 transition-colors"
                  >
                    <Icon className={`w-6 h-6 ${link.color}`} />
                    <span className="text-sm font-medium text-center">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
          </Card>
        )}

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {hasSearchResults ? "Search Results" : "Frequently Asked Questions"}
          </h2>
          
          {hasSearchResults ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Found {filteredFAQs.length + filteredCategories.length} result{(filteredFAQs.length + filteredCategories.length) !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
              {filteredFAQs.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">FAQ Results</h3>
                  {filteredFAQs.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-[#01502E] mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                            <p className="text-gray-600">{faq.a}</p>
                            <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {faq.category}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : null}
              {filteredFAQs.length === 0 && filteredCategories.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">
                      Try different keywords or browse our categories above
                    </p>
                    <Button
                      onClick={() => setSearchQuery("")}
                      className="bg-[#01502E] hover:bg-[#013d23] text-white"
                    >
                      Clear Search
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : (
            <div className="space-y-8">
              {faqs.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#01502E]" />
                    {category.category}
                  </h3>
                  <div className="space-y-4">
                    {category.questions.map((faq, faqIndex) => (
                      <Card key={faqIndex}>
                        <CardContent className="pt-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                          <p className="text-gray-600">{faq.a}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-[#01502E] to-[#013d23] text-white">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
              <p className="text-green-100">
                Our support team is available 24/7 to assist you
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-[#01502E] hover:bg-gray-100"
              >
                <Link to="/dashboard/messages">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Live Chat
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#01502E]"
              >
                <a href="tel:+923001234567">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Support
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#01502E]"
              >
                <a href="mailto:support@findotrip.com">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Us
                </a>
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t border-green-400/30 text-center">
              <p className="text-green-100 text-sm">
                <strong>Address:</strong> Skardu, Pakistan | 
                <strong> Email:</strong> support@findotrip.com | 
                <strong> Phone:</strong> +92 300 123 4567
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

