import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { requireUserId, getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { v2 as cloudinary } from "cloudinary";
import { hashPassword, verifyPassword } from "~/lib/auth/auth.server";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Lock,
  Bell,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  const url = new URL(request.url);
  const updated = url.searchParams.get("updated");

  if (!user) {
    throw redirect("/login");
  }

  // Fetch customer profile for city and country
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId: userId },
    select: { city: true, country: true }
  });

  // Merge user data with customer profile data
  const userWithLocation = {
    ...user,
    city: customerProfile?.city || null,
    country: customerProfile?.country || null,
  };

  console.log("Dashboard profile loader:", { 
    userId, 
    user: { 
      id: user.id, 
      name: user.name, 
      phone: user.phone,
      city: userWithLocation.city, 
      country: userWithLocation.country 
    }, 
    updated 
  });

  return json({ user: userWithLocation, updated: updated === "true" });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-profile") {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;

    console.log("Dashboard profile update attempt:", { name, phone, city, country, userId });

    if (!name) {
      return json({ error: "Name is required" }, { status: 400 });
    }

    try {
      console.log("Attempting to update user and customer profile with data:", {
        userId,
        name,
        phone: phone || null,
        city: city || null,
        country: country || null,
      });

      // Update the User model (name and phone)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          phone: phone || null,
        },
      });

      // Update or create CustomerProfile for city and country
      await prisma.customerProfile.upsert({
        where: { userId: userId },
        update: {
          city: city || null,
          country: country || null,
        },
        create: {
          userId: userId,
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
          city: city || null,
          country: country || null,
        },
      });

      console.log("Dashboard profile updated successfully:", {
        userId: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        city,
        country,
      });
      
      return redirect("/dashboard/profile?updated=true");
    } catch (error) {
      console.error("Dashboard profile update error details:", {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        name,
        phone,
        city,
        country
      });
      return json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  if (intent === "change-password") {
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return json({ error: "All password fields are required" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return json({ error: "New passwords do not match" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    try {
      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return json({ error: "User not found" }, { status: 404 });
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return json({ success: "Password changed successfully!" });
    } catch (error) {
      return json({ error: "Failed to change password" }, { status: 500 });
    }
  }

  if (intent === "update-preferences") {
    const emailNotifications = formData.get("emailNotifications") === "on";
    const smsNotifications = formData.get("smsNotifications") === "on";
    const marketingEmails = formData.get("marketingEmails") === "on";

    try {
      // In a real app, you'd have a separate preferences table
      // For now, we'll just return success
      return json({ success: "Preferences updated successfully!" });
    } catch (error) {
      return json({ error: "Failed to update preferences" }, { status: 500 });
    }
  }

  if (intent === "update-avatar") {
    const file = formData.get("avatar") as File | null;
    if (!file) return json({ error: "No file provided" }, { status: 400 });
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return json({ error: "Invalid file type" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return json({ error: "File too large (max 5MB)" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let url: string | null = null;
    let target: 'cloudinary' | 'local' = 'local';
    try {
      if (cloudName && apiKey && apiSecret) {
        try {
          cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
          const arrayBuffer = await file.arrayBuffer();
          const uploadResult: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'findo' }, (err, result) => {
              if (err) reject(err); else resolve(result);
            });
            stream.end(Buffer.from(arrayBuffer));
          });
          url = uploadResult.secure_url as string;
          target = 'cloudinary';
        } catch (cloudErr) {
          // Fallback to local storage if Cloudinary fails
          const uploadsDir = "public/uploads/profiles";
          const fs = await import("fs");
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const ext = file.name.split(".").pop() || "jpg";
          const filename = `${userId}-${Date.now()}.${ext}`;
          const arrayBuffer = await file.arrayBuffer();
          fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
          url = `/uploads/profiles/${filename}`;
          target = 'local';
        }
      } else {
        const uploadsDir = "public/uploads/profiles";
        const fs = await import("fs");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${userId}-${Date.now()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
        url = `/uploads/profiles/${filename}`;
        target = 'local';
      }

      await prisma.user.update({ where: { id: userId }, data: { avatar: url! } });
      return json({ success: "Profile picture updated!", target, url });
    } catch (e) {
      return json({ error: "Failed to upload image" }, { status: 500 });
    }
  }

  if (intent === "delete-account") {
    const confirmDelete = formData.get("confirmDelete") as string;
    const password = formData.get("password") as string;

    if (confirmDelete !== "DELETE") {
      return json({ error: "Please type DELETE to confirm" }, { status: 400 });
    }

    if (!password) {
      return json({ error: "Password is required" }, { status: 400 });
    }

    try {
      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return json({ error: "User not found" }, { status: 404 });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return json({ error: "Password is incorrect" }, { status: 400 });
      }

      // In a real app, you'd soft delete or anonymize the user
      // For now, we'll just redirect to a confirmation page
      return redirect("/account-deleted");
    } catch (error) {
      return json({ error: "Failed to delete account" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ProfileSettings() {
  const { user, updated } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Success/Error Messages */}
        {(actionData?.success || updated) && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {actionData?.success || "Profile updated successfully!"} {actionData?.target ? `(Uploaded to: ${actionData.target})` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {actionData.error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Profile Information
              </h3>

              {/* Avatar Section */}
              <div className="flex items-center mb-6">
                {user.avatar ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-[#01502E] flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <AvatarUploader userName={user.name} />
              </div>

              <Form method="post" className="space-y-4" onSubmit={(e) => {
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name");
                const city = formData.get("city");
                const country = formData.get("country");
                console.log("Dashboard form submission:", { name, city, country });
                if (!name || typeof name !== "string" || name.trim() === "") {
                  e.preventDefault();
                  alert("Name is required");
                  return;
                }
              }}>
                <input type="hidden" name="intent" value="update-profile" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="mb-2">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        name="name"
                        id="name"
                        defaultValue={user.name}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="mb-2">
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="email"
                        id="email"
                        value={user.email}
                        disabled
                        className="pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="mb-2">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="tel"
                        name="phone"
                        id="phone"
                        defaultValue={user.phone || ""}
                        className="pl-10"
                        placeholder="+92 XXX XXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="city" className="mb-2">
                      City
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        name="city"
                        id="city"
                        defaultValue={user.city || ""}
                        className="pl-10"
                        placeholder="Skardu"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="country" className="mb-2">
                      Country
                    </Label>
                    <Input
                      type="text"
                      name="country"
                      id="country"
                      defaultValue={user.country || ""}
                      placeholder="Pakistan"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#01502E] hover:bg-[#013d23]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Change Password
              </h3>

              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="change-password" />

                <div>
                  <Label htmlFor="currentPassword" className="mb-2">
                    Current Password *
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      id="currentPassword"
                      required
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword" className="mb-2">
                      New Password *
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        required
                        minLength={8}
                        className="pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2">
                      Confirm New Password *
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        required
                        minLength={8}
                        className="pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#01502E] hover:bg-[#013d23]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Email Preferences
              </h3>

              <Form method="post">
                <input type="hidden" name="intent" value="update-preferences" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Booking Notifications
                        </label>
                        <p className="text-sm text-gray-500">
                          Receive emails about your bookings and reservations
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      name="emailNotifications"
                      defaultChecked
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          SMS Notifications
                        </label>
                        <p className="text-sm text-gray-500">
                          Receive SMS updates about your bookings
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      name="smsNotifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Marketing Emails
                        </label>
                        <p className="text-sm text-gray-500">
                          Receive emails about deals and promotions
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      name="marketingEmails"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#01502E] hover:bg-[#013d23]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Preferences
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white shadow rounded-lg border-red-200 border">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-red-900 mb-4">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. This will permanently delete your account and remove all your data.
                </p>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="delete-account" />
                  <div>
                    <Label htmlFor="confirmDelete" className="mb-2">
                      Type <strong>DELETE</strong> to confirm:
                    </Label>
                    <Input
                      type="text"
                      name="confirmDelete"
                      id="confirmDelete"
                      required
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deletePassword" className="mb-2">
                      Enter your password:
                    </Label>
                    <Input
                      type="password"
                      name="password"
                      id="deletePassword"
                      required
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="destructive"
                      className="flex-1"
                    >
                      Delete Account
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AvatarUploader({ userName }: { userName: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fetcher = useFetcher();
  
  // Clear preview when form submission is successful
  useEffect(() => {
    if (fetcher.data?.success) {
      setPreview(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [fetcher.data]);
  
  const isSubmitting = fetcher.state === "submitting";
  
  return (
    <div className="ml-4">
      <fetcher.Form 
        method="post" 
        encType="multipart/form-data"
      >
        <input type="hidden" name="intent" value="update-avatar" />
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isSubmitting}
        >
          <Camera className="w-4 h-4" />
          Change Photo
        </Button>
        <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP. 5MB max.</p>
        {preview && (
          <div className="mt-2">
            <img src={preview} alt={userName} className="h-20 w-20 rounded-full object-cover" />
          </div>
        )}
        {preview && (
          <div className="mt-2 flex gap-2">
            <Button 
              type="submit" 
              className="bg-[#01502E] hover:bg-[#013d23]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPreview(null);
                if (inputRef.current) {
                  inputRef.current.value = '';
                }
              }}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {fetcher.data?.error && (
          <p className="text-red-500 text-xs mt-1">{fetcher.data.error}</p>
        )}
        {fetcher.data?.success && (
          <p className="text-green-500 text-xs mt-1">{fetcher.data.success}</p>
        )}
      </fetcher.Form>
    </div>
  );
}
// Removed misplaced top-level action block; handled in `action` above.
/* if (intent === "update-avatar") {
    const file = formData.get("avatar") as File | null;
    if (!file) return json({ error: "No file provided" }, { status: 400 });
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return json({ error: "Invalid file type" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return json({ error: "File too large (max 5MB)" }, { status: 400 });

    // Cloudinary env vars
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let url: string | null = null;
    try {
      if (cloudName && apiKey && apiSecret) {
        // Fallback: base64 store if network restricted. In production, use Cloudinary SDK.
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        url = `data:${file.type};base64,${base64}`;
      } else {
        // Local storage fallback
        const uploadsDir = "public/uploads/profiles";
        const fs = await import("fs");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${userId}-${Date.now()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
        url = `/uploads/profiles/${filename}`;
      }

      await prisma.user.update({ where: { id: userId }, data: { avatar: url! } });
      return json({ success: "Profile picture updated!" });
    } catch (e) {
      return json({ error: "Failed to upload image" }, { status: 500 });
    }
  } */
