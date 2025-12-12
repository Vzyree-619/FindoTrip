import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Linkedin, Mail, Twitter } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Team() {
  const teamMembers = [
    {
      name: "Ahmed Khan",
      role: "CEO & Co-Founder",
      bio: "Visionary leader with 15+ years in tech and travel industry. Passionate about making travel accessible to everyone.",
      image: "/team/ahmed.jpg",
      email: "ahmed@findotrip.com",
      linkedin: "https://linkedin.com/in/ahmedkhan",
      twitter: "https://twitter.com/ahmedkhan",
    },
    {
      name: "Sara Ali",
      role: "CTO & Co-Founder",
      bio: "Tech enthusiast and full-stack developer. Leads our engineering team in building innovative travel solutions.",
      image: "/team/sara.jpg",
      email: "sara@findotrip.com",
      linkedin: "https://linkedin.com/in/saraali",
      twitter: "https://twitter.com/saraali",
    },
    {
      name: "Hassan Malik",
      role: "Head of Operations",
      bio: "Ensures smooth operations and exceptional customer experiences. Expert in process optimization and quality assurance.",
      image: "/team/hassan.jpg",
      email: "hassan@findotrip.com",
      linkedin: "https://linkedin.com/in/hassanmalik",
      twitter: "https://twitter.com/hassanmalik",
    },
    {
      name: "Fatima Sheikh",
      role: "Head of Marketing",
      bio: "Creative marketer with expertise in digital marketing and brand building. Helps travelers discover FindoTrip.",
      image: "/team/fatima.jpg",
      email: "fatima@findotrip.com",
      linkedin: "https://linkedin.com/in/fatimasheikh",
      twitter: "https://twitter.com/fatimasheikh",
    },
    {
      name: "Zain Abbas",
      role: "Head of Customer Success",
      bio: "Dedicated to ensuring every customer has an amazing experience. Leads our support and customer relations team.",
      image: "/team/zain.jpg",
      email: "zain@findotrip.com",
      linkedin: "https://linkedin.com/in/zainabbas",
      twitter: "https://twitter.com/zainabbas",
    },
    {
      name: "Ayesha Raza",
      role: "Head of Product",
      bio: "Product strategist focused on creating intuitive and user-friendly experiences. Drives product innovation.",
      image: "/team/ayesha.jpg",
      email: "ayesha@findotrip.com",
      linkedin: "https://linkedin.com/in/ayesharaza",
      twitter: "https://twitter.com/ayesharaza",
    },
  ];

  const departments = [
    {
      name: "Engineering",
      description: "Building the future of travel technology",
      members: 25,
    },
    {
      name: "Product & Design",
      description: "Creating beautiful and intuitive experiences",
      members: 12,
    },
    {
      name: "Operations",
      description: "Ensuring smooth operations and quality service",
      members: 18,
    },
    {
      name: "Marketing & Growth",
      description: "Spreading the word and growing our community",
      members: 15,
    },
    {
      name: "Customer Success",
      description: "Supporting our users every step of the way",
      members: 20,
    },
    {
      name: "Business Development",
      description: "Building partnerships and expanding our network",
      members: 10,
    },
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
            <h1 className="text-5xl font-bold mb-6">Meet Our Team</h1>
            <p className="text-xl text-white/90">
              A diverse group of passionate individuals working together to revolutionize travel in Pakistan.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Leadership Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Leadership Team</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our leadership team brings together decades of experience in technology, travel, and business 
            to guide FindoTrip's mission.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center"
              >
                <div className="mb-4">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#01502E] to-[#013d23] flex items-center justify-center text-white text-4xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-[#01502E] font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                <div className="flex justify-center gap-3">
                  <a
                    href={`mailto:${member.email}`}
                    className="p-2 bg-gray-100 hover:bg-[#01502E] hover:text-white rounded-lg transition"
                    aria-label={`Email ${member.name}`}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg transition"
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-gray-400 hover:text-white rounded-lg transition"
                    aria-label={`${member.name} Twitter`}
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Our Departments</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're organized into specialized teams, each focused on delivering excellence in their domain.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{dept.name}</h3>
                <p className="text-gray-600 mb-3">{dept.description}</p>
                <p className="text-sm text-[#01502E] font-medium">{dept.members} team members</p>
              </div>
            ))}
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Want to Join Our Team?</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            We're always looking for talented, passionate individuals who share our vision. 
            Check out our open positions and see if there's a role that fits you.
          </p>
          <Link
            to="/careers"
            className="inline-block px-8 py-4 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
          >
            View Open Positions
          </Link>
        </div>
      </div>
    </div>
  );
}

