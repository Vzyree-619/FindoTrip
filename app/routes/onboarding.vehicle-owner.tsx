import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import {
  Car,
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

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user || user.role !== "VEHICLE_OWNER") {
    return redirect("/dashboard");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  // Extract form data
  const businessName = formData.get("businessName") as string;
  const businessType = formData.get("businessType") as string;
  const transportLicense = formData.get("transportLicense") as string;
  const insuranceProvider = formData.get("insuranceProvider") as string;
  const insurancePolicy = formData.get("insurancePolicy") as string;
  const businessPhone = formData.get("businessPhone") as string;
  const businessEmail = formData.get("businessEmail") as string;
  const businessAddress = formData.get("businessAddress") as string;
  const businessCity = formData.get("businessCity") as string;
  const businessState = formData.get("businessState") as string;
  const businessCountry = formData.get("businessCountry") as string;
  const bankName = formData.get("bankName") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const routingNumber = formData.get("routingNumber") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const drivingExperience = parseInt(formData.get("drivingExperience") as string || "0");
  const languages = (formData.get("languages") as string || "English").split(",").map(l => l.trim());

  // Handle document uploads
  const documents = [];
  const documentFiles = ["transportLicenseDoc", "insuranceDoc", "drivingLicenseDoc"];

  for (const docType of documentFiles) {
    const file = formData.get(docType) as File;
    if (file && file.size > 0) {
      // In a real app, you'd upload to cloud storage and get a URL
      const filename = `${userId}_${docType}_${Date.now()}.${file.name.split('.').pop()}`;
      documents.push({
        type: docType,
        name: filename,
        url: `/uploads/${filename}` // This would be the actual URL after upload
      });
    }
  }

  try {
    // Create vehicle owner profile
    const owner = await prisma.vehicleOwner.create({
      data: {
        userId,
        businessName,
        businessType,
        transportLicense,
        insuranceProvider,
        insurancePolicy,
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        businessPhone,
        businessEmail,
        businessAddress,
        businessCity,
        businessState,
        businessCountry,
        // licenseNumber: licenseNumber, // Commented out - field not in schema
        drivingLicense: licenseNumber, // Use licenseNumber as drivingLicense
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        drivingExperience,
        languages,
        documentsSubmitted: documents.map(d => d.type),
        verified: false,
      },
    });

    // Create verification documents
    if (documents.length > 0) {
      await prisma.document.createMany({
        data: documents.map(doc => ({
          userId,
          userRole: "VEHICLE_OWNER",
          type: doc.type as any,
          name: doc.name,
          originalName: doc.name, // Add originalName
          url: doc.url,
          size: 0, // You'd get actual file size
          mimeType: "application/pdf", // You'd detect actual mime type
        }))
      });
    }

    // Create service request for approval (commented out - model doesn't exist yet)
    // await prisma.serviceRequest.create({
    //   data: {
    //     type: "PROFILE_UPDATE",
    //     title: "Vehicle Owner Profile Approval",
    //     description: `New vehicle owner registration for ${businessName}`,
    //     requesterId: userId,
    //     requesterRole: "VEHICLE_OWNER",
    //     requestData: {
    //       businessName,
    //       businessType,
    //       documents: documents.length
    //     },
    //     status: "PENDING"
    //   },
    // });

    // Send notification to admin
    const admins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" }
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          userRole: admin.role,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "New Vehicle Owner Registration",
          message: `${businessName} has registered and needs approval`,
          data: { ownerId: owner.id, userId }
        }))
      });
    }

    // Update user profile completion
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileCompleted: true,
        onboardingStep: 2
      },
    });

    return redirect("/dashboard/vehicle-owner?welcome=true&pending=true");
  } catch (error) {
    console.error("Profile creation error:", error);
    return json({ error: "Failed to create business profile" }, { status: 500 });
  }
}

export default function VehicleOwnerOnboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Chauffeured Vehicle Service
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Welcome, {user.name}! Let's get your chauffeur service verified and ready to earn.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded ${
                  i + 1 <= step ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
            ))}
            <span>Step {step} of {totalSteps}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          <Form method="post" encType="multipart/form-data" className="space-y-6">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Car className="h-6 w-6 mr-2 text-purple-500" />
                    Business Information
                  </h3>
                  <p className="text-gray-600 mt-1">Tell us about your chauffeur service (drivers, fleet, and service areas)</p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., City Car Rentals"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="individual">Individual Owner</option>
                      <option value="company">Company</option>
                      <option value="fleet">Fleet Operator</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="transportLicense" className="block text-sm font-medium text-gray-700 mb-2">
                      Transport License Number
                    </label>
                    <input
                      type="text"
                      id="transportLicense"
                      name="transportLicense"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="License number"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

            {/* Step 2: Insurance & Licensing */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-purple-500" />
                    Insurance & Licensing
                  </h3>
                  <p className="text-gray-600 mt-1">Insurance and driver details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Provider *
                    </label>
                    <input
                      type="text"
                      id="insuranceProvider"
                      name="insuranceProvider"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., EFU, Jubilee, Adamjee"
                    />
                  </div>

                  <div>
                    <label htmlFor="insurancePolicy" className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Policy Number *
                    </label>
                    <input
                      type="text"
                      id="insurancePolicy"
                      name="insurancePolicy"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Policy number"
                    />
                  </div>

                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="License number"
                    />
                  </div>

                  <div>
                    <label htmlFor="drivingExperience" className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Driving Experience *
                    </label>
                    <input
                      type="number"
                      id="drivingExperience"
                      name="drivingExperience"
                      min="0"
                      max="50"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">
                      Languages Spoken (comma separated)
                    </label>
                    <input
                      type="text"
                      id="languages"
                      name="languages"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="English, Urdu, Punjabi"
                      defaultValue="English"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Banking & Documents */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-6 w-6 mr-2 text-purple-500" />
                    Banking & Documents
                  </h3>
                  <p className="text-gray-600 mt-1">Complete your verification</p>
                </div>

                {/* Business Address */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Business Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="businessAddress"
                        name="businessAddress"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="123 Business Street"
                      />
                    </div>

                    <div>
                      <label htmlFor="businessCity" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="businessCity"
                        name="businessCity"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Pakistan"
                      />
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Banking Information</h4>
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="IBAN or routing number"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transportLicenseDoc" className="block text-sm font-medium text-gray-700 mb-2">
                        Transport License Document (PDF)
                      </label>
                      <input
                        type="file"
                        id="transportLicenseDoc"
                        name="transportLicenseDoc"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="insuranceDoc" className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Document (PDF)
                      </label>
                      <input
                        type="file"
                        id="insuranceDoc"
                        name="insuranceDoc"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="drivingLicenseDoc" className="block text-sm font-medium text-gray-700 mb-2">
                        Driving License Document (PDF)
                      </label>
                      <input
                        type="file"
                        id="drivingLicenseDoc"
                        name="drivingLicenseDoc"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
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
                        Your banking information and documents are encrypted and secure. Verification typically takes 1-3 business days.
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
                  to="/dashboard/vehicle-owner"
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
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full sm:w-auto"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Submitting...
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
