import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Shield, Eye, EyeOff, MessageCircle, Users, AlertTriangle, Check, X } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user's current privacy settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      privacySettings: true
    }
  });

  // Get blocked users
  const blockedUsers = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    include: {
      blocked: {
        select: { id: true, name: true, role: true }
      }
    }
  });

  // Default privacy settings
  const defaultSettings = {
    allowMessagesFromProviders: true,
    allowMessagesFromCustomers: user?.role !== 'CUSTOMER',
    showOnlineStatus: true,
    showReadReceipts: true,
    allowMessageForwarding: false,
    autoRespondWhenOffline: user?.role !== 'CUSTOMER',
    showTypingIndicators: true,
    allowFileSharing: true
  };

  const privacySettings = user?.privacySettings ? 
    { ...defaultSettings, ...JSON.parse(user.privacySettings as string) } : 
    defaultSettings;

  return json({
    user,
    privacySettings,
    blockedUsers: blockedUsers.map(b => ({
      id: b.blocked.id,
      name: b.blocked.name,
      role: b.blocked.role,
      blockedAt: b.createdAt
    }))
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "updateSettings") {
      const settings = {
        allowMessagesFromProviders: formData.get("allowMessagesFromProviders") === "on",
        allowMessagesFromCustomers: formData.get("allowMessagesFromCustomers") === "on",
        showOnlineStatus: formData.get("showOnlineStatus") === "on",
        showReadReceipts: formData.get("showReadReceipts") === "on",
        allowMessageForwarding: formData.get("allowMessageForwarding") === "on",
        autoRespondWhenOffline: formData.get("autoRespondWhenOffline") === "on",
        showTypingIndicators: formData.get("showTypingIndicators") === "on",
        allowFileSharing: formData.get("allowFileSharing") === "on"
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          privacySettings: JSON.stringify(settings)
        }
      });

      return json({ success: true, message: "Privacy settings updated successfully" });
    }

    if (action === "blockUser") {
      const targetUserId = formData.get("targetUserId") as string;
      const reason = formData.get("reason") as string;

      if (!targetUserId) {
        return json({ error: "User ID is required" }, { status: 400 });
      }

      // Check if already blocked
      const existingBlock = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: targetUserId
          }
        }
      });

      if (existingBlock) {
        return json({ error: "User is already blocked" }, { status: 400 });
      }

      await prisma.userBlock.create({
        data: {
          blockerId: userId,
          blockedId: targetUserId,
          reason: reason || "No reason provided"
        }
      });

      return json({ success: true, message: "User blocked successfully" });
    }

    if (action === "unblockUser") {
      const targetUserId = formData.get("targetUserId") as string;

      if (!targetUserId) {
        return json({ error: "User ID is required" }, { status: 400 });
      }

      await prisma.userBlock.delete({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: targetUserId
          }
        }
      });

      return json({ success: true, message: "User unblocked successfully" });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Privacy settings error:", error);
    return json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export default function PrivacySettings() {
  const { user, privacySettings, blockedUsers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [blockUserId, setBlockUserId] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const isSubmitting = navigation.state === "submitting";
  const isCustomer = user?.role === "CUSTOMER";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-[#01502E]" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Security Settings</h1>
        </div>

        {actionData?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{actionData.error}</span>
          </div>
        )}

        {actionData?.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{actionData.message}</span>
          </div>
        )}

        <Form method="post" className="space-y-6">
          <input type="hidden" name="action" value="updateSettings" />

          {/* Message Permissions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Message Permissions
            </h2>

            <div className="space-y-3 pl-7">
              {isCustomer && (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="allowMessagesFromProviders"
                    defaultChecked={privacySettings.allowMessagesFromProviders}
                    className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                  />
                  <span className="text-gray-700">Allow providers to message me</span>
                </label>
              )}

              {!isCustomer && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="allowMessagesFromCustomers"
                      defaultChecked={true}
                      disabled
                      className="w-4 h-4 text-[#01502E] border-gray-300 rounded"
                    />
                    <span className="text-gray-600">Allow customers to message me (always enabled for business)</span>
                  </label>
                </div>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="allowMessageForwarding"
                  defaultChecked={privacySettings.allowMessageForwarding}
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-gray-700">Allow message forwarding</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="allowFileSharing"
                  defaultChecked={privacySettings.allowFileSharing}
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-gray-700">Allow file sharing in messages</span>
              </label>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visibility Settings
            </h2>

            <div className="space-y-3 pl-7">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="showOnlineStatus"
                  defaultChecked={privacySettings.showOnlineStatus}
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-gray-700">Show online status to chat participants</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="showReadReceipts"
                  defaultChecked={privacySettings.showReadReceipts}
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-gray-700">Show read receipts</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="showTypingIndicators"
                  defaultChecked={privacySettings.showTypingIndicators}
                  className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                />
                <span className="text-gray-700">Show typing indicators</span>
              </label>
            </div>
          </div>

          {/* Auto-Response (Providers only) */}
          {!isCustomer && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Auto-Response</h2>
              <div className="pl-7">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="autoRespondWhenOffline"
                    defaultChecked={privacySettings.autoRespondWhenOffline}
                    className="w-4 h-4 text-[#01502E] border-gray-300 rounded focus:ring-[#01502E]"
                  />
                  <span className="text-gray-700">Send auto-response when offline</span>
                </label>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#01502E] text-white px-6 py-2 rounded-lg hover:bg-[#013d23] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </Form>
      </div>

      {/* Block User Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          Block Users
        </h2>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="action" value="blockUser" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID to Block
              </label>
              <input
                type="text"
                name="targetUserId"
                value={blockUserId}
                onChange={(e) => setBlockUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#01502E] focus:border-[#01502E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <select
                name="reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#01502E] focus:border-[#01502E]"
              >
                <option value="">Select reason</option>
                <option value="spam">Spam messages</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="scam">Scam attempt</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!blockUserId || isSubmitting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Block User
          </button>
        </Form>
      </div>

      {/* Blocked Users List */}
      {blockedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blocked Users</h2>
          
          <div className="space-y-3">
            {blockedUsers.map((blockedUser) => (
              <div key={blockedUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{blockedUser.name}</div>
                  <div className="text-sm text-gray-500">
                    {blockedUser.role} • Blocked {new Date(blockedUser.blockedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <Form method="post" className="inline">
                  <input type="hidden" name="action" value="unblockUser" />
                  <input type="hidden" name="targetUserId" value={blockedUser.id} />
                  <button
                    type="submit"
                    className="text-[#01502E] hover:text-[#013d23] font-medium"
                  >
                    Unblock
                  </button>
                </Form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Security Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li>• Never share payment information in chat messages</li>
          <li>• Be cautious of users asking for personal information</li>
          <li>• Report suspicious behavior to our support team</li>
          <li>• Use the block feature if someone makes you uncomfortable</li>
          <li>• Keep your conversations professional and respectful</li>
        </ul>
      </div>
    </div>
  );
}
