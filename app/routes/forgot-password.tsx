import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createPasswordResetToken } from "~/lib/auth.server";
import { sendPasswordResetEmail } from "~/lib/email.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Just render the page
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Create password reset token
    const result = await createPasswordResetToken(email);

    if ('error' in result) {
      // Don't reveal if user exists for security
      return json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link shortly." 
      });
    }

    // Send password reset email
    await sendPasswordResetEmail(result.user.email, result.user.name, result.token);

    return json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link shortly." 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link shortly." 
    });
  }
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md lg:max-w-lg w-full">
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
            Forgot Password?
          </h2>
          <p className="text-gray-600">
            No worries, we'll send you reset instructions
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          {actionData?.success ? (
            /* Success State */
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check your email
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {actionData.message}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-white bg-[#01502E] hover:bg-[#013d23] font-semibold transition"
              >
                Back to login
              </Link>
            </div>
          ) : (
            /* Form State */
            <Form method="post" className="space-y-6">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {actionData?.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">{actionData.error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-[#01502E] hover:bg-[#013d23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01502E] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Sending...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#01502E] hover:text-[#013d23]"
                >
                  Sign in
                </Link>
              </p>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
