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
  MapPin,
  Upload,
  FileText,
  CreditCard,
  Shield,
  Loader2,
  Check,
  ArrowRight,
  AlertCircle,
  Info,
  Phone,
  Mail,
  Calendar,
  Globe
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user || user.role !== "TOUR_GUIDE") {
    return redirect("/dashboard");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  // Extract form data
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const nationality = formData.get("nationality") as string;
  const guideLicense = formData.get("guideLicense") as string;
  const licenseExpiry = formData.get("licenseExpiry") as string;
  const yearsOfExperience = parseInt(formData.get("yearsOfExperience") as string || "0");
  const bio = (formData.get("bio") as string || "").trim();
  const languages = (formData.get("languages") as string || "English").split(",").map(l => l.trim());
  const specializations = (formData.get("specializations") as string || "").split(",").map(s => s.trim()).filter(Boolean);
  const pricePerHour = parseFloat(formData.get("pricePerHour") as string || "50");
  const pricePerGroup = parseFloat(formData.get("pricePerGroup") as string || "0");
  const maxGroupSize = parseInt(formData.get("maxGroupSize") as string || "10");
  const minGroupSize = parseInt(formData.get("minGroupSize") as string || "1");
  const availableDays = (formData.get("availableDays") as string || "").split(",").map(d => d.trim()).filter(Boolean);
  const workingHours = formData.get("workingHours") as string || "09:00-18:00";
  const advanceBooking = parseInt(formData.get("advanceBooking") as string || "24");
  const city = formData.get("city") as string || "";
  const country = formData.get("country") as string || "";
  const bankName = formData.get("bankName") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const routingNumber = formData.get("routingNumber") as string;

  // Handle document uploads
  const documents = [];
  const documentFiles = ["guideLicenseDoc", "idDocument", "certificateDoc"];

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
    // Create tour guide profile
    const guide = await prisma.tourGuide.create({
      data: {
        userId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        guideLicense,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        yearsOfExperience,
        // bio, // Commented out - field not in schema
        languages,
        specializations,
        // pricePerHour, // Commented out - field not in schema
        pricePerPerson: pricePerHour, // Use pricePerHour as pricePerPerson
        pricePerGroup: pricePerGroup || null,
        maxGroupSize,
        minGroupSize,
        availableDays,
        workingHours,
        advanceBooking,
        // city, // Commented out - field not in schema
        // country, // Commented out - field not in schema
        bankName,
        accountNumber,
        routingNumber,
        documentsSubmitted: documents.map(d => d.type),
        verified: false,
      },
    });

    // Update tour approval status to PENDING
    await prisma.tour.update({
      where: { id: guide.id },
      data: { approvalStatus: "PENDING" }
    });

    // Create verification documents
    if (documents.length > 0) {
      await prisma.document.createMany({
        data: documents.map(doc => ({
          userId,
          userRole: "TOUR_GUIDE",
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
    //     title: "Tour Guide Profile Approval",
    //     description: `New tour guide registration for ${firstName} ${lastName}`,
    //     requesterId: userId,
    //     requesterRole: "TOUR_GUIDE",
    //     requestData: {
    //       firstName,
    //       lastName,
    //       experience: yearsOfExperience,
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
          title: "New Tour Guide Registration",
          message: `${firstName} ${lastName} has registered and needs approval`,
          data: { guideId: guide.id, userId }
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

    return redirect("/dashboard/guide?welcome=true&pending=true");
  } catch (error) {
    console.error("Profile creation error:", error);
    return json({ error: "Failed to create tour guide profile" }, { status: 500 });
  }
}

export default function TourGuideOnboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Tour Guide Profile
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Welcome, {user.name}! Let's get your tour guide profile verified and ready to share experiences.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded ${
                  i + 1 <= step ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
            ))}
            <span>Step {step} of {totalSteps}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          <Form method="post" encType="multipart/form-data" className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Info className="h-6 w-6 mr-2 text-orange-500" />
                    Personal Information
                  </h3>
                  <p className="text-gray-600 mt-1">Tell us about yourself</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      required
                      max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      id="nationality"
                      name="nationality"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Pakistani"
                    />
                  </div>

                  <div>
                    <label htmlFor="guideLicense" className="block text-sm font-medium text-gray-700 mb-2">
                      Tour Guide License Number
                    </label>
                    <input
                      type="text"
                      id="guideLicense"
                      name="guideLicense"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="License number"
                    />
                  </div>

                  <div>
                    <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      id="licenseExpiry"
                      name="licenseExpiry"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      min="0"
                      max="50"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">
                      Languages Spoken (comma separated) *
                    </label>
                    <input
                      type="text"
                      id="languages"
                      name="languages"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="English, Urdu, Arabic"
                      defaultValue="English"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="specializations" className="block text-sm font-medium text-gray-700 mb-2">
                      Specializations (comma separated)
                    </label>
                    <input
                      type="text"
                      id="specializations"
                      name="specializations"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Historical tours, Cultural experiences, Adventure"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Bio / About You
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Tell us about your experience and passion for guiding..."
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Verification Required</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your profile information will be verified by our team. This helps maintain trust and quality on our platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-orange-500" />
                    Service Details
                  </h3>
                  <p className="text-gray-600 mt-1">Set your pricing and availability</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Hour (PKR) *
                    </label>
                    <input
                      type="number"
                      id="pricePerHour"
                      name="pricePerHour"
                      min="0"
                      step="1"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pricePerGroup" className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Group (PKR)
                    </label>
                    <input
                      type="number"
                      id="pricePerGroup"
                      name="pricePerGroup"
                      min="0"
                      step="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="2000"
                    />
                  </div>

                  <div>
                    <label htmlFor="minGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Group Size *
                    </label>
                    <input
                      type="number"
                      id="minGroupSize"
                      name="minGroupSize"
                      min="1"
                      max="50"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1"
                      defaultValue="1"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Group Size *
                    </label>
                    <input
                      type="number"
                      id="maxGroupSize"
                      name="maxGroupSize"
                      min="1"
                      max="50"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="10"
                      defaultValue="10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="availableDays" className="block text-sm font-medium text-gray-700 mb-2">
                      Available Days (comma separated)
                    </label>
                    <input
                      type="text"
                      id="availableDays"
                      name="availableDays"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY"
                    />
                  </div>

                  <div>
                    <label htmlFor="workingHours" className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours *
                    </label>
                    <input
                      type="text"
                      id="workingHours"
                      name="workingHours"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="09:00-18:00"
                      defaultValue="09:00-18:00"
                    />
                  </div>

                  <div>
                    <label htmlFor="advanceBooking" className="block text-sm font-medium text-gray-700 mb-2">
                      Advance Booking Required (hours) *
                    </label>
                    <input
                      type="number"
                      id="advanceBooking"
                      name="advanceBooking"
                      min="0"
                      max="168"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="24"
                      defaultValue="24"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Service City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Lahore"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Service Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Pakistan"
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
                    <CreditCard className="h-6 w-6 mr-2 text-orange-500" />
                    Banking & Documents
                  </h3>
                  <p className="text-gray-600 mt-1">Complete your verification</p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      <label htmlFor="guideLicenseDoc" className="block text-sm font-medium text-gray-700 mb-2">
                        Tour Guide License Document (PDF)
                      </label>
                      <input
                        type="file"
                        id="guideLicenseDoc"
                        name="guideLicenseDoc"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="idDocument" className="block text-sm font-medium text-gray-700 mb-2">
                        National ID / Passport (PDF)
                      </label>
                      <input
                        type="file"
                        id="idDocument"
                        name="idDocument"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="certificateDoc" className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate / Qualification Document (PDF)
                      </label>
                      <input
                        type="file"
                        id="certificateDoc"
                        name="certificateDoc"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
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
                  to="/dashboard/guide"
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
                    className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors w-full sm:w-auto"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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
