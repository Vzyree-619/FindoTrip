import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import React from "react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Settings, Palette, Sun, Moon, Monitor } from "lucide-react";
import { updateGlobalTheme } from "~/contexts/ThemeContext";
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
      theme: "light",
      fontSize: "medium",
      compactMode: false,
      sidebarCollapsed: false,
      animationsEnabled: true,
    };

    if (user.appearanceSettings) {
      try {
        appearanceSettings = JSON.parse(user.appearanceSettings);
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
        theme: formData.get("theme") as string,
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

      // Update theme immediately
      updateGlobalTheme(settings.theme as any);

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
  const [selectedTheme, setSelectedTheme] = React.useState(
    appearanceSettings.theme
  );

  // Handle theme changes immediately on client side
  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
    updateGlobalTheme(newTheme as any);
  };

  const themeOptions = [
    {
      value: "light",
      label: "Light Theme",
      icon: Sun,
      description: "Clean and bright appearance",
    },
    {
      value: "dark",
      label: "Dark Theme",
      icon: Moon,
      description: "Easy on the eyes",
    },
    {
      value: "auto",
      label: "Auto (System)",
      icon: Monitor,
      description: "Follow system settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8 text-[#01502E]" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Appearance & Theme
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Customize the look and feel of your dashboard
          </p>
        </div>

        {/* Success/Error Messages */}
        {actionData && "success" in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
            <p className="text-green-800 dark:text-green-200">
              {actionData.message}
            </p>
          </div>
        )}

        {actionData && "error" in actionData && actionData.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md">
            <p className="text-red-800 dark:text-red-200">{actionData.error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Theme Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Theme
              </h2>
            </div>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="intent" value="updateAppearance" />

              {/* Theme Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {themeOptions.map(
                  ({ value, label, icon: Icon, description }) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value={value}
                        checked={selectedTheme === value}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTheme === value
                            ? "border-[#01502E] bg-green-50 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 mb-2 ${
                            selectedTheme === value
                              ? "text-[#01502E]"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        />
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {description}
                        </p>
                      </div>
                    </label>
                  )
                )}
              </div>

              {/* Font Size */}
              <div>
                <Label className="mb-3">
                  Font Size
                </Label>
                <input type="hidden" name="fontSize" id="fontSize-value" defaultValue={appearanceSettings.fontSize} />
                <Select defaultValue={appearanceSettings.fontSize} onValueChange={(value) => {
                  const hiddenInput = document.getElementById('fontSize-value') as HTMLInputElement;
                  if (hiddenInput) hiddenInput.value = value;
                }}>
                  <SelectTrigger id="fontSize" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="bg-[#01502E] hover:bg-[#013d23] text-white"
              >
                Save Theme Settings
              </Button>
            </Form>
          </div>

          {/* Display Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Compact Mode
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Collapse Sidebar
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Enable Animations
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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

          {/* Preview Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Preview
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Your current settings:
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Theme:</strong>{" "}
                  {themeOptions.find((t) => t.value === selectedTheme)?.label}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Font Size:</strong> {appearanceSettings.fontSize}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Compact Mode:</strong>{" "}
                  {appearanceSettings.compactMode ? "On" : "Off"}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
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
