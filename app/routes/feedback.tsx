import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useActionData, Form } from "@remix-run/react";
import { ArrowLeft, Star, CheckCircle, MessageSquare } from "lucide-react";
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
  const rating = formData.get("rating") as string;
  const category = formData.get("category") as string;
  const feedback = formData.get("feedback") as string;

  // In a real app, you would save to database
  console.log("Feedback submission:", { name, email, rating, category, feedback });

  return json({ success: true, message: "Thank you for your feedback! We appreciate your input." });
}

export default function Feedback() {
  const actionData = useActionData<typeof action>();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [rating, setRating] = useState(0);

  if (actionData?.success) {
    setTimeout(() => setFormSubmitted(true), 100);
  }

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
              <MessageSquare className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Share Your Feedback</h1>
            <p className="text-xl text-white/90">
              Your opinion matters! Help us improve FindoTrip by sharing your thoughts and suggestions.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {formSubmitted || actionData?.success ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-lg text-gray-700 mb-6">
              {actionData?.message || "We've received your feedback and truly appreciate your input."}
            </p>
            <p className="text-gray-600 mb-8">
              Your feedback helps us make FindoTrip better for everyone.
            </p>
            <Button
              onClick={() => {
                setFormSubmitted(false);
                setRating(0);
              }}
              className="bg-[#01502E] hover:bg-[#013d23] text-white"
            >
              Submit Another Feedback
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 lg:p-12">
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
                <Label>Overall Rating *</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input type="hidden" name="rating" value={rating} required />
                {rating === 0 && (
                  <p className="text-sm text-red-600 mt-1">Please select a rating</p>
                )}
              </div>
              <div>
                <Label htmlFor="category">Feedback Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website Experience</SelectItem>
                    <SelectItem value="booking">Booking Process</SelectItem>
                    <SelectItem value="service">Service Quality</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                    <SelectItem value="customer-service">Customer Service</SelectItem>
                    <SelectItem value="suggestions">Suggestions</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="feedback">Your Feedback *</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  rows={8}
                  required
                  placeholder="Please share your thoughts, suggestions, or experiences with FindoTrip..."
                />
              </div>
              <Button
                type="submit"
                disabled={rating === 0}
                className="w-full bg-[#01502E] hover:bg-[#013d23] text-white disabled:bg-gray-300"
              >
                Submit Feedback
              </Button>
            </Form>
          </div>
        )}

        {/* Why Feedback Matters */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Your Feedback Matters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">We Listen</h3>
              <p className="text-gray-700 text-sm">
                Every piece of feedback is reviewed by our team and helps shape the future of FindoTrip.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">We Act</h3>
              <p className="text-gray-700 text-sm">
                Your suggestions directly influence our product roadmap and feature development.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">We Improve</h3>
              <p className="text-gray-700 text-sm">
                Continuous improvement based on user feedback is at the core of what we do.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">We Appreciate</h3>
              <p className="text-gray-700 text-sm">
                Thank you for taking the time to help us build a better platform for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

