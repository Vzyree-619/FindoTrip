import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, TrendingUp, DollarSign, FileText, Mail, Calendar } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Investors() {
  const financialHighlights = [
    { label: "Annual Revenue Growth", value: "150%", period: "YoY" },
    { label: "Active Users", value: "50,000+", period: "Current" },
    { label: "Total Bookings", value: "200,000+", period: "All Time" },
    { label: "Market Share", value: "25%", period: "Pakistan Travel Tech" },
  ];

  const reports = [
    { year: "2024", quarter: "Q1", title: "Q1 2024 Financial Report", url: "/reports/q1-2024.pdf" },
    { year: "2023", quarter: "Q4", title: "Q4 2023 Financial Report", url: "/reports/q4-2023.pdf" },
    { year: "2023", quarter: "Q3", title: "Q3 2023 Financial Report", url: "/reports/q3-2023.pdf" },
    { year: "2023", quarter: "Q2", title: "Q2 2023 Financial Report", url: "/reports/q2-2023.pdf" },
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
            <div className="flex justify-center mb-6">
              <TrendingUp className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Investor Relations</h1>
            <p className="text-xl text-white/90">
              Information for current and prospective investors about FindoTrip's financial performance and growth.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Financial Highlights */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Financial Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {financialHighlights.map((highlight, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
              >
                <div className="text-3xl font-bold text-[#01502E] mb-2">{highlight.value}</div>
                <div className="text-gray-600 mb-1">{highlight.label}</div>
                <div className="text-sm text-gray-500">{highlight.period}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Overview */}
        <div className="mb-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Model</h3>
              <p className="text-gray-700 leading-relaxed">
                FindoTrip operates a marketplace model connecting travelers with accommodation providers, 
                vehicle rental services, and tour guides. We generate revenue through commission fees on 
                successful bookings, subscription services for property owners, and premium listings.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Growth Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                Our growth strategy focuses on expanding our user base, increasing listings across all 
                categories, enhancing technology infrastructure, and entering new markets within Pakistan 
                and eventually South Asia.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Reports */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Financial Reports</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quarter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.quarter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={report.url}
                          className="text-[#01502E] hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          Download PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Investment Opportunities */}
        <div className="mb-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Investment Opportunities</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            FindoTrip is actively seeking strategic investors and partners to support our growth and expansion. 
            We welcome inquiries from venture capital firms, angel investors, and strategic partners who share 
            our vision for transforming travel in Pakistan and South Asia.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What We're Looking For</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Strategic investors with travel industry expertise</li>
                <li>• Partners who can help with market expansion</li>
                <li>• Investors aligned with our long-term vision</li>
                <li>• Capital to accelerate growth and technology</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Invest in FindoTrip</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Rapidly growing market in Pakistan</li>
                <li>• Proven business model with strong unit economics</li>
                <li>• Experienced leadership team</li>
                <li>• Technology-first approach with scalable platform</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-lg shadow-lg p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Interested in Investing?</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Contact our investor relations team to learn more about investment opportunities and request 
            additional financial information.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:investors@findotrip.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#01502E] rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
            >
              <Mail className="w-5 h-5" />
              investors@findotrip.com
            </a>
            <a
              href="tel:+923001234567"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg hover:bg-white/20 transition font-semibold text-lg"
            >
              <Calendar className="w-5 h-5" />
              Schedule a Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

