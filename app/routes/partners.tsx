import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form, useActionData } from "@remix-run/react";
import { ArrowLeft, Handshake, CheckCircle, Mail, Building, Car, MapPin } from "lucide-react";
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
  const company = formData.get("company") as string;
  const partnershipType = formData.get("partnershipType") as string;
  const message = formData.get("message") as string;

  // In a real app, you would send an email or save to database
  console.log("Partnership inquiry:", { name, email, company, partnershipType, message });

  return json({ success: true, message: "Thank you! We'll get back to you soon." });
}

export default function Partners() {
  const actionData = useActionData<typeof action>();
  const [formSubmitted, setFormSubmitted] = useState(false);

  if (actionData?.success) {
    setTimeout(() => setFormSubmitted(true), 100);
  }

  const partnershipTypes = [
    {
      icon: Building,
      title: "Property Partners",
      description: "Hotels, resorts, guesthouses, and other accommodation providers",
      benefits: [
        "Reach thousands of travelers",
        "Easy booking management",
        "Marketing support",
        "Competitive commission rates",
      ],
    },
    {
      icon: Car,
      title: "Vehicle Partners",
      description: "Car rental companies and vehicle owners",
      benefits: [
        "Access to large customer base",
        "Automated booking system",
        "Payment processing",
        "24/7 customer support",
      ],
    },
    {
      icon: MapPin,
      title: "Tour Guide Partners",
      description: "Experienced tour guides and travel agencies",
      benefits: [
        "Profile visibility",
        "Direct bookings",
        "Review system",
        "Marketing assistance",
      ],
    },
  ];

  const existingPartners = [
    { name: "Serena Hotels", type: "Hospitality", logo: "/partners/serena.png" },
    { name: "Pearl Continental", type: "Hospitality", logo: "/partners/pc.png" },
    { name: "Hertz Pakistan", type: "Car Rental", logo: "/partners/hertz.png" },
    { name: "Pakistan Tourism", type: "Tour Operator", logo: "/partners/ptdc.png" },
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
              <Handshake className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Partnerships</h1>
            <p className="text-xl text-white/90">
              Join forces with FindoTrip and grow your business while helping travelers discover amazing experiences.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Partner */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Why Partner With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnershipTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#01502E]/10 rounded-full p-4">
                      <Icon className="w-8 h-8 text-[#01502E]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{type.title}</h3>
                  <p className="text-gray-600 mb-4 text-center">{type.description}</p>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-[#01502E] mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Partners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Partners</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            We're proud to work with leading brands and businesses across Pakistan's travel industry.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {existingPartners.map((partner, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center hover:shadow-lg transition"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <Building className="w-12 h-12 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 text-center mb-1">{partner.name}</h4>
                <p className="text-sm text-gray-600 text-center">{partner.type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership Form */}
        <div className="bg-white rounded-lg shadow-md p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Become a Partner</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Interested in partnering with FindoTrip? Fill out the form below and our partnership team will get in touch.
          </p>

          {formSubmitted || actionData?.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Thank You!</h3>
              <p className="text-green-800">
                {actionData?.message || "We've received your partnership inquiry and will get back to you soon."}
              </p>
            </div>
          ) : (
            <Form method="post" className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input id="name" name="name" type="text" required />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input id="company" name="company" type="text" required />
                </div>
                <div>
                  <Label htmlFor="partnershipType">Partnership Type *</Label>
                  <Select name="partnershipType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Property Partner</SelectItem>
                      <SelectItem value="vehicle">Vehicle Partner</SelectItem>
                      <SelectItem value="tour">Tour Guide Partner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="message">Tell Us About Your Business *</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  placeholder="Please provide details about your business, services, and why you'd like to partner with FindoTrip..."
                />
              </div>
              <div className="flex justify-center">
                <Button type="submit" className="bg-[#01502E] hover:bg-[#013d23] text-white px-8 py-3">
                  Submit Partnership Inquiry
                </Button>
              </div>
            </Form>
          )}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Have Questions?</h3>
          <p className="text-gray-700 mb-4">
            Reach out to our partnership team directly
          </p>
          <a
            href="mailto:partners@findotrip.com"
            className="inline-flex items-center gap-2 text-[#01502E] font-semibold hover:underline"
          >
            <Mail className="w-5 h-5" />
            partners@findotrip.com
          </a>
        </div>
      </div>
    </div>
  );
}

