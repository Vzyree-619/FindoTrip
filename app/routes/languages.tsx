import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, Globe, CheckCircle } from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Languages() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const languages = [
    { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
    { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
    { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
    { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  ];

  const availableLanguages = languages.filter(lang => ["en", "ur", "ar"].includes(lang.code));
  const comingSoonLanguages = languages.filter(lang => !["en", "ur", "ar"].includes(lang.code));

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
              <Globe className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Language Settings</h1>
            <p className="text-xl text-white/90">
              Choose your preferred language for the best FindoTrip experience.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Available Languages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Languages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                className={`p-6 rounded-lg border-2 transition text-left ${
                  selectedLanguage === language.code
                    ? "border-[#01502E] bg-[#01502E]/5"
                    : "border-gray-200 bg-white hover:border-[#01502E]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{language.flag}</span>
                  {selectedLanguage === language.code && (
                    <CheckCircle className="w-5 h-5 text-[#01502E]" />
                  )}
                </div>
                <div className="text-lg font-semibold text-gray-900">{language.name}</div>
                <div className="text-sm text-gray-600">{language.nativeName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h2>
          <p className="text-gray-600 mb-4">
            We're working on adding more languages to make FindoTrip accessible to travelers worldwide.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {comingSoonLanguages.map((language) => (
              <div
                key={language.code}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-center opacity-60"
              >
                <div className="text-2xl mb-2">{language.flag}</div>
                <div className="text-sm font-medium text-gray-700">{language.name}</div>
                <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection Info */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About Language Selection</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              When you select a language, the FindoTrip interface will be displayed in that language. 
              This includes menus, buttons, forms, and help content.
            </p>
            <p>
              <strong>Note:</strong> Some content, such as property descriptions and reviews, may remain 
              in the original language as provided by property owners and users.
            </p>
            <p>
              Your language preference is saved and will be remembered for future visits.
            </p>
          </div>
        </div>

        {/* Apply Button */}
        <div className="text-center">
          <button
            onClick={() => {
              // In a real app, this would save the language preference
              alert(`Language changed to ${languages.find(l => l.code === selectedLanguage)?.name}. This feature will be fully implemented soon.`);
            }}
            className="px-8 py-4 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold text-lg"
          >
            Apply Language Settings
          </button>
        </div>

        {/* Help */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-3">
            Need help or have a language request?
          </p>
          <Link
            to="/contact"
            className="text-[#01502E] font-semibold hover:underline"
          >
            Contact Us →
          </Link>
        </div>
      </div>
    </div>
  );
}

