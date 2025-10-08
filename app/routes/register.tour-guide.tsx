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
  Globe,
  Users,
  Calendar,
  Award,
  Camera,
  Mountain,
  Building,
  Utensils
} from "lucide-react";
import { generateMeta } from "~/components/common/SEOHead";

export const meta = () => generateMeta({
  title: "Guide Profile Setup - Tour Guide | FindoTrip",
  description: "Set up your tour guide profile and start sharing your expertise with travelers"
});

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

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
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const formData = await request.formData();
  
  // Extract form data
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const nationality = formData.get("nationality") as string;
  const guideLicense = formData.get("guideLicense") as string;
  const licenseExpiry = formData.get("licenseExpiry") as string;
  const yearsOfExperience = formData.get("yearsOfExperience") as string;
  const languages = formData.getAll("languages") as string[];
  const specializations = formData.getAll("specializations") as string[];
  const certifications = formData.getAll("certifications") as string[];
  const serviceAreas = formData.getAll("serviceAreas") as string[];
  const maxGroupSize = formData.get("maxGroupSize") as string;
  const pricePerPerson = formData.get("pricePerPerson") as string;
  const pricePerGroup = formData.get("pricePerGroup") as string;
  const availableDays = formData.getAll("availableDays") as string[];
  const workingHours = formData.get("workingHours") as string;
  const businessPhone = formData.get("businessPhone") as string;
  const businessEmail = formData.get("businessEmail") as string;
  const bankName = formData.get("bankName") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const routingNumber = formData.get("routingNumber") as string;

  try {
    // Create tour guide profile
    await prisma.tourGuide.create({
      data: {
        userId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        guideLicense,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        yearsOfExperience: parseInt(yearsOfExperience),
        languages,
        specializations,
        certifications,
        businessPhone,
        businessEmail,
        serviceAreas,
        maxGroupSize: parseInt(maxGroupSize),
        pricePerPerson: parseFloat(pricePerPerson),
        pricePerGroup: pricePerGroup ? parseFloat(pricePerGroup) : null,
        availableDays,
        workingHours,
        bankName,
        accountNumber,
        routingNumber,
      },
    });

    // Create service request for approval
    await prisma.serviceRequest.create({
      data: {
        type: "PROFILE_UPDATE",
        title: "New Tour Guide Registration",
        description: `Tour guide registration for ${firstName} ${lastName}`,
        requesterId: userId,
        requesterRole: "TOUR_GUIDE",
        requestData: {
          firstName,
          lastName,
          guideLicense,
          yearsOfExperience: parseInt(yearsOfExperience),
          specializations,
          serviceAreas
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
    return json({ error: "Failed to create tour guide profile" }, { status: 500 });
  }
}

export default function TourGuideOnboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [step, setStep] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const totalSteps = 4;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const languageOptions = [
    'English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Arabic', 'Persian', 'Chinese', 'French', 'German', 'Spanish'
  ];

  const specializationOptions = [
    { id: 'adventure', label: 'Adventure Tours', icon: Mountain },
    { id: 'cultural', label: 'Cultural Heritage', icon: Building },
    { id: 'food', label: 'Food & Culinary', icon: Utensils },
    { id: 'photography', label: 'Photography Tours', icon: Camera },
    { id: 'nature', label: 'Nature & Wildlife', icon: Globe },
    { id: 'historical', label: 'Historical Sites', icon: Building },
    { id: 'religious', label: 'Religious Tours', icon: Building },
    { id: 'shopping', label: 'Shopping Tours', icon: Building }
  ];

  const certificationOptions = [
    'Licensed Tour Guide', 'First Aid Certified', 'Wilderness Guide', 'Cultural Heritage Expert', 
    'Language Interpreter', 'Adventure Sports Instructor', 'Photography Guide', 'Hospitality Certified'
  ];

  const serviceAreaOptions = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
    'Gilgit-Baltistan', 'Hunza Valley', 'Skardu', 'Murree', 'Nathia Gali', 'Swat', 'Chitral'
  ];

  const dayOptions = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];

  const toggleSelection = (item: string, selected: string[], setSelected: (items: string[]) => void) => {
    setSelected(
      selected.includes(item) 
        ? selected.filter(i => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Guide Profile
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Welcome, {user.name}! Let's showcase your expertise and start creating memorable experiences.
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Form method="post" className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Users className="h-6 w-6 mr-2 text-orange-500" />
                    Personal Information
                  </h3>
                  <p className="text-gray-600 mt-1">Tell us about yourself</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="businessPhone"
                      name="businessPhone"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+92 XXX XXXXXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Email
                    </label>
                    <input
                      type="email"
                      id="businessEmail"
                      name="businessEmail"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="guide@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Credentials */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Award className="h-6 w-6 mr-2 text-orange-500" />
                    Professional Credentials
                  </h3>
                  <p className="text-gray-600 mt-1">Your qualifications and experience</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guideLicense" className="block text-sm font-medium text-gray-700 mb-2">
                        Guide License Number
                      </label>
                      <input
                        type="text"
                        id="guideLicense"
                        name="guideLicense"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Tourism authority license"
                      />
                    </div>

                    <div>
                      <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                        License Expiry
                      </label>
                      <input
                        type="date"
                        id="licenseExpiry"
                        name="licenseExpiry"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience *
                      </label>
                      <input
                        type="number"
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        required
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Languages Spoken *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {languageOptions.map((language) => {
                        const isSelected = selectedLanguages.includes(language);
                        return (
                          <button
                            key={language}
                            type="button"
                            onClick={() => toggleSelection(language, selectedLanguages, setSelectedLanguages)}
                            className={`p-2 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            {language}
                            {isSelected && (
                              <input type="hidden" name="languages" value={language} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Certifications
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {certificationOptions.map((cert) => {
                        const isSelected = selectedCertifications.includes(cert);
                        return (
                          <button
                            key={cert}
                            type="button"
                            onClick={() => toggleSelection(cert, selectedCertifications, setSelectedCertifications)}
                            className={`p-3 rounded-lg border-2 transition-all text-sm text-left ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            {cert}
                            {isSelected && (
                              <input type="hidden" name="certifications" value={cert} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Specializations & Service Areas */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Globe className="h-6 w-6 mr-2 text-orange-500" />
                    Specializations & Service Areas
                  </h3>
                  <p className="text-gray-600 mt-1">What do you specialize in and where do you operate?</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tour Specializations *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {specializationOptions.map((spec) => {
                        const Icon = spec.icon;
                        const isSelected = selectedSpecializations.includes(spec.id);
                        return (
                          <button
                            key={spec.id}
                            type="button"
                            onClick={() => toggleSelection(spec.id, selectedSpecializations, setSelectedSpecializations)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                            <p className="text-xs font-medium">{spec.label}</p>
                            {isSelected && (
                              <input type="hidden" name="specializations" value={spec.id} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Service Areas *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {serviceAreaOptions.map((area) => {
                        const isSelected = selectedServiceAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleSelection(area, selectedServiceAreas, setSelectedServiceAreas)}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            {area}
                            {isSelected && (
                              <input type="hidden" name="serviceAreas" value={area} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Pricing & Availability */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-orange-500" />
                    Pricing & Availability
                  </h3>
                  <p className="text-gray-600 mt-1">Set your rates and working schedule</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="pricePerPerson" className="block text-sm font-medium text-gray-700 mb-2">
                        Price Per Person (PKR) *
                      </label>
                      <input
                        type="number"
                        id="pricePerPerson"
                        name="pricePerPerson"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="2500"
                      />
                    </div>

                    <div>
                      <label htmlFor="pricePerGroup" className="block text-sm font-medium text-gray-700 mb-2">
                        Price Per Group (PKR)
                      </label>
                      <input
                        type="number"
                        id="pricePerGroup"
                        name="pricePerGroup"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="15000"
                      />
                    </div>

                    <div>
                      <label htmlFor="maxGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Group Size *
                      </label>
                      <input
                        type="number"
                        id="maxGroupSize"
                        name="maxGroupSize"
                        required
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Available Days *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {dayOptions.map((day) => {
                        const isSelected = selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleSelection(day, selectedDays, setSelectedDays)}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            {day.charAt(0) + day.slice(1).toLowerCase()}
                            {isSelected && (
                              <input type="hidden" name="availableDays" value={day} />
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., HBL, UBL"
                      />
                    </div>

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
                        IBAN / Routing
                      </label>
                      <input
                        type="text"
                        id="routingNumber"
                        name="routingNumber"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="IBAN"
                      />
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
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
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
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Skip for now
                </Link>
              </div>

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </Form>
        </div>
      </div>
    </div>
  );
}
