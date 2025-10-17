import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { createUserSession, getUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Shield, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  
  // If user is already logged in and is SUPER_ADMIN, redirect to admin dashboard
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (user?.role === 'SUPER_ADMIN') {
      throw redirect("/admin");
    }
  }
  
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        active: true,
        verified: true
      }
    });
    
    if (!user) {
      return json({ error: "Invalid email or password" }, { status: 401 });
    }
    
    // Check if user is SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN') {
      return json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }
    
    // Check if user is active
    if (!user.active) {
      return json({ error: "Account is deactivated. Contact system administrator." }, { status: 403 });
    }
    
    // Verify password - check both plain text and hashed versions
    const bcrypt = await import('bcryptjs');
    const isPasswordValid = user.password === password || await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return json({ error: "Invalid email or password" }, { status: 401 });
    }
    
    // Create session and redirect to full admin panel
    return createUserSession(user.id, "/admin");
    
  } catch (error) {
    console.error("Admin login error:", error);
    return json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#01502E] rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">FindoTrip Super Admin Access</p>
        </div>
        
        {/* Login Form */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
            <p className="text-gray-600">Enter your admin credentials</p>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-6">
              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 text-sm">{actionData.error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Admin Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@findotrip.com"
                    className="mt-1"
                    autoComplete="email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#01502E] hover:bg-[#013d23] text-white font-medium py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In to Admin Panel"
                )}
              </Button>
            </Form>
            
            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-800">Secure Admin Access</h3>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Only authorized SUPER_ADMIN users can access this portal. 
                Contact your system administrator for credentials.
              </p>
            </div>
            
            {/* Back to Main Site */}
            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to FindoTrip Main Site
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            🔒 Secure Admin Access • Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}