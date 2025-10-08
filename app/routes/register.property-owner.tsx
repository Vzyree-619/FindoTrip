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
  Building, 
  Upload, 
  FileText, 
  CreditCard, 
  Shield,
  Loader2,
  Check,
  ArrowRight,
  AlertCircle,
  Info,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { generateMeta } from "~/components/common/SEOHead";

export const meta = () => generateMeta({
  title: "Business Setup - Property Owner | FindoTrip",
  description: "Set up your property business and start earning with FindoTrip"
});

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user || user.role !== "PROPERTY_OWNER") {
    return redirect("/dashboard");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const formData = await request.formData();
  
  // Extract form data
  const businessName = formData.get("businessName") as string;
  const businessType = formData.get("businessType") as string;
  const businessLicense = formData.get("businessLicense") as string;
  const taxId = formData.get("taxId") as string;
  const businessPhone = formData.get("businessPhone") as string;
  const businessEmail = formData.get("businessEmail") as string;
  const businessAddress = formData.get("businessAddress") as string;
  const businessCity = formData.get("businessCity") as string;
  const businessState = formData.get("businessState") as string;
  const businessCountry = formData.get("businessCountry") as string;
  const businessPostalCode = formData.get("businessPostalCode") as string;
  const bankName = formData.get("bankName") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const routingNumber = formData.get("routingNumber") as string;

  try {
    // Create property owner profile
    await prisma.propertyOwner.create({
      data: {
        userId,
        businessName,
        businessType,
        businessLicense,
        taxId,
        businessPhone,
        businessEmail,
        businessAddress,
        businessCity,
        businessState,
        businessCountry,
        businessPostalCode,
        bankName,
        accountNumber,
        routingNumber,
      },
    });

    // Create service request for approval
    await prisma.serviceRequest.create({
      data: {
        type: "PROFILE_UPDATE",
        title: "New Property Owner Registration",
        description: `Business registration for ${businessName}`,
        requesterId: userId,
        requesterRole: "PROPERTY_OWNER",
        requestData: {
          businessName,
          businessType,
          businessLicense,
          taxId
        }
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

    return redirect("/dashboard?welcome=true&pending=true");
  } catch (error) {
    console.error("Profile creation error:", error);
    return json({ error: "Failed to create business profile" }, { status: 500 });
  }
}

export default function PropertyOwnerOnboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Property Business
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Welcome, {user.name}! Let's get your property business verified and ready to earn.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded ${
                  i + 1 <= step ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
            <span>Step {step} of {totalSteps}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          <Form method="post" className="space-y-6">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Building className="h-6 w-6 mr-2 text-green-500" />
                    Business Information
                  </h3>
                  <p className="text-gray-600 mt-1">Tell us about your property business</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Sunset Properties Ltd."
                    />
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="individual">Individual Owner</option>
                      <option value="company">Company</option>
                      <option value="partnership">Partnership</option>
                      <option value="chain">Hotel Chain</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-700 mb-2">
                      Business License Number
                    </label>
                    <input
                      type="text"
                      id="businessLicense"
                      name="businessLicense"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="License number"
                    />
                  </div>

                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID / NTN
                    </label>
                    <input
                      type="text"
                      id="taxId"
                      name="taxId"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Tax identification number"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone *
                    </label>
                    <input
                      type="tel"
                      id="businessPhone"
                      name="businessPhone"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+92 XXX XXXXXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      id="businessEmail"
                      name="businessEmail"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Verification Required</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your business information will be verified by our team. This helps maintain trust and quality on our platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Address */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-6 w-6 mr-2 text-green-500" />
                    Business Address
                  </h3>
                  <p className="text-gray-600 mt-1">Where is your business located?</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="businessAddress"
                      name="businessAddress"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123 Business Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="businessCity" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="businessCity"
                        name="businessCity"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Karachi"
                      />
                    </div>

                    <div>
                      <label htmlFor="businessState" className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province
                      </label>
                      <input
                        type="text"
                        id="businessState"
                        name="businessState"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Sindh"
                      />
                    </div>

                    <div>
                      <label htmlFor="businessCountry" className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="businessCountry"
                        name="businessCountry"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Pakistan"
                      />
                    </div>

                    <div>
                      <label htmlFor="businessPostalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="businessPostalCode"
                        name="businessPostalCode"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="75600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Banking Information */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-6 w-6 mr-2 text-green-500" />
                    Banking Information
                  </h3>
                  <p className="text-gray-600 mt-1">How would you like to receive payments?</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., HBL, UBL, MCB"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Account number"
                      />
                    </div>

                    <div>
                      <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        IBAN / Routing Number
                      </label>
                      <input
                        type="text"
                        id="routingNumber"
                        name="routingNumber"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="IBAN or routing number"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Secure & Encrypted</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your banking information is encrypted and secure. You can update this information anytime in your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {actionData?.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{actionData.error}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 gap-4 sm:gap-0">
              <div className="flex items-center space-x-4 order-2 sm:order-1">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Previous
                  </button>
                )}
                <Link
                  to="/dashboard/provider"
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Skip for now
                </Link>
              </div>

              <div className="order-1 sm:order-2">
                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors w-full sm:w-auto"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <Check className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
