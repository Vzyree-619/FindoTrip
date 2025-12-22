import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Users, Target, Heart, Globe, Award, TrendingUp, Shield } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function About() {
  const stats = [
    { label: "Active Users", value: "50,000+", icon: Users },
    { label: "Properties Listed", value: "2,500+", icon: Globe },
    { label: "Happy Travelers", value: "100,000+", icon: Heart },
    { label: "Destinations", value: "50+", icon: Target },
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "We put our customers at the heart of everything we do, ensuring exceptional experiences at every step.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Your security and peace of mind are our top priorities. We maintain the highest standards of safety.",
    },
    {
      icon: Globe,
      title: "Local Expertise",
      description: "We connect you with local experts who know the best places, hidden gems, and authentic experiences.",
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "Every property, vehicle, and tour guide is carefully vetted to ensure the highest quality standards.",
    },
  ];

  const milestones = [
    { year: "2020", title: "Founded", description: "FindoTrip was born with a vision to revolutionize travel in Pakistan." },
    { year: "2021", title: "First 1,000 Users", description: "Reached our first milestone of 1,000 registered users." },
    { year: "2022", title: "Expansion", description: "Expanded to cover all major cities and tourist destinations in Pakistan." },
    { year: "2023", title: "50,000+ Users", description: "Celebrated reaching 50,000 active users and 2,500+ listings." },
    { year: "2024", title: "Innovation", description: "Launched mobile apps and introduced AI-powered travel recommendations." },
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
            <h1 className="text-5xl font-bold mb-6">About FindoTrip</h1>
            <p className="text-xl text-white/90">
              Pakistan's premier travel platform connecting travelers with the best accommodations, 
              car rentals, and experienced tour guides for unforgettable adventures.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
          <div className="bg-white rounded-lg shadow-md p-8 lg:p-12">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              FindoTrip was founded in 2020 with a simple yet powerful mission: to make travel in Pakistan 
              more accessible, enjoyable, and memorable for everyone. We recognized that travelers often 
              struggle to find reliable accommodations, trustworthy car rental services, and experienced 
              local guides who can show them the authentic beauty of Pakistan.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              What started as a small platform has grown into Pakistan's most trusted travel marketplace, 
              connecting thousands of travelers with hundreds of verified properties, vehicles, and tour 
              guides across the country. From the majestic mountains of the Northern Areas to the bustling 
              cities of Karachi and Lahore, we're helping people discover the incredible diversity and 
              beauty of Pakistan.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Today, FindoTrip is more than just a booking platform. We're a community of travel enthusiasts, 
              local experts, and adventure seekers working together to create unforgettable experiences. 
              Our commitment to quality, safety, and customer satisfaction continues to drive everything we do.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
                >
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#01502E]/10 rounded-full p-4">
                      <Icon className="w-8 h-8 text-[#01502E]" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Our Mission & Vision */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-[#01502E]" />
              <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To empower travelers with easy access to quality accommodations, reliable transportation, 
              and authentic local experiences, while supporting local businesses and promoting sustainable 
              tourism in Pakistan.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-[#01502E]" />
              <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To become the leading travel platform in South Asia, recognized for innovation, trust, 
              and our commitment to creating meaningful travel experiences that celebrate the rich 
              culture and natural beauty of Pakistan.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
                >
                  <div className="flex justify-center mb-4">
                    <Icon className="w-10 h-10 text-[#01502E]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#01502E]/20"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                    <div className="text-2xl font-bold text-[#01502E] mb-2">{milestone.year}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-700">{milestone.description}</p>
                  </div>
                  <div className="w-4 h-4 bg-[#01502E] rounded-full border-4 border-white shadow-lg z-10"></div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us on This Journey</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Whether you're a traveler looking for your next adventure, a property owner wanting to 
            reach more guests, or someone passionate about travel, we'd love to have you with us.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
            >
              Start Your Journey
            </Link>
            <Link
              to="/careers"
              className="px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg hover:bg-white/20 transition font-semibold text-lg"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

