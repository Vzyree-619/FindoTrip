import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2, Check, X, XCircle } from "lucide-react";
import { validatePasswordResetToken, resetPassword, createUserSession } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/forgot-password");
  }

  // Validate the token
  const validation = await validatePasswordResetToken(token);
  
  if ('error' in validation) {
    return json({ error: validation.error, token });
  }

  return json({ user: validation.user, token });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return json({ error: "Invalid form submission" }, { status: 400 });
  }

  if (!password || !confirmPassword) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return json({ error: "Passwords do not match" }, { status: 400 });
  }

  if (password.length < 8) {
    return json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const result = await resetPassword(token, password);

    if ('error' in result) {
      return json({ error: result.error }, { status: 400 });
    }

    // Get user info for session creation
    const validation = await validatePasswordResetToken(token);
    if ('error' in validation) {
      return json({ error: "Invalid reset token" }, { status: 400 });
    }

    // Log the user in automatically after successful password reset
    return createUserSession(validation.user.id, "/dashboard");

  } catch (error) {
    console.error('Password reset error:', error);
    return json({ error: "Failed to reset password" }, { status: 500 });
  }
}

export default function ResetPassword() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // If there's an error from the loader (invalid token), show error state
  if ('error' in loaderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Link
            to="/forgot-password"
            className="flex items-center text-sm text-gray-600 hover:text-[#01502E] mb-6 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Request new reset link
          </Link>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              {loaderData.error}
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-white bg-[#01502E] hover:bg-[#013d23] font-semibold transition"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back to Login */}
        <Link
          to="/login"
          className="flex items-center text-sm text-gray-600 hover:text-[#01502E] mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Link>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600">
            Enter your new password for {loaderData.user.email}
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="token" value={loaderData.token} />

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Passwords match
                </p>
              )}
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
              disabled={isSubmitting || password !== confirmPassword || password.length < 8}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-[#01502E] hover:bg-[#013d23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01502E] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
