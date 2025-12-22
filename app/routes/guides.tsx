import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, MapPin, Calendar, Users, Clock, BookOpen } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Guides() {
  const travelGuides = [
    {
      title: "Northern Areas Travel Guide",
      destination: "Gilgit-Baltistan, Hunza, Skardu",
      description: "Complete guide to exploring Pakistan's stunning northern regions, including best times to visit, must-see attractions, and travel tips.",
      image: "/guides/northern-areas.jpg",
      readTime: "15 min read",
      category: "Adventure",
    },
    {
      title: "Karachi City Guide",
      destination: "Karachi, Sindh",
      description: "Discover the vibrant city of Karachi - from historical sites to modern attractions, food scene, and cultural experiences.",
      image: "/guides/karachi.jpg",
      readTime: "12 min read",
      category: "City",
    },
    {
      title: "Lahore Heritage Tour",
      destination: "Lahore, Punjab",
      description: "Explore the rich history and culture of Lahore, including Mughal architecture, food streets, and traditional bazaars.",
      image: "/guides/lahore.jpg",
      readTime: "10 min read",
      category: "Culture",
    },
    {
      title: "Swat Valley Adventure",
      destination: "Swat, Khyber Pakhtunkhwa",
      description: "Your guide to the beautiful Swat Valley - waterfalls, mountains, and the best outdoor activities.",
      image: "/guides/swat.jpg",
      readTime: "14 min read",
      category: "Nature",
    },
    {
      title: "Islamabad & Margalla Hills",
      destination: "Islamabad, Capital Territory",
      description: "Explore Pakistan's capital city and the scenic Margalla Hills National Park with hiking trails and viewpoints.",
      image: "/guides/islamabad.jpg",
      readTime: "11 min read",
      category: "Nature",
    },
    {
      title: "Balochistan Desert Adventure",
      destination: "Quetta, Balochistan",
      description: "Discover the unique landscapes and culture of Balochistan, from deserts to coastal areas.",
      image: "/guides/balochistan.jpg",
      readTime: "13 min read",
      category: "Adventure",
    },
  ];

  const categories = ["All", "Adventure", "City", "Culture", "Nature", "Beach", "Mountain"];

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
            <div className="flex justify-center mb-6">
              <BookOpen className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Travel Guides</h1>
            <p className="text-xl text-white/90">
              Comprehensive guides to help you plan the perfect trip across Pakistan.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Categories */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className="px-6 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-[#01502E] hover:text-[#01502E] transition font-medium"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {travelGuides.map((guide, index) => (
            <Link
              key={index}
              to={`/guides/${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group"
            >
              <div className="h-48 bg-gradient-to-br from-[#01502E] to-[#013d23] flex items-center justify-center">
                <MapPin className="w-16 h-16 text-white/50" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-[#01502E]/10 text-[#01502E] px-2 py-1 rounded">
                    {guide.category}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#01502E] transition">
                  {guide.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  {guide.destination}
                </div>
                <p className="text-gray-700 text-sm line-clamp-3">{guide.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Personal Guide?</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Connect with experienced local tour guides who can show you the hidden gems and authentic 
            experiences in your destination.
          </p>
          <Link
            to="/tours"
            className="inline-block px-8 py-4 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
          >
            Find a Tour Guide
          </Link>
        </div>
      </div>
    </div>
  );
}

