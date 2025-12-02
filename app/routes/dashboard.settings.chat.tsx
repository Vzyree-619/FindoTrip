import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import React from "react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import {
  Settings,
  MessageCircle,
  Bell,
  Shield,
  Palette,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from "lucide-react";
import { ThemeProvider, updateGlobalTheme } from "~/contexts/ThemeContext";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      avatar: true,
      chatSettings: true,
      privacySettings: true,
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Parse existing settings with defaults
  const chatSettings = user.chatSettings
    ? JSON.parse(user.chatSettings)
    : {
        theme: "light",
        fontSize: "medium",
        soundEnabled: true,
        notificationsEnabled: true,
        showOnlineStatus: true,
        showReadReceipts: true,
        showTypingIndicators: true,
        autoDownloadMedia: false,
        messagePreview: true,
        darkMode: false,
      };

  const privacySettings = user.privacySettings
    ? JSON.parse(user.privacySettings)
    : {
        allowMessagesFromProviders: true,
        allowMessagesFromCustomers: true,
        showOnlineStatus: true,
        showReadReceipts: true,
        allowMessageForwarding: true,
        autoRespondWhenOffline: false,
        showTypingIndicators: true,
        allowFileSharing: true,
      };

  return json({
    user,
    chatSettings,
    privacySettings,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "updateChatSettings") {
      const settings = {
        theme: formData.get("theme") as string,
        fontSize: formData.get("fontSize") as string,
        soundEnabled: formData.get("soundEnabled") === "on",
        notificationsEnabled: formData.get("notificationsEnabled") === "on",
        showOnlineStatus: formData.get("showOnlineStatus") === "on",
        showReadReceipts: formData.get("showReadReceipts") === "on",
        showTypingIndicators: formData.get("showTypingIndicators") === "on",
        autoDownloadMedia: formData.get("autoDownloadMedia") === "on",
        messagePreview: formData.get("messagePreview") === "on",
        darkMode: formData.get("darkMode") === "on",
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          chatSettings: JSON.stringify(settings),
        },
      });

      // Update theme immediately
      updateGlobalTheme(settings.theme as any);

      return json({
        success: true,
        message: "Chat settings updated successfully",
      });
    }

    if (intent === "updatePrivacySettings") {
      const settings = {
        allowMessagesFromProviders:
          formData.get("allowMessagesFromProviders") === "on",
        allowMessagesFromCustomers:
          formData.get("allowMessagesFromCustomers") === "on",
        showOnlineStatus: formData.get("showOnlineStatus") === "on",
        showReadReceipts: formData.get("showReadReceipts") === "on",
        allowMessageForwarding: formData.get("allowMessageForwarding") === "on",
        autoRespondWhenOffline: formData.get("autoRespondWhenOffline") === "on",
        showTypingIndicators: formData.get("showTypingIndicators") === "on",
        allowFileSharing: formData.get("allowFileSharing") === "on",
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          privacySettings: JSON.stringify(settings),
        },
      });

      return json({
        success: true,
        message: "Privacy settings updated successfully",
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating settings:", error);
    return json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export default function ChatSettings() {
  const { user, chatSettings, privacySettings } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedTheme, setSelectedTheme] = React.useState(chatSettings.theme);

  // Handle theme changes immediately on client side
  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
    updateGlobalTheme(newTheme as any);
  };

  return (
    <ThemeProvider initialTheme={chatSettings.theme as any}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-[#01502E]" />
              <h1 className="text-3xl font-bold text-gray-900">
                Chat Settings
              </h1>
            </div>
            <p className="text-gray-600">
              Customize your chat experience and manage your preferences
            </p>
          </div>

          {/* Success/Error Messages */}
          {actionData && "success" in actionData && actionData.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{actionData.message}</p>
            </div>
          )}

          {actionData && "error" in actionData && actionData.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{actionData.error}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Appearance Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Appearance
                </h2>
              </div>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="updateChatSettings" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Chat Theme
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={selectedTheme === "light"}
                          onChange={(e) => handleThemeChange(e.target.value)}
                          className="text-[#01502E] focus:ring-[#01502E]"
                        />
                        <span className="text-sm">Light Theme</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={selectedTheme === "dark"}
                          onChange={(e) => handleThemeChange(e.target.value)}
                          className="text-[#01502E] focus:ring-[#01502E]"
                        />
                        <span className="text-sm">Dark Theme</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="theme"
                          value="auto"
                          checked={selectedTheme === "auto"}
                          onChange={(e) => handleThemeChange(e.target.value)}
                          className="text-[#01502E] focus:ring-[#01502E]"
                        />
                        <span className="text-sm">Auto (System)</span>
                      </label>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <Label className="mb-3">
                      Font Size
                    </Label>
                    <input type="hidden" name="fontSize" id="fontSize-value" defaultValue={chatSettings.fontSize} />
                    <Select defaultValue={chatSettings.fontSize} onValueChange={(value) => {
                      const hiddenInput = document.getElementById('fontSize-value') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = value;
                    }}>
                      <SelectTrigger id="fontSize" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="bg-[#01502E] hover:bg-[#013d23]"
                >
                  Save Appearance Settings
                </Button>
              </Form>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Notifications
                </h2>
              </div>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="updateChatSettings" />

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="notificationsEnabled"
                      defaultChecked={chatSettings.notificationsEnabled}
                    />
                    <div>
                      <span className="font-medium">Enable Notifications</span>
                      <p className="text-sm text-gray-600">
                        Receive notifications for new messages
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="soundEnabled"
                      defaultChecked={chatSettings.soundEnabled}
                    />
                    <div>
                      <span className="font-medium">Sound Notifications</span>
                      <p className="text-sm text-gray-600">
                        Play sound for new messages
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="messagePreview"
                      defaultChecked={chatSettings.messagePreview}
                    />
                    <div>
                      <span className="font-medium">Message Preview</span>
                      <p className="text-sm text-gray-600">
                        Show message content in notifications
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="bg-[#01502E] hover:bg-[#013d23]"
                >
                  Save Notification Settings
                </Button>
              </Form>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Privacy & Security
                </h2>
              </div>

              <Form method="post" className="space-y-6">
                <input
                  type="hidden"
                  name="intent"
                  value="updatePrivacySettings"
                />

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="showOnlineStatus"
                      defaultChecked={privacySettings.showOnlineStatus}
                    />
                    <div>
                      <span className="font-medium">Show Online Status</span>
                      <p className="text-sm text-gray-600">
                        Let others see when you're online
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="showReadReceipts"
                      defaultChecked={privacySettings.showReadReceipts}
                    />
                    <div>
                      <span className="font-medium">Read Receipts</span>
                      <p className="text-sm text-gray-600">
                        Let others know when you've read their messages
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="showTypingIndicators"
                      defaultChecked={privacySettings.showTypingIndicators}
                    />
                    <div>
                      <span className="font-medium">Typing Indicators</span>
                      <p className="text-sm text-gray-600">
                        Show when you're typing a message
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="allowFileSharing"
                      defaultChecked={privacySettings.allowFileSharing}
                    />
                    <div>
                      <span className="font-medium">File Sharing</span>
                      <p className="text-sm text-gray-600">
                        Allow others to send you files
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="allowMessagesFromProviders"
                      defaultChecked={
                        privacySettings.allowMessagesFromProviders
                      }
                    />
                    <div>
                      <span className="font-medium">
                        Messages from Service Providers
                      </span>
                      <p className="text-sm text-gray-600">
                        Allow service providers to message you
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="allowMessagesFromCustomers"
                      defaultChecked={
                        privacySettings.allowMessagesFromCustomers
                      }
                    />
                    <div>
                      <span className="font-medium">
                        Messages from Customers
                      </span>
                      <p className="text-sm text-gray-600">
                        Allow customers to message you
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="bg-[#01502E] hover:bg-[#013d23]"
                >
                  Save Privacy Settings
                </Button>
              </Form>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Advanced Settings
                </h2>
              </div>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="updateChatSettings" />

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="autoDownloadMedia"
                      defaultChecked={chatSettings.autoDownloadMedia}
                    />
                    <div>
                      <span className="font-medium">Auto-download Media</span>
                      <p className="text-sm text-gray-600">
                        Automatically download images and files
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <Checkbox
                      name="autoRespondWhenOffline"
                      defaultChecked={privacySettings.autoRespondWhenOffline}
                    />
                    <div>
                      <span className="font-medium">
                        Auto-respond When Offline
                      </span>
                      <p className="text-sm text-gray-600">
                        Send automatic responses when you're not available
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="bg-[#01502E] hover:bg-[#013d23]"
                >
                  Save Advanced Settings
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
