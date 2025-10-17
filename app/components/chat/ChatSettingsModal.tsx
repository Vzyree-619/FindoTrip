import React, { useState } from "react";
import { X, Settings, Bell, Shield, Palette } from "lucide-react";

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    theme: string;
    fontSize: string;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    showOnlineStatus: boolean;
    showReadReceipts: boolean;
    showTypingIndicators: boolean;
    autoDownloadMedia: boolean;
    messagePreview: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export function ChatSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: ChatSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#01502E]" />
            <h2 className="text-xl font-semibold text-gray-900">Chat Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appearance */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Appearance</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'auto', label: 'Auto' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={localSettings.theme === option.value}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="text-[#01502E] focus:ring-[#01502E]"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={localSettings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Notifications</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Enable notifications</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Sound notifications</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.messagePreview}
                  onChange={(e) => handleSettingChange('messagePreview', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Message preview in notifications</span>
              </label>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Privacy</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.showOnlineStatus}
                  onChange={(e) => handleSettingChange('showOnlineStatus', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Show online status</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.showReadReceipts}
                  onChange={(e) => handleSettingChange('showReadReceipts', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Read receipts</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.showTypingIndicators}
                  onChange={(e) => handleSettingChange('showTypingIndicators', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Typing indicators</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.autoDownloadMedia}
                  onChange={(e) => handleSettingChange('autoDownloadMedia', e.target.checked)}
                  className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
                />
                <span className="text-sm">Auto-download media</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#01502E] text-white rounded-md hover:bg-[#013d23] transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatSettingsModal;
