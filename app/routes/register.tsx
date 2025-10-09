import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { register, createUserSession, getUserId } from "~/lib/auth/auth.server";
import { sendWelcomeEmail } from "~/lib/email/email.server";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle, 
  Loader2, 
  Check, 
  X,
  Home,
  Car,
  MapPin,
  Users,
  ArrowRight,
  Building,
  Camera,
  Globe
} from "lucide-react";
import TermsContent from "~/components/legal/TermsContent";
import PrivacyContent from "~/components/legal/PrivacyContent";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");
  const phone = formData.get("phone");
  const terms = formData.get("terms");
  const role = formData.get("role") as
    | "CUSTOMER"
    | "PROPERTY_OWNER"
    | "VEHICLE_OWNER"
    | "TOUR_GUIDE";

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof name !== "string" ||
    !role
  ) {
    return json({ error: "Invalid form submission" }, { status: 400 });
  }

  if (!email || !password || !name) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  if (!terms) {
    return json({ error: "You must accept the terms and conditions" }, { status: 400 });
  }

  if (password.length < 8) {
    return json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const result = await register(email, password, name, role, phone as string);

  if ("error" in result) {
    return json({ error: result.error }, { status: 400 });
  }

  // Send welcome email (don't block registration if email fails)
  try {
    await sendWelcomeEmail(result.user.email, result.user.name, result.user.role);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  // Redirect to role-specific onboarding
  const onboardingRoutes = {
    CUSTOMER: "/dashboard",
    PROPERTY_OWNER: "/onboarding/property-owner",
    VEHICLE_OWNER: "/onboarding/vehicle-owner",
    TOUR_GUIDE: "/onboarding/tour-guide"
  };

  return createUserSession(result.user.id, onboardingRoutes[role]);
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [modalAgree, setModalAgree] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const termsContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showTerms) return;
    setModalAgree(false);
    setReachedEnd(false);

    const el = termsContentRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom <= 8) {
        setReachedEnd(true);
        setModalAgree(true); // auto-check agree when scrolled to bottom
      }
    };

    el.addEventListener('scroll', onScroll);
    // Initial check in case content fits without scroll
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [showTerms]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Very Strong"][Math.min(strength, 4)];
  const strengthColor = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"][Math.min(strength, 4)];

  // Role options with enhanced descriptions
  const roleOptions = [
    {
      id: 'CUSTOMER',
      title: 'Customer',
      subtitle: 'Book amazing experiences',
      description: 'Find and book accommodations, vehicles, and tours for your perfect trip',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      features: ['Browse & book services', 'Manage reservations', 'Leave reviews', 'Loyalty rewards']
    },
    {
      id: 'PROPERTY_OWNER',
      title: 'Property Owner',
      subtitle: 'List your properties',
      description: 'Rent out your accommodations and earn income from your properties',
      icon: Building,
      color: 'from-green-500 to-green-600',
      features: ['List properties', 'Manage bookings', 'Set pricing', 'Business analytics']
    },
    {
      id: 'VEHICLE_OWNER',
      title: 'Vehicle Owner',
      subtitle: 'Rent out your vehicles',
      description: 'Share your cars, bikes, or boats and generate passive income',
      icon: Car,
      color: 'from-purple-500 to-purple-600',
      features: ['List vehicles', 'Fleet management', 'Insurance tracking', 'Maintenance logs']
    },
    {
      id: 'TOUR_GUIDE',
      title: 'Tour Guide',
      subtitle: 'Share your expertise',
      description: 'Create memorable experiences and showcase your local knowledge',
      icon: MapPin,
      color: 'from-orange-500 to-orange-600',
      features: ['Create tours', 'Manage groups', 'Set schedules', 'Build reputation']
    }
  ];

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 to-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Join FindoTrip
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Choose how you'd like to use our platform
            </p>
            <p className="text-gray-500">
              Select the option that best describes you
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`relative cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                    selectedRole === role.id
                      ? 'ring-4 ring-[#01502E] ring-opacity-50 scale-105'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="bg-white rounded-2xl p-4 sm:p-6 h-full shadow-md border-2 border-transparent hover:border-[#01502E]/20">
                    {/* Icon with gradient background */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r ${role.color} flex items-center justify-center mb-4 mx-auto`}>
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {role.title}
                      </h3>
                      <p className="text-[#01502E] font-medium mb-3">
                        {role.subtitle}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                        {role.description}
                      </p>
                      
                      {/* Features */}
                      <ul className="text-xs text-gray-500 space-y-1 hidden sm:block">
                        {role.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center justify-center">
                            <Check className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedRole === role.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#01502E] rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <button
              onClick={() => selectedRole && setStep('details')}
              disabled={!selectedRole}
              className="inline-flex items-center px-8 py-4 bg-[#01502E] text-white rounded-xl font-semibold text-lg hover:bg-[#013d23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with {selectedRole && roleOptions.find(r => r.id === selectedRole)?.title}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#01502E] hover:text-[#013d23]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 to-gray-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md lg:max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setStep('role')}
            className="inline-flex items-center text-[#01502E] hover:text-[#013d23] mb-4"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to role selection
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">
            {selectedRole && `As a ${roleOptions.find(r => r.id === selectedRole)?.title}`}
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <Form method="post" className="space-y-5">
            {/* Hidden role field */}
            <input type="hidden" name="role" value={selectedRole} />
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Password with Strength Indicator */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Password Strength Bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${strength >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {[
                      { test: password.length >= 8, label: "At least 8 characters" },
                      { test: /[a-z]/.test(password) && /[A-Z]/.test(password), label: "Upper & lowercase letters" },
                      { test: /\d/.test(password), label: "At least one number" },
                      { test: /[^a-zA-Z\d]/.test(password), label: "Special character" },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center text-xs">
                        {req.test ? (
                          <Check className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400 mr-1" />
                        )}
                        <span className={req.test ? "text-green-600" : "text-gray-500"}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role Display */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center">
                {selectedRole && (() => {
                  const role = roleOptions.find(r => r.id === selectedRole);
                  if (!role) return null;
                  const Icon = role.icon;
                  return (
                    <>
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r ${role.color} flex items-center justify-center mr-3`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-900">{role.title}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{role.subtitle}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Terms and Conditions (Modal-trigger) */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 mt-1 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{" "}
                <button type="button" onClick={() => setShowTerms(true)} className="text-[#01502E] hover:text-[#013d23] font-medium underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => setShowTerms(true)} className="text-[#01502E] hover:text-[#013d23] font-medium underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Error Message */}
            {actionData?.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{actionData.error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !acceptedTerms}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-[#01502E] hover:bg-[#013d23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01502E] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Terms Modal */}
            {showTerms && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                  <button
                    type="button"
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowTerms(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-semibold mb-2">Terms & Privacy</h3>
                  {/* Condensed summary */}
                  <div className="mb-3 text-sm text-gray-700">
                    Please review our key points below. Scroll to the bottom or check the box to enable Accept.
                    <ul className="list-disc ml-5 mt-2">
                      <li>Bookings are contracts with providers; policies vary.</li>
                      <li>Your data is collected to provide/improve services and is protected.</li>
                      <li>You can request access or deletion of your data anytime.</li>
                    </ul>
                  </div>
                  <div ref={termsContentRef} className="prose max-h-[50vh] overflow-y-auto space-y-8 border rounded p-3">
                    <TermsContent />
                    <PrivacyContent />
                  </div>
                  {reachedEnd && (
                    <div className="mt-3 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 inline-block">
                      You’ve reviewed all sections
                    </div>
                  )}
                  <div className="mt-3 flex items-start gap-2">
                    <input
                      id="modalAgree"
                      type="checkbox"
                      className="h-4 w-4 mt-1 text-[#01502E] border-gray-300 rounded"
                      checked={modalAgree}
                      onChange={(e) => setModalAgree(e.target.checked)}
                    />
                    <label htmlFor="modalAgree" className="text-sm text-gray-700">
                      I have read and agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded border" onClick={() => setShowTerms(false)}>Close</button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded text-white ${modalAgree ? 'bg-[#01502E] hover:bg-[#013d23]' : 'bg-gray-300 cursor-not-allowed'}`}
                      disabled={!modalAgree}
                      onClick={() => { setAcceptedTerms(true); setShowTerms(false); }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>
          </div>

          {/* Social Login Placeholders */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#01502E] hover:text-[#013d23]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
