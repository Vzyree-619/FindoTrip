import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { AlertTriangle, CheckCircle, Send, FileText, User, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const user = await getUser(request);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const category = formData.get("category") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string || "MEDIUM";

  // Validation
  if (!name || !email || !category || !subject || !description) {
    return json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  try {
    // Create support ticket or issue report
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `ISSUE${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        title: subject,
        description: `Category: ${category}\n\n${description}`,
        category: category as any,
        priority: priority as any,
        status: "NEW",
        providerId: user?.id || null,
        // Store reporter info in systemData
        systemData: {
          reporterName: name,
          reporterEmail: email,
          reportedVia: "public_report_page",
        },
      },
      include: {
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create initial system message
    if (user) {
      await prisma.supportMessage.create({
        data: {
          content: `Issue report created: ${subject}`,
          type: "SYSTEM",
          ticketId: ticket.id,
          senderId: user.id,
          systemData: {
            action: "issue_reported",
            category,
            priority,
          },
        },
      });
    }

    return json({
      success: true,
      message: "Your issue has been reported successfully. We'll get back to you soon!",
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    console.error("Error creating issue report:", error);
    return json(
      { error: "Failed to submit your report. Please try again later." },
      { status: 500 }
    );
  }
}

export default function ReportPage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-10 h-10 text-[#01502E]" />
            <h1 className="text-4xl font-bold text-gray-900">Report an Issue</h1>
          </div>
          <p className="text-gray-600 text-lg">
            We're here to help! Report any issues, bugs, or problems you've encountered.
          </p>
        </div>

        {/* Success Message */}
        {actionData?.success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Report Submitted Successfully!</h3>
                  <p className="text-green-800 text-sm mb-2">{actionData.message}</p>
                  {actionData.ticketNumber && (
                    <p className="text-green-700 text-sm font-mono">
                      Ticket Number: <strong>{actionData.ticketNumber}</strong>
                    </p>
                  )}
                  <p className="text-green-700 text-sm mt-2">
                    Please save this ticket number for reference. Our support team will contact you soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {actionData?.error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-red-800 text-sm">{actionData.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Issue Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      defaultValue={user?.name || ""}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      defaultValue={user?.email || ""}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Issue Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Issue Information
                </h3>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <input type="hidden" name="category" id="category-value" defaultValue="TECHNICAL_SUPPORT" />
                  <Select defaultValue="TECHNICAL_SUPPORT" onValueChange={(value) => {
                    const hiddenInput = document.getElementById('category-value') as HTMLInputElement;
                    if (hiddenInput) hiddenInput.value = value;
                  }}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICAL_SUPPORT">Technical Issue</SelectItem>
                      <SelectItem value="ACCOUNT_ISSUES">Account Problem</SelectItem>
                      <SelectItem value="PAYMENT_ISSUES">Payment Issue</SelectItem>
                      <SelectItem value="BOOKING_ISSUES">Booking Problem</SelectItem>
                      <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                      <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                      <SelectItem value="POLICY_QUESTIONS">Policy Question</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <input type="hidden" name="priority" id="priority-value" defaultValue="MEDIUM" />
                  <Select defaultValue="MEDIUM" onValueChange={(value) => {
                    const hiddenInput = document.getElementById('priority-value') as HTMLInputElement;
                    if (hiddenInput) hiddenInput.value = value;
                  }}>
                    <SelectTrigger id="priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low - General inquiry</SelectItem>
                      <SelectItem value="MEDIUM">Medium - Needs attention</SelectItem>
                      <SelectItem value="HIGH">High - Urgent issue</SelectItem>
                      <SelectItem value="CRITICAL">Critical - Immediate action needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    rows={8}
                    placeholder="Please provide detailed information about the issue you're experiencing. Include steps to reproduce, error messages, screenshots (if applicable), and any other relevant details."
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The more details you provide, the faster we can help you.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  * Required fields
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#01502E] hover:bg-[#013d23] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Send className="w-4 h-4 animate-pulse" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Need Immediate Help?</h3>
                <p className="text-blue-800 text-sm mb-3">
                  For urgent issues, you can also contact us directly:
                </p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Email:</strong> support@findotrip.com</p>
                  <p><strong>Phone:</strong> +92 XXX XXXXXXX</p>
                  <p><strong>Live Chat:</strong> Available 24/7 in your dashboard</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

