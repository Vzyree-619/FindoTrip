import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useActionData, Form } from "@remix-run/react";
import { ArrowLeft, Mail, Phone, MapPin, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const category = formData.get("category") as string;
  const message = formData.get("message") as string;

  // In a real app, you would send an email or save to database
  console.log("Contact form submission:", { name, email, subject, category, message });

  return json({ success: true, message: "Thank you! We'll get back to you within 24 hours." });
}

export default function Contact() {
  const actionData = useActionData<typeof action>();
  const [formSubmitted, setFormSubmitted] = useState(false);

  if (actionData?.success) {
    setTimeout(() => setFormSubmitted(true), 100);
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      details: "info@findotrip.com",
      href: "mailto:info@findotrip.com",
      description: "Send us an email and we'll respond within 24 hours",
    },
    {
      icon: Phone,
      title: "Call Us",
      details: "+92 300 123 4567",
      href: "tel:+923001234567",
      description: "Available 24/7 for urgent inquiries",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: "Skardu, Pakistan",
      href: "/contact",
      description: "Our headquarters in the heart of Skardu",
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: "24/7 Support",
      href: "/contact",
      description: "We're always here to help you",
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
            <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-white/90">
              Have a question or need help? We're here for you 24/7.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-[#01502E]/10 rounded-full p-4">
                    <Icon className="w-6 h-6 text-[#01502E]" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                <a
                  href={method.href}
                  className="text-[#01502E] font-medium hover:underline block mb-2"
                >
                  {method.details}
                </a>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-gray-700 mb-8">
              Fill out the form below and our team will get back to you as soon as possible. 
              For urgent matters, please call us directly.
            </p>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" className="text-[#01502E] hover:underline">
                    Help Center →
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="text-[#01502E] hover:underline">
                    Report an Issue →
                  </Link>
                </li>
                <li>
                  <Link to="/feedback" className="text-[#01502E] hover:underline">
                    Share Feedback →
                  </Link>
                </li>
                <li>
                  <Link to="/emergency" className="text-[#01502E] hover:underline">
                    Emergency Support →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            {formSubmitted || actionData?.success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-700 mb-6">
                  {actionData?.message || "Thank you for contacting us. We'll get back to you within 24 hours."}
                </p>
                <Button
                  onClick={() => setFormSubmitted(false)}
                  className="bg-[#01502E] hover:bg-[#013d23] text-white"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <Form method="post" className="space-y-6">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input id="name" name="name" type="text" required />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="booking">Booking Question</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="media">Media Inquiry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" name="subject" type="text" required />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#01502E] hover:bg-[#013d23] text-white"
                >
                  Send Message
                </Button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

