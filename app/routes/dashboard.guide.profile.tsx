import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Settings, Upload, Save, ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    select: { id: true, name: true, role: true, email: true, phone: true, avatar: true } 
  });
  
  if (!user || user.role !== "TOUR_GUIDE") {
    throw redirect("/dashboard");
  }

  const guide = await prisma.tourGuide.findUnique({
    where: { userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      bio: true,
      languages: true,
      experience: true,
      licenseNumber: true,
      licenseExpiry: true,
      licenseDocument: true,
      idDocument: true,
      emergencyContact: true,
      emergencyPhone: true,
      verified: true,
      createdAt: true,
    }
  });

  return json({ user, guide });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const bio = formData.get("bio") as string;
  const languages = formData.get("languages") as string;
  const experience = formData.get("experience") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const licenseExpiry = formData.get("licenseExpiry") as string;
  const emergencyContact = formData.get("emergencyContact") as string;
  const emergencyPhone = formData.get("emergencyPhone") as string;

  try {
    // Update tour guide profile
    await prisma.tourGuide.upsert({
      where: { userId },
      update: {
        firstName,
        lastName,
        email,
        phone,
        bio,
        languages: languages ? languages.split(",").map(l => l.trim()) : [],
        experience: experience ? parseInt(experience) : 0,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        emergencyContact,
        emergencyPhone,
        // Reset verification if license details changed
        verified: false,
      },
      create: {
        userId,
        firstName,
        lastName,
        email,
        phone,
        bio,
        languages: languages ? languages.split(",").map(l => l.trim()) : [],
        experience: experience ? parseInt(experience) : 0,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        emergencyContact,
        emergencyPhone,
        verified: false,
      }
    });

    return json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    return json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

export default function TourGuideProfile() {
  const { user, guide } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard/guide" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Update Profile</h1>
          <p className="text-gray-600 mt-2">Update your tour guide license and personal information</p>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 flex items-center gap-2 text-green-800">
            <Save className="w-5 h-5" /> {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 flex items-center gap-2 text-red-800">
            <Settings className="w-5 h-5" /> {actionData.error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tour Guide Information</h2>
            <p className="text-sm text-gray-600 mt-1">Update your personal and professional details</p>
          </div>

          <Form method="post" className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  defaultValue={guide?.firstName || ""}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  defaultValue={guide?.lastName || ""}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  defaultValue={guide?.email || user.email}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  defaultValue={guide?.phone || user.phone || ""}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                id="bio"
                rows={4}
                defaultValue={guide?.bio || ""}
                placeholder="Tell us about yourself and your experience as a tour guide..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">
                  Languages (comma separated)
                </label>
                <input
                  type="text"
                  name="languages"
                  id="languages"
                  defaultValue={guide?.languages?.join(", ") || ""}
                  placeholder="English, Urdu, Punjabi"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  id="experience"
                  min="0"
                  max="50"
                  defaultValue={guide?.experience || 0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>

            {/* License Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    id="licenseNumber"
                    required
                    defaultValue={guide?.licenseNumber || ""}
                    placeholder="TG-2024-001"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                    License Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    id="licenseExpiry"
                    required
                    defaultValue={guide?.licenseExpiry ? new Date(guide.licenseExpiry).toISOString().split('T')[0] : ""}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <Settings className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      License Document Upload
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please upload your tour guide license document. This will be reviewed by our team for verification.</p>
                      <div className="mt-3">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload License Document
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    id="emergencyContact"
                    defaultValue={guide?.emergencyContact || ""}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    id="emergencyPhone"
                    defaultValue={guide?.emergencyPhone || ""}
                    placeholder="+92 300 1234567"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#01502E] hover:bg-[#013d23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01502E]"
              >
                <Save className="w-5 h-5 mr-2" />
                Update Profile
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
