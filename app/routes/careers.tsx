import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ArrowLeft, MapPin, Clock, Briefcase, Users, Heart, TrendingUp, Zap, Award } from "lucide-react";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Fetch only active and published jobs
  let jobs = [];
  try {
    // Check if job model exists (in case Prisma client needs regeneration)
    if ('job' in prisma && typeof (prisma as any).job?.findMany === 'function') {
      jobs = await (prisma as any).job.findMany({
        where: {
          isActive: true,
          isPublished: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
        orderBy: {
          postedAt: "desc",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    // Return empty array if model doesn't exist yet or on error
    jobs = [];
  }

  return json({ jobs });
}

export default function Careers() {
  const { jobs } = useLoaderData<typeof loader>();

  const benefits = [
    {
      icon: <Heart className="w-8 h-8 text-[#01502E]" />,
      title: "Health & Wellness",
      description: "Comprehensive health insurance and wellness programs",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-[#01502E]" />,
      title: "Career Growth",
      description: "Opportunities for professional development and advancement",
    },
    {
      icon: <Zap className="w-8 h-8 text-[#01502E]" />,
      title: "Flexible Work",
      description: "Remote work options and flexible hours",
    },
    {
      icon: <Award className="w-8 h-8 text-[#01502E]" />,
      title: "Learning Budget",
      description: "Annual budget for courses, conferences, and training",
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
            <h1 className="text-5xl font-bold mb-6">Join the FindoTrip Team</h1>
            <p className="text-xl text-white/90 mb-8">
              Help us revolutionize travel in Pakistan. We're building the future of travel experiences, 
              one adventure at a time.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>50+ Team Members</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Remote & On-site</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                <span>Multiple Openings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Join Us Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Why Join FindoTrip?</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're a fast-growing travel platform with a mission to make travel accessible and enjoyable for everyone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
              >
                <div className="flex justify-center mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Culture Section */}
        <div className="mb-16 bg-white rounded-lg shadow-md p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Culture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation First</h3>
              <p className="text-gray-700 leading-relaxed">
                We encourage creative thinking and innovative solutions. Every team member has a voice, 
                and we value diverse perspectives that drive our platform forward.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Work-Life Balance</h3>
              <p className="text-gray-700 leading-relaxed">
                We believe in sustainable productivity. Flexible hours, remote work options, and generous 
                time off ensure our team stays energized and motivated.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Continuous Learning</h3>
              <p className="text-gray-700 leading-relaxed">
                Growth is at the core of our values. We invest in your development through training, 
                conferences, mentorship, and challenging projects.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Impact-Driven</h3>
              <p className="text-gray-700 leading-relaxed">
                Your work directly impacts thousands of travelers. We're building tools that make travel 
                planning easier, more accessible, and more enjoyable for everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Open Positions Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're always looking for talented individuals to join our team. Check out our current openings below.
            </p>
          </div>

          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Positions</h3>
                <p className="text-gray-600">
                  We don't have any open positions at the moment, but we're always interested in hearing from talented individuals.
                </p>
              </div>
            ) : (
              jobs.map((job) => {
                const applicationUrl = job.applicationUrl || `mailto:${job.applicationEmail}?subject=Application for ${encodeURIComponent(job.title)}`;
                const isEmailLink = applicationUrl.startsWith('mailto:');
                
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </span>
                          {job.salaryRange && (
                            <span className="text-[#01502E] font-semibold">
                              {job.salaryRange}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{job.description}</p>
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Key Requirements:</h4>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {job.requirements.slice(0, 3).map((req, idx) => (
                                <li key={idx}>{req}</li>
                              ))}
                              {job.requirements.length > 3 && (
                                <li className="text-gray-500">+{job.requirements.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isEmailLink ? (
                          <a
                            href={applicationUrl}
                            className="inline-block px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
                          >
                            Apply Now
                          </a>
                        ) : (
                          <a
                            href={applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
                          >
                            Apply Now
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* How to Apply Section */}
        <div className="bg-white rounded-lg shadow-md p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">How to Apply</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Role</h3>
                <p className="text-gray-700">
                  Browse our open positions above and find the role that matches your skills and interests.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Your Application</h3>
                <p className="text-gray-700">
                  Click "Apply Now" on the position you're interested in, or email us at{" "}
                  <a href="mailto:careers@findotrip.com" className="text-[#01502E] font-semibold hover:underline">
                    careers@findotrip.com
                  </a>
                  {" "}with your resume and cover letter.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Process</h3>
                <p className="text-gray-700">
                  Our team will review your application and reach out if there's a good fit. 
                  The interview process typically includes a phone screen, technical assessment (if applicable), 
                  and team interviews.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#01502E] text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join the Team</h3>
                <p className="text-gray-700">
                  If selected, you'll receive an offer and join our onboarding process. 
                  We'll help you get set up and introduce you to the team!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* General Application Section */}
        <div className="mt-12 bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Don't See a Role That Fits?</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            We're always interested in hearing from talented individuals. Send us your resume and 
            let us know how you'd like to contribute to FindoTrip.
          </p>
          <a
            href="mailto:careers@findotrip.com?subject=General Application"
            className="inline-block px-8 py-4 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
          >
            Send General Application
          </a>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Have questions about working at FindoTrip?
          </p>
          <a
            href="mailto:careers@findotrip.com"
            className="text-[#01502E] font-semibold hover:underline text-lg"
          >
            careers@findotrip.com
          </a>
        </div>
      </div>
    </div>
  );
}

