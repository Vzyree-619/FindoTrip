import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import React from "react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Settings, Palette } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Response("User not found", { status: 404 });
    }

    // Parse existing appearance settings with defaults
    let appearanceSettings = {
      fontSize: "medium",
      compactMode: false,
      sidebarCollapsed: false,
      animationsEnabled: true,
    };

    if (user.appearanceSettings) {
      try {
        const parsed = JSON.parse(user.appearanceSettings);
        // Remove theme from settings if it exists
        const { theme, ...rest } = parsed;
        appearanceSettings = rest;
      } catch (e) {
        console.error("Failed to parse appearance settings:", e);
      }
    }

    return json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      appearanceSettings,
    });
  } catch (error) {
    console.error("Error in appearance loader:", error);
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "updateAppearance") {
      const settings = {
        fontSize: formData.get("fontSize") as string,
        compactMode: formData.get("compactMode") === "on",
        sidebarCollapsed: formData.get("sidebarCollapsed") === "on",
        animationsEnabled: formData.get("animationsEnabled") === "on",
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          appearanceSettings: JSON.stringify(settings),
        },
      });

      return json({
        success: true,
        message: "Appearance settings updated successfully",
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating appearance settings:", error);
    return json(
      { error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
}

export default function AppearanceSettings() {
  const { user, appearanceSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8 text-[#01502E]" />
            <h1 className="text-3xl font-bold text-gray-900">
              Appearance Settings
            </h1>
          </div>
          <p className="text-gray-600">
            Customize the look and feel of your dashboard
          </p>
        </div>

        {/* Success/Error Messages */}
        {actionData && "success" in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              {actionData.message}
            </p>
          </div>
        )}

        {actionData && "error" in actionData && actionData.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{actionData.error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Display Options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Display Options
              </h2>
            </div>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="intent" value="updateAppearance" />

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox
                    name="compactMode"
                    defaultChecked={appearanceSettings.compactMode}
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      Compact Mode
                    </span>
                    <p className="text-sm text-gray-600">
                      Reduce spacing and make content more condensed
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox
                    name="sidebarCollapsed"
                    defaultChecked={appearanceSettings.sidebarCollapsed}
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      Collapse Sidebar
                    </span>
                    <p className="text-sm text-gray-600">
                      Show only icons in the sidebar to maximize content area
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox
                    name="animationsEnabled"
                    defaultChecked={appearanceSettings.animationsEnabled}
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      Enable Animations
                    </span>
                    <p className="text-sm text-gray-600">
                      Show smooth transitions and animations throughout the
                      interface
                    </p>
                  </div>
                </label>
              </div>

              <Button
                type="submit"
                className="bg-[#01502E] hover:bg-[#013d23] text-white"
              >
                Save Display Settings
              </Button>
            </Form>
          </div>

          {/* Font Size Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Font Size
              </h2>
            </div>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="intent" value="updateAppearance" />
              <input type="hidden" name="fontSize" id="fontSize-value" defaultValue={appearanceSettings.fontSize || "medium"} />
              <Select defaultValue={appearanceSettings.fontSize || "medium"} onValueChange={(value) => {
                const hiddenInput = document.getElementById('fontSize-value') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = value;
              }}>
                <SelectTrigger id="fontSize" className="w-full">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium (Default)</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                className="bg-[#01502E] hover:bg-[#013d23] text-white"
              >
                Save Font Size
              </Button>
            </Form>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                Your current settings:
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <strong>Font Size:</strong> {appearanceSettings.fontSize}
                </p>
                <p className="text-gray-600">
                  <strong>Compact Mode:</strong>{" "}
                  {appearanceSettings.compactMode ? "On" : "Off"}
                </p>
                <p className="text-gray-600">
                  <strong>Animations:</strong>{" "}
                  {appearanceSettings.animationsEnabled
                    ? "Enabled"
                    : "Disabled"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
