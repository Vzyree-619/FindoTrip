import { Link } from '@remix-run/react';
import { 
  FaFacebookF, 
  FaInstagram, 
  FaXTwitter, 
  FaYoutube, 
  FaLinkedin,
  FaTiktok,
  FaWhatsapp,
  FaTelegram
} from 'react-icons/fa6';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Shield,
  Award,
  Users,
  Globe,
  Heart,
  Star,
  ChevronRight
} from 'lucide-react';

import { useRouteLoaderData } from '@remix-run/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  // Pull user from root loader if available (NavBarWithAuth already uses it)
  // Fallback: hide consumer links when any provider role is detected in path or user context
  const rootData: any = useRouteLoaderData('root');
  const user = rootData?.user;
  const isProvider = user && (user.role === 'PROPERTY_OWNER' || user.role === 'VEHICLE_OWNER' || user.role === 'TOUR_GUIDE');

  const footerSections = [
    {
      title: "Travel Services",
      links: [
        { name: "Hotels & Stays", href: "/accommodations", icon: "🏨" },
        { name: "Car Rentals", href: "/vehicles", icon: "🚗" },
        { name: "Tour Packages", href: "/tours", icon: "🗺️" },
        { name: "Tour Guides", href: "/tours", icon: "👨‍🏫" },
        { name: "Activities", href: "/activities", icon: "🎯" },
        { name: "Flight Booking", href: "/flights", icon: "✈️" },
      ]
    },
    {
      title: "Popular Destinations",
      links: [
        { name: "Northern Areas", href: "/destinations/northern-areas", icon: "🏔️" },
        { name: "Karachi", href: "/destinations/karachi", icon: "🌊" },
        { name: "Lahore", href: "/destinations/lahore", icon: "🏛️" },
        { name: "Islamabad", href: "/destinations/islamabad", icon: "🏛️" },
        { name: "Gilgit-Baltistan", href: "/destinations/gilgit-baltistan", icon: "❄️" },
        { name: "Balochistan", href: "/destinations/balochistan", icon: "🏜️" },
      ]
    },
    {
      title: "Support & Help",
      links: [
        { name: "Help Center", href: "/help", icon: "❓" },
        { name: "Contact Us", href: "/contact", icon: "📞" },
        { name: "Live Chat", href: "/chat", icon: "💬" },
        { name: "Report Issue", href: "/report", icon: "🚨" },
        { name: "Feedback", href: "/feedback", icon: "💭" },
        { name: "Emergency Support", href: "/emergency", icon: "🚑" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about", icon: "🏢" },
        { name: "Our Team", href: "/team", icon: "👥" },
        { name: "Careers", href: "/careers", icon: "💼" },
        { name: "Press & Media", href: "/press", icon: "📰" },
        { name: "Partnerships", href: "/partners", icon: "🤝" },
        { name: "Investor Relations", href: "/investors", icon: "📈" },
      ]
    },
    {
      title: "Legal & Policies",
      links: [
        { name: "Terms of Service", href: "/terms", icon: "📋" },
        { name: "Privacy Policy", href: "/privacy", icon: "🔒" },
        { name: "Cookie Policy", href: "/cookies", icon: "🍪" },
        { name: "Refund Policy", href: "/refund-policy", icon: "💰" },
        { name: "Cancellation Policy", href: "/cancellation-policy", icon: "❌" },
        { name: "User Agreement", href: "/user-agreement", icon: "📝" },
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Travel Blog", href: "/blogs", icon: "📝" },
        { name: "Travel Guides", href: "/guides", icon: "📖" },
        { name: "Travel Tips", href: "/tips", icon: "💡" },
        { name: "Weather Updates", href: "/weather", icon: "🌤️" },
        { name: "Currency Converter", href: "/currency", icon: "💱" },
        { name: "Travel Insurance", href: "/insurance", icon: "🛡️" },
      ]
    }
  ];

  const socialLinks = [
    { name: "Facebook", icon: FaFacebookF, href: "https://facebook.com/findotrip", color: "hover:text-blue-500" },
    { name: "Instagram", icon: FaInstagram, href: "https://instagram.com/findotrip", color: "hover:text-pink-500" },
    { name: "Twitter", icon: FaXTwitter, href: "https://twitter.com/findotrip", color: "hover:text-gray-400" },
    { name: "YouTube", icon: FaYoutube, href: "https://youtube.com/findotrip", color: "hover:text-red-500" },
    { name: "LinkedIn", icon: FaLinkedin, href: "https://linkedin.com/company/findotrip", color: "hover:text-blue-600" },
    { name: "TikTok", icon: FaTiktok, href: "https://tiktok.com/@findotrip", color: "hover:text-black" },
    { name: "WhatsApp", icon: FaWhatsapp, href: "https://wa.me/923001234567", color: "hover:text-green-500" },
    { name: "Telegram", icon: FaTelegram, href: "https://t.me/findotrip", color: "hover:text-blue-400" },
  ];

  const contactInfo = [
    { icon: Phone, text: "+92 300 123 4567", href: "tel:+923001234567" },
    { icon: Mail, text: "info@findotrip.com", href: "mailto:info@findotrip.com" },
    { icon: MapPin, text: "Karachi, Pakistan", href: "/contact" },
    { icon: Clock, text: "24/7 Support", href: "/support" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img 
                src="/FindoTripLogo.png" 
                alt="FindoTrip Logo" 
                className="h-12 w-auto mb-4"
              />
              <h3 className="text-2xl font-bold text-white mb-4">
                FindoTrip
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Pakistan's premier travel platform connecting you with the best accommodations, 
                car rentals, and experienced tour guides for unforgettable adventures.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((contact, index) => {
                const Icon = contact.icon;
                return (
                  <a
                    key={index}
                    href={contact.href}
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  >
                    <Icon className="h-5 w-5 text-[#01502E]" />
                    <span>{contact.text}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-6 w-6 text-[#01502E]" />
                <h3 className="text-xl font-bold">Stay Updated</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Subscribe to our newsletter for exclusive travel deals, destination guides, and special offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
                <button className="px-6 py-3 bg-[#01502E] hover:bg-[#013d23] rounded-lg font-semibold transition-colors flex items-center gap-2">
                  Subscribe
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8 mb-12">
          {(isProvider ? footerSections.filter(s => !['Travel Services','Resources'].includes(s.title)) : footerSections).map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.href}
                      className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
                    >
                      <span className="text-sm">{link.icon}</span>
                      <span className="text-sm group-hover:translate-x-1 transition-transform">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-white/5 rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-[#01502E] rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-1">Secure Booking</h4>
              <p className="text-sm text-gray-300">SSL encrypted payments</p>
            </div>
            <div className="text-center">
              <div className="bg-[#01502E] rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-1">Best Prices</h4>
              <p className="text-sm text-gray-300">Price match guarantee</p>
            </div>
            <div className="text-center">
              <div className="bg-[#01502E] rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-1">24/7 Support</h4>
              <p className="text-sm text-gray-300">Always here to help</p>
            </div>
            <div className="text-center">
              <div className="bg-[#01502E] rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-1">5-Star Rated</h4>
              <p className="text-sm text-gray-300">Trusted by thousands</p>
            </div>
          </div>
        </div>

        {/* Social Media & Bottom */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 ${social.color} group`}
                      aria-label={social.name}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Download Apps */}
            <div className="text-center lg:text-right">
              <h4 className="text-lg font-semibold mb-4">Download Our App</h4>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
                {/* Google Play Store */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.findotrip.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Get it on Google Play"
                    className="h-12 w-auto"
                  />
                </a>
                
                {/* Apple App Store */}
                <a
                  href="https://apps.apple.com/app/findotrip/id123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="Download on the App Store"
                    className="h-12 w-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <span>© {currentYear} FindoTrip. All rights reserved.</span>
              <span>•</span>
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>in Pakistan</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <Link to="/sitemap" className="hover:text-white transition-colors">
                Sitemap
              </Link>
              <Link to="/accessibility" className="hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link to="/languages" className="hover:text-white transition-colors">
                <Globe className="h-4 w-4 inline mr-1" />
                English
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
