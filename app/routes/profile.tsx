import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { v2 as cloudinary } from "cloudinary";
import { useState, useEffect } from "react";
import { requireUserId, getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

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
  
  console.log("Profile loader:", { 
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
  const contentType = request.headers.get('Content-Type') || '';
  const isMultipart = contentType.includes('multipart/form-data');
  const formData = isMultipart
    ? await unstable_parseMultipartFormData(request, unstable_createMemoryUploadHandler({ maxPartSize: 5 * 1024 * 1024 }))
    : await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-profile") {
    const name = formData.get("name");
    const phone = formData.get("phone");
    const city = formData.get("city");
    const country = formData.get("country");

    console.log("Profile update attempt:", { name, phone, city, country, userId });

    if (typeof name !== "string" || !name) {
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
          phone: phone as string || null,
        },
      });

      // Update or create CustomerProfile for city and country
      await prisma.customerProfile.upsert({
        where: { userId: userId },
        update: {
          city: city as string || null,
          country: country as string || null,
        },
        create: {
          userId: userId,
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
          city: city as string || null,
          country: country as string || null,
        },
      });

      console.log("Profile updated successfully:", {
        userId: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        city,
        country,
      });
      
      return redirect("/profile?updated=true");
    } catch (error) {
      console.error("Profile update error:", error);
      return json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  if (intent === "update-avatar") {
    const avatarUrl = formData.get("avatarUrl");
    const file = formData.get("file") as File | null;
    if (!file && (typeof avatarUrl !== "string" || !avatarUrl)) {
      return json({ error: "Provide an image file or URL" }, { status: 400 });
    }
    try {
      let urlToSave = typeof avatarUrl === 'string' && avatarUrl ? avatarUrl : undefined;
      if (file) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (cloudName && apiKey && apiSecret) {
          cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
          const arrayBuffer = await file.arrayBuffer();
          const uploadResult: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'findo' }, (err, result) => {
              if (err) reject(err); else resolve(result);
            });
            stream.end(Buffer.from(arrayBuffer));
          });
          urlToSave = uploadResult.secure_url as string;
        } else {
          const name = `${Date.now()}-${file.name}`;
          urlToSave = `/uploads/${name}`;
        }
      }
      if (!urlToSave) return json({ error: "Invalid image input" }, { status: 400 });
      await prisma.user.update({ where: { id: userId }, data: { avatar: urlToSave } });
      return json({ success: "Profile picture updated!" });
    } catch (e) {
      return json({ error: "Failed to update profile picture" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function Profile() {
  const { user, updated } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isEditing, setIsEditing] = useState(false);

  // Close editing mode after successful update
  useEffect(() => {
    if (actionData?.success && isEditing) {
      setIsEditing(false);
    }
  }, [actionData?.success, isEditing]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-[#01502E] to-[#013d23]"></div>

          {/* Profile Section */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="inline-block relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-32 w-32 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full border-4 border-white bg-[#01502E] flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <Form method="post" encType="multipart/form-data" className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <input type="hidden" name="intent" value="update-avatar" />
                  <input type="file" name="file" accept="image/*" className="text-xs" />
                  <input
                    type="url"
                    name="avatarUrl"
                    placeholder="Image URL"
                    className="w-32 text-xs border rounded px-2 py-1"
                  />
                  <button type="submit" title="Update avatar">
                    <Camera className="h-5 w-5 text-gray-600" />
                  </button>
                </Form>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-[#01502E]/10 text-[#01502E]">
                {user.role.replace("_", " ")}
              </span>
            </div>

            {/* Action Messages */}
            {(actionData?.success || updated) && (
              <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    {actionData?.success || "Profile updated successfully!"}
                  </p>
                </div>
              </div>
            )}

            {actionData?.error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{actionData.error}</p>
                </div>
              </div>
            )}

            {/* Edit Toggle */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mb-6 px-6 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-semibold"
              >
                Edit Profile
              </button>
            )}

            {/* Profile Form */}
            {isEditing ? (
              <Form method="post" className="space-y-6" onSubmit={(e) => {
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name");
                const city = formData.get("city");
                const country = formData.get("country");
                console.log("Form submission:", { name, city, country });
                if (!name || typeof name !== "string" || name.trim() === "") {
                  e.preventDefault();
                  alert("Name is required");
                  return;
                }
              }}>
                <input type="hidden" name="intent" value="update-profile" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        defaultValue={user.name}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
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
                        type="email"
                        value={user.email}
                        disabled
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={user.phone || ""}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        defaultValue={user.city || ""}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                        placeholder="Skardu"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div className="md:col-span-2">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      defaultValue={user.country || ""}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E] focus:border-transparent transition"
                      placeholder="Pakistan"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-[#01502E] hover:bg-[#013d23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01502E] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-semibold transition"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                </div>
              </Form>
            ) : (
              /* View Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.city && user.country 
                          ? `${user.city}, ${user.country}`
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div>
                <h3 className="font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Update your password regularly for security</p>
              </div>
              <button className="text-[#01502E] hover:text-[#013d23] font-medium text-sm">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Manage your email preferences</p>
              </div>
              <button className="text-[#01502E] hover:text-[#013d23] font-medium text-sm">
                Manage
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 transition">
              <div>
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="text-sm text-red-600">Permanently delete your account and data</p>
              </div>
              <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
