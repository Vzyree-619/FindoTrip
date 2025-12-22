import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Mail, FileText, Calendar, Download } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Press() {
  const pressReleases = [
    {
      date: "2024-01-15",
      title: "FindoTrip Reaches 50,000 Active Users Milestone",
      description: "Pakistan's leading travel platform celebrates major growth milestone with expansion across all major cities.",
      category: "Company News",
    },
    {
      date: "2023-11-20",
      title: "FindoTrip Launches Mobile App for iOS and Android",
      description: "New mobile applications bring seamless booking experience to travelers on the go.",
      category: "Product Launch",
    },
    {
      date: "2023-09-10",
      title: "FindoTrip Partners with Major Hotel Chains",
      description: "Strategic partnerships established with leading hospitality brands across Pakistan.",
      category: "Partnerships",
    },
    {
      date: "2023-06-05",
      title: "FindoTrip Introduces AI-Powered Travel Recommendations",
      description: "Advanced AI technology helps travelers discover personalized travel experiences.",
      category: "Innovation",
    },
  ];

  const mediaKit = {
    logo: "/media/logo.zip",
    brandGuidelines: "/media/brand-guidelines.pdf",
    pressPhotos: "/media/press-photos.zip",
    factSheet: "/media/fact-sheet.pdf",
  };

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
            <h1 className="text-5xl font-bold mb-6">Press & Media</h1>
            <p className="text-xl text-white/90">
              Latest news, press releases, and media resources from FindoTrip.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-[#01502E]" />
            <h2 className="text-2xl font-bold text-gray-900">Media Inquiries</h2>
          </div>
          <p className="text-gray-700 mb-4">
            For media inquiries, interview requests, or press-related questions, please contact our media team.
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Email:</strong>{" "}
              <a href="mailto:press@findotrip.com" className="text-[#01502E] hover:underline">
                press@findotrip.com
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong>{" "}
              <a href="tel:+923001234567" className="text-[#01502E] hover:underline">
                +92 300 123 4567
              </a>
            </p>
          </div>
        </div>

        {/* Press Releases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(release.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-sm bg-[#01502E]/10 text-[#01502E] px-2 py-1 rounded">
                        {release.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{release.title}</h3>
                    <p className="text-gray-700">{release.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media Kit */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Media Kit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#01502E]" />
                <h3 className="text-xl font-semibold text-gray-900">Brand Assets</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Download our logo, brand guidelines, and other visual assets for media use.
              </p>
              <div className="space-y-2">
                <a
                  href={mediaKit.logo}
                  download
                  className="flex items-center gap-2 text-[#01502E] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Logo Package
                </a>
                <a
                  href={mediaKit.brandGuidelines}
                  download
                  className="flex items-center gap-2 text-[#01502E] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Brand Guidelines
                </a>
                <a
                  href={mediaKit.pressPhotos}
                  download
                  className="flex items-center gap-2 text-[#01502E] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Press Photos
                </a>
                <a
                  href={mediaKit.factSheet}
                  download
                  className="flex items-center gap-2 text-[#01502E] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Company Fact Sheet
                </a>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#01502E]" />
                <h3 className="text-xl font-semibold text-gray-900">Company Information</h3>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Founded:</strong> 2020
                </p>
                <p>
                  <strong>Headquarters:</strong> Skardu, Pakistan
                </p>
                <p>
                  <strong>Employees:</strong> 100+
                </p>
                <p>
                  <strong>Active Users:</strong> 50,000+
                </p>
                <p>
                  <strong>Listings:</strong> 2,500+
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* In the News */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">FindoTrip in the News</h2>
          <p className="text-gray-700 mb-4">
            FindoTrip has been featured in various media outlets and publications. Here are some highlights:
          </p>
          <div className="space-y-3 text-gray-700">
            <p>
              • <strong>TechCrunch Pakistan</strong> - "FindoTrip Revolutionizes Travel Booking in Pakistan"
            </p>
            <p>
              • <strong>Dawn Business</strong> - "Local Startup Connects Travelers with Authentic Experiences"
            </p>
            <p>
              • <strong>Express Tribune</strong> - "FindoTrip Reaches Major Milestone in Travel Tech"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

