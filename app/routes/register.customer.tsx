import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { 
  User, 
  MapPin, 
  Calendar, 
  Heart, 
  Globe, 
  Users, 
  // DollarSign,
  Loader2,
  Check,
  ArrowRight,
  Camera,
  Utensils,
  Mountain,
  Building
} from "lucide-react";
import { generateMeta } from "~/components/common/SEOHead";

export const meta = () => generateMeta({
  title: "Complete Your Profile - Customer | FindoTrip",
  description: "Tell us about your travel preferences to get personalized recommendations"
});

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user || user.role !== "CUSTOMER") {
    return redirect("/dashboard");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const formData = await request.formData();
  
  // Extract form data
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as string;
  const nationality = formData.get("nationality") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;
  const travelStyle = formData.get("travelStyle") as string;
  const budgetRange = formData.get("budgetRange") as string;
  const interests = formData.getAll("interests") as string[];
  const dietaryRestrictions = formData.getAll("dietaryRestrictions") as string[];

  try {
    // Create customer profile
    await prisma.customerProfile.create({
      data: {
        userId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        nationality,
        city,
        country,
        travelStyle,
        budgetRange,
        dietaryRestrictions,
      },
    });

    // Update user profile completion
    await prisma.user.update({
      where: { id: userId },
      data: { 
        profileCompleted: true,
        onboardingStep: 1
      },
    });

    return redirect("/dashboard?welcome=true");
  } catch (error) {
    console.error("Profile creation error:", error);
    return json({ error: "Failed to create profile" }, { status: 500 });
  }
}

export default function CustomerOnboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  const interests = [
    { id: 'adventure', label: 'Adventure Sports', icon: Mountain },
    { id: 'culture', label: 'Cultural Sites', icon: Building },
    { id: 'food', label: 'Food & Dining', icon: Utensils },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'nature', label: 'Nature & Wildlife', icon: Globe },
    { id: 'nightlife', label: 'Nightlife', icon: Users },
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleDietary = (dietary: string) => {
    setSelectedDietary(prev => 
      prev.includes(dietary) 
        ? prev.filter(d => d !== dietary)
        : [...prev, dietary]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.name}!
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Let's personalize your travel experience
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-8 h-1 bg-[#01502E] rounded"></div>
            <span>Step 1 of 1</span>
            <div className="w-8 h-1 bg-gray-300 rounded"></div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Form method="post" className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="e.g., Pakistani"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Karachi"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="e.g., Pakistan"
                />
              </div>
            </div>

            {/* Travel Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="travelStyle" className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Style
                  </label>
                  <select
                    id="travelStyle"
                    name="travelStyle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    <option value="">Select Style</option>
                    <option value="budget">Budget Traveler</option>
                    <option value="comfort">Comfort Seeker</option>
                    <option value="luxury">Luxury Traveler</option>
                    <option value="adventure">Adventure Seeker</option>
                    <option value="family">Family Friendly</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range (per day)
                  </label>
                  <select
                    id="budgetRange"
                    name="budgetRange"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Budget</option>
                    <option value="under-5000">Under PKR 5,000</option>
                    <option value="5000-10000">PKR 5,000 - 10,000</option>
                    <option value="10000-20000">PKR 10,000 - 20,000</option>
                    <option value="20000-50000">PKR 20,000 - 50,000</option>
                    <option value="over-50000">Over PKR 50,000</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What interests you?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interests.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#01502E] bg-[#01502E]/10 text-[#01502E]'
                          : 'border-gray-200 hover:border-[#01502E]'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-[#01502E]' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium">{interest.label}</p>
                      {isSelected && (
                        <input type="hidden" name="interests" value={interest.id} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dietary Restrictions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dietaryOptions.map((dietary) => {
                  const isSelected = selectedDietary.includes(dietary);
                  return (
                    <button
                      key={dietary}
                      type="button"
                      onClick={() => toggleDietary(dietary)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        isSelected
                          ? 'border-[#01502E] bg-[#01502E]/10 text-[#01502E]'
                          : 'border-gray-200 hover:border-[#01502E]'
                      }`}
                    >
                      {dietary}
                      {isSelected && (
                        <input type="hidden" name="dietaryRestrictions" value={dietary} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {actionData?.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{actionData.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Skip for now
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 bg-[#01502E] text-white rounded-lg font-semibold hover:bg-[#013d23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
