import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  User,
  Award,
  Languages,
  FileText,
  Upload,
  X,
  Save,
  Check,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Mock data - replace with actual database queries
  const profile = {
    id: "1",
    bio: "Professional tour guide with 10 years of experience in the Northern Areas of Pakistan. Specialized in high-altitude trekking and cultural tours.",
    experience: 10,
    specialties: ["Trekking", "Cultural Tours", "Photography Tours", "Wildlife Safari"],
    languages: ["English", "Urdu", "Balti", "Shina"],
    certifications: [
      { id: "1", name: "Mountain Guide Level 3", issuer: "Pakistan Mountaineering Federation", year: "2020" },
      { id: "2", name: "First Aid & CPR", issuer: "Red Crescent", year: "2023" },
      { id: "3", name: "Wilderness Survival", issuer: "Adventure Pakistan", year: "2021" }
    ],
    licenseNumber: "TG-2025-001234",
    insuranceNumber: "INS-987654321",
    businessName: "Mountain Explorer Tours",
    isVerified: true,
    verificationDate: "2025-01-15"
  };

  return json({ profile });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  // Handle profile update logic here
  
  return json({ success: true });
}

export default function TourGuideProfile() {
  const { profile } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(profile.specialties);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(profile.languages);
  const [certifications, setCertifications] = useState(profile.certifications);

  const specialtyOptions = [
    "Trekking", "Cultural Tours", "Photography Tours", "Wildlife Safari",
    "Mountain Climbing", "Historical Sites", "Adventure Sports", "Bird Watching",
    "Food Tours", "Camping", "Rock Climbing", "Skiing"
  ];

  const languageOptions = [
    "English", "Urdu", "Balti", "Shina", "Punjabi", "Pashto",
    "Sindhi", "Burushaski", "Arabic", "Chinese", "German", "French"
  ];

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const addCertification = () => {
    setCertifications([...certifications, { id: Date.now().toString(), name: "", issuer: "", year: "" }]);
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter(cert => cert.id !== id));
  };

  const updateCertification = (id: string, field: string, value: string) => {
    setCertifications(certifications.map(cert =>
      cert.id === id ? { ...cert, [field]: value } : cert
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile & Credentials</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your professional information and certifications
          </p>
        </div>

        {/* Verification Status */}
        {profile.isVerified ? (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Verified Guide</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your profile was verified on {new Date(profile.verificationDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Verification Pending</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete your profile and submit verification documents to get verified
                </p>
              </div>
            </div>
          </div>
        )}

        <Form method="post" className="space-y-8">
          {/* Professional Bio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <User className="h-5 w-5 text-[#01502E] mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Professional Bio</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  About You *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={6}
                  defaultValue={profile.bio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="Tell potential guests about your experience and expertise..."
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  min="0"
                  defaultValue={profile.experience}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Award className="h-5 w-5 text-[#01502E] mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Specialty Areas</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Select your areas of expertise</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialtyOptions.map((specialty) => (
                <label key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSpecialties.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Languages className="h-5 w-5 text-[#01502E] mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Languages</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Select languages you can guide in</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {languageOptions.map((language) => (
                <label key={language} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language)}
                    onChange={() => toggleLanguage(language)}
                    className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{language}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Certifications & Licenses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <FileText className="h-5 w-5 text-[#01502E] mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Certifications & Licenses</h2>
            </div>
            
            <div className="space-y-6">
              {certifications.map((cert, index) => (
                <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Certification {index + 1}</h3>
                    {certifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCertification(cert.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certification Name
                      </label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                        placeholder="e.g., Mountain Guide Level 3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={cert.year}
                        onChange={(e) => updateCertification(cert.id, "year", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issuing Organization
                      </label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                        placeholder="e.g., Pakistan Mountaineering Federation"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addCertification}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Certification
              </button>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name (Optional)
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  defaultValue={profile.businessName}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="Your tour business name"
                />
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Guide License Number *
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  defaultValue={profile.licenseNumber}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="TG-XXXX-XXXXXX"
                />
              </div>

              <div>
                <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Number
                </label>
                <input
                  type="text"
                  id="insuranceNumber"
                  name="insuranceNumber"
                  defaultValue={profile.insuranceNumber}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="INS-XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Verification Documents</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload your verification documents</p>
                <p className="text-xs text-gray-500 mb-4">
                  Accepted: License, Certifications, ID Card (PDF, JPG, PNG - Max 5MB)
                </p>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Choose Files
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

