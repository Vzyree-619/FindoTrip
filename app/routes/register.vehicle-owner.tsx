import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
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
  Calendar,
  Globe,
  Truck,
  Bike
} from "lucide-react";
import { generateMeta } from "~/components/SEOHead";

export const meta = () => generateMeta({
  title: "Fleet Setup - Vehicle Owner | FindoTrip",
  description: "Set up your vehicle rental business and start earning with FindoTrip"
});

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

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
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const formData = await request.formData();
  
  // Extract form data
  const businessName = formData.get("businessName") as string;
  const businessType = formData.get("businessType") as string;
  const businessLicense = formData.get("businessLicense") as string;
  const transportLicense = formData.get("transportLicense") as string;
  const insuranceProvider = formData.get("insuranceProvider") as string;
  const insurancePolicy = formData.get("insurancePolicy") as string;
  const insuranceExpiry = formData.get("insuranceExpiry") as string;
  const businessPhone = formData.get("businessPhone") as string;
  const businessEmail = formData.get("businessEmail") as string;
  const businessAddress = formData.get("businessAddress") as string;
  const businessCity = formData.get("businessCity") as string;
  const businessState = formData.get("businessState") as string;
  const businessCountry = formData.get("businessCountry") as string;
  const drivingLicense = formData.get("drivingLicense") as string;
  const licenseExpiry = formData.get("licenseExpiry") as string;
  const drivingExperience = formData.get("drivingExperience") as string;
  const languages = formData.getAll("languages") as string[];
  const vehicleTypes = formData.getAll("vehicleTypes") as string[];
  const serviceAreas = formData.getAll("serviceAreas") as string[];
  const bankName = formData.get("bankName") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const routingNumber = formData.get("routingNumber") as string;

  try {
    // Create vehicle owner profile
    await prisma.vehicleOwner.create({
      data: {
        userId,
        businessName,
        businessType,
        businessLicense,
        transportLicense,
        insuranceProvider,
        insurancePolicy,
        insuranceExpiry: new Date(insuranceExpiry),
        businessPhone,
        businessEmail,
        businessAddress,
        businessCity,
        businessState,
        businessCountry,
        drivingLicense,
        licenseExpiry: new Date(licenseExpiry),
        drivingExperience: parseInt(drivingExperience),
        languages,
        vehicleTypes,
        serviceAreas,
        bankName,
        accountNumber,
        routingNumber,
      },
    });

    // Create service request for approval
    await prisma.serviceRequest.create({
      data: {
        type: "PROFILE_UPDATE",
        title: "New Vehicle Owner Registration",
        description: `Fleet business registration for ${businessName}`,
        requesterId: userId,
        requesterRole: "VEHICLE_OWNER",
        requestData: {
          businessName,
          businessType,
          transportLicense,
          insuranceProvider,
          vehicleTypes
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
    return json({ error: "Failed to create fleet business profile" }, { status: 500 });
  }
}

export default function VehicleOwnerOnboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [step, setStep] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
  const totalSteps = 4;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const languageOptions = [
    'English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Arabic', 'Persian'
  ];

  const vehicleTypeOptions = [
    { id: 'CAR', label: 'Cars', icon: Car },
    { id: 'SUV', label: 'SUVs', icon: Truck },
    { id: 'VAN', label: 'Vans', icon: Truck },
    { id: 'BUS', label: 'Buses', icon: Truck },
    { id: 'MOTORCYCLE', label: 'Motorcycles', icon: Bike },
    { id: 'BICYCLE', label: 'Bicycles', icon: Bike }
  ];

  const serviceAreaOptions = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'
  ];

  const toggleSelection = (item: string, selected: string[], setSelected: (items: string[]) => void) => {
    setSelected(
      selected.includes(item) 
        ? selected.filter(i => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Fleet Business
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Welcome, {user.name}! Let's get your vehicle rental business verified and ready to earn.
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
          <Form method="post" className="space-y-6">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Car className="h-6 w-6 mr-2 text-purple-500" />
                    Business Information
                  </h3>
                  <p className="text-gray-600 mt-1">Tell us about your vehicle rental business</p>
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
                      placeholder="e.g., FastTrack Car Rentals"
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
                      <option value="fleet">Fleet Business</option>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Business license number"
                    />
                  </div>

                  <div>
                    <label htmlFor="transportLicense" className="block text-sm font-medium text-gray-700 mb-2">
                      Transport License
                    </label>
                    <input
                      type="text"
                      id="transportLicense"
                      name="transportLicense"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Transport authority license"
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
                      placeholder="fleet@example.com"
                    />
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
                  <p className="text-gray-600 mt-1">Your insurance and driving credentials</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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
                        placeholder="e.g., State Life, Adamjee"
                      />
                    </div>

                    <div>
                      <label htmlFor="insurancePolicy" className="block text-sm font-medium text-gray-700 mb-2">
                        Policy Number *
                      </label>
                      <input
                        type="text"
                        id="insurancePolicy"
                        name="insurancePolicy"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Insurance policy number"
                      />
                    </div>

                    <div>
                      <label htmlFor="insuranceExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Expiry *
                      </label>
                      <input
                        type="date"
                        id="insuranceExpiry"
                        name="insuranceExpiry"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="drivingLicense" className="block text-sm font-medium text-gray-700 mb-2">
                        Driving License *
                      </label>
                      <input
                        type="text"
                        id="drivingLicense"
                        name="drivingLicense"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Driving license number"
                      />
                    </div>

                    <div>
                      <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                        License Expiry *
                      </label>
                      <input
                        type="date"
                        id="licenseExpiry"
                        name="licenseExpiry"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="drivingExperience" className="block text-sm font-medium text-gray-700 mb-2">
                        Driving Experience (Years) *
                      </label>
                      <input
                        type="number"
                        id="drivingExperience"
                        name="drivingExperience"
                        required
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Languages Spoken
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {languageOptions.map((language) => {
                        const isSelected = selectedLanguages.includes(language);
                        return (
                          <button
                            key={language}
                            type="button"
                            onClick={() => toggleSelection(language, selectedLanguages, setSelectedLanguages)}
                            className={`p-2 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300'
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
                </div>
              </div>
            )}

            {/* Step 3: Fleet & Service Areas */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Truck className="h-6 w-6 mr-2 text-purple-500" />
                    Fleet & Service Areas
                  </h3>
                  <p className="text-gray-600 mt-1">What vehicles do you offer and where?</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Vehicle Types *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                      {vehicleTypeOptions.map((vehicleType) => {
                        const Icon = vehicleType.icon;
                        const isSelected = selectedVehicleTypes.includes(vehicleType.id);
                        return (
                          <button
                            key={vehicleType.id}
                            type="button"
                            onClick={() => toggleSelection(vehicleType.id, selectedVehicleTypes, setSelectedVehicleTypes)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-purple-500' : 'text-gray-400'}`} />
                            <p className="text-sm font-medium">{vehicleType.label}</p>
                            {isSelected && (
                              <input type="hidden" name="vehicleTypes" value={vehicleType.id} />
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {serviceAreaOptions.map((area) => {
                        const isSelected = selectedServiceAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleSelection(area, selectedServiceAreas, setSelectedServiceAreas)}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300'
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Address *
                      </label>
                      <input
                        type="text"
                        id="businessAddress"
                        name="businessAddress"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Street address"
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
                        placeholder="City"
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
              </div>
            )}

            {/* Step 4: Banking Information */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-6 w-6 mr-2 text-purple-500" />
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
                  to="/dashboard"
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
