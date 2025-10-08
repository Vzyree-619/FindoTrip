import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock,
  MessageSquare,
  Users,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      privacySettings: true,
    },
  });

  return json({ user });
}

export default function ChatSafety() {
  const { user } = useLoaderData<typeof loader>();

  const safetyTips = [
    {
      title: "Never Share Personal Information",
      description: "Don't share your full name, address, phone number, or other personal details in chat.",
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      examples: [
        "❌ Don't share: 'My address is 123 Main St, New York'",
        "✅ Safe: 'I'm located in the downtown area'"
      ]
    },
    {
      title: "Be Wary of Payment Requests",
      description: "Never send money or payment information through chat. Use official payment methods only.",
      icon: <Lock className="h-5 w-5 text-green-500" />,
      examples: [
        "❌ Don't share: Credit card numbers, bank details",
        "✅ Safe: Use official booking and payment systems"
      ]
    },
    {
      title: "Recognize Scam Attempts",
      description: "Watch out for urgent requests, too-good-to-be-true offers, or requests for immediate action.",
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      examples: [
        "❌ Red flags: 'Act now!', 'Limited time offer', 'Send money immediately'",
        "✅ Safe: Normal business communication"
      ]
    },
    {
      title: "Report Suspicious Behavior",
      description: "If someone makes you uncomfortable or violates our terms, report them immediately.",
      icon: <MessageSquare className="h-5 w-5 text-red-500" />,
      examples: [
        "Report: Harassment, spam, inappropriate content",
        "Use the report button in any conversation"
      ]
    }
  ];

  const privacySettings = [
    {
      title: "Control Who Can Message You",
      description: "Manage who can send you messages and when you're available for chat.",
      icon: <Users className="h-5 w-5 text-blue-500" />,
      settings: [
        "Allow/block specific users",
        "Set online status visibility",
        "Enable auto-responses when offline"
      ]
    },
    {
      title: "Manage Your Data",
      description: "You have full control over your chat data and privacy.",
      icon: <FileText className="h-5 w-5 text-green-500" />,
      settings: [
        "Export your chat history",
        "Delete your messages",
        "Control data retention"
      ]
    },
    {
      title: "Security Features",
      description: "Our platform includes multiple security layers to protect you.",
      icon: <Shield className="h-5 w-5 text-purple-500" />,
      settings: [
        "Message encryption",
        "File upload scanning",
        "Rate limiting protection",
        "Abuse detection systems"
      ]
    }
  ];

  const scamExamples = [
    {
      type: "Payment Scams",
      description: "Requests for payment outside the platform",
      examples: [
        "Send money directly to my account",
        "Pay via Western Union or MoneyGram",
        "I need a deposit before we can proceed"
      ],
      warning: "Always use official payment methods"
    },
    {
      type: "Identity Theft",
      description: "Attempts to steal personal information",
      examples: [
        "Can you send me your ID for verification?",
        "I need your social security number",
        "Please provide your bank account details"
      ],
      warning: "Never share sensitive personal information"
    },
    {
      type: "Phishing",
      description: "Fake links or requests for login information",
      examples: [
        "Click this link to verify your account",
        "I need your password to help you",
        "Download this file to continue"
      ],
      warning: "Never click suspicious links or download unknown files"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chat Safety & Security</h1>
          <p className="text-gray-600 mt-2">Learn how to stay safe while using our chat system</p>
        </div>

        {/* Safety Tips */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Safety Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safetyTips.map((tip, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {tip.icon}
                    <span className="ml-2">{tip.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{tip.description}</p>
                  <div className="space-y-2">
                    {tip.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="text-sm">
                        {example}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {privacySettings.map((setting, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {setting.icon}
                    <span className="ml-2">{setting.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{setting.description}</p>
                  <ul className="space-y-2">
                    {setting.settings.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scam Recognition */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recognizing Scams</h2>
          <div className="space-y-6">
            {scamExamples.map((scam, index) => (
              <Card key={index} className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {scam.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{scam.description}</p>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Common Examples:</h4>
                    <ul className="space-y-1">
                      {scam.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="flex items-start text-sm">
                          <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                          <span className="text-red-700">"{example}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800">
                      ⚠️ {scam.warning}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How to Report */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Report Issues</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Report a Message</h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>1. Right-click on the message</li>
                    <li>2. Select "Report" from the menu</li>
                    <li>3. Choose the reason for reporting</li>
                    <li>4. Add any additional details</li>
                    <li>5. Submit the report</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Report a User</h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>1. Go to the user's profile</li>
                    <li>2. Click "Report User"</li>
                    <li>3. Select the violation type</li>
                    <li>4. Provide details about the issue</li>
                    <li>5. Submit the report</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Contacts</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Phone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Emergency</h3>
                  <p className="text-sm text-gray-600">Call 911 for immediate danger</p>
                </div>
                <div className="text-center">
                  <Mail className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Support</h3>
                  <p className="text-sm text-gray-600">support@findotrip.com</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Safety</h3>
                  <p className="text-sm text-gray-600">safety@findotrip.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your privacy and control who can message you.
                </p>
                <Button asChild>
                  <a href="/dashboard/settings/privacy">
                    Manage Privacy Settings
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Export or delete your chat data.
                </p>
                <Button asChild variant="outline">
                  <a href="/dashboard/settings/privacy">
                    Manage Your Data
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Platform Policies</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      <a href="/terms" className="text-blue-600 hover:underline flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="/privacy" className="text-blue-600 hover:underline flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="/community-guidelines" className="text-blue-600 hover:underline flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Community Guidelines
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Safety Resources</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      <a href="https://www.ftc.gov/consumer-protection" className="text-blue-600 hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        FTC Consumer Protection
                      </a>
                    </li>
                    <li>
                      <a href="https://www.ic3.gov" className="text-blue-600 hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Internet Crime Complaint Center
                      </a>
                    </li>
                    <li>
                      <a href="https://www.identitytheft.gov" className="text-blue-600 hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Identity Theft Resources
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            If you have any safety concerns or need immediate assistance, 
            please contact our support team or call emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}
