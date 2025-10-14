import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { createUserSession, getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { verifyPassword } from "~/lib/auth/auth.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  // If user is already logged in as admin, redirect to dashboard
  if (user && user.role === 'SUPER_ADMIN') {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/admin/dashboard",
      },
    });
  }
  
  // If user is logged in but not admin, show access denied
  if (user && user.role !== 'SUPER_ADMIN') {
    return json({ 
      error: "Access denied. Admin privileges required.",
      userRole: user.role 
    });
  }
  
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";
  
  // Basic validation
  if (!email || !password) {
    return json({ 
      error: "Email and password are required" 
    }, { status: 400 });
  }
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        loginAttempts: true,
        lockedUntil: true
      }
    });
    
    // Security: Don't reveal if email exists
    if (!user) {
      return json({ 
        error: "Invalid credentials" 
      }, { status: 401 });
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return json({ 
        error: "Account is temporarily locked due to multiple failed attempts" 
      }, { status: 423 });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return json({ 
        error: "Account is deactivated" 
      }, { status: 403 });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const shouldLock = attempts >= 5;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 minutes
        }
      });
      
      return json({ 
        error: "Invalid credentials" 
      }, { status: 401 });
    }
    
    // Check if user is SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN') {
      return json({ 
        error: "Access denied. Admin privileges required." 
      }, { status: 403 });
    }
    
    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });
    
    // Create admin session
    const session = await createUserSession(user.id, "/admin/dashboard", remember);
    
    // Log successful admin login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ADMIN_LOGIN',
        details: 'Successful admin login',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    return session;
    
  } catch (error) {
    console.error("Admin login error:", error);
    return json({ 
      error: "An error occurred during login. Please try again." 
    }, { status: 500 });
  }
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </div>
        
        {/* Login Form */}
        <Card className="p-8">
          <Form method="post" className="space-y-6">
            {/* Error Message */}
            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{actionData.error}</p>
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Login to Admin Panel"
              )}
            </Button>
          </Form>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Authorized personnel only. All activities are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
