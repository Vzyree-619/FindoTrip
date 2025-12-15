import React, { useState } from "react";
import { Settings, Bell, Shield, Palette, Volume2, VolumeX, Eye, EyeOff, MessageCircle } from "lucide-react";

interface ChatSettingsProps {
  settings: {
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
  className?: string;
}

export function ChatSettings({ settings, onSettingsChange, className }: ChatSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const SettingToggle = ({ 
    label, 
    description, 
    checked, 
    onChange, 
    icon: Icon 
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-[#01502E] focus:ring-[#01502E]"
      />
      <Icon className="w-5 h-5 text-gray-500" />
      <div>
        <span className="font-medium text-gray-900">{label}</span>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </label>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Appearance Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        </div>

        <div className="space-y-4">
          <SettingToggle
            label="Enable Notifications"
            description="Receive notifications for new messages"
            checked={localSettings.notificationsEnabled}
            onChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
            icon={Bell}
          />

          <SettingToggle
            label="Sound Notifications"
            description="Play sound for new messages"
            checked={localSettings.soundEnabled}
            onChange={(checked) => handleSettingChange('soundEnabled', checked)}
            icon={Volume2}
          />

          <SettingToggle
            label="Message Preview"
            description="Show message content in notifications"
            checked={localSettings.messagePreview}
            onChange={(checked) => handleSettingChange('messagePreview', checked)}
            icon={MessageCircle}
          />
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
        </div>

        <div className="space-y-4">
          <SettingToggle
            label="Show Online Status"
            description="Let others see when you're online"
            checked={localSettings.showOnlineStatus}
            onChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
            icon={Eye}
          />

          <SettingToggle
            label="Read Receipts"
            description="Let others know when you've read their messages"
            checked={localSettings.showReadReceipts}
            onChange={(checked) => handleSettingChange('showReadReceipts', checked)}
            icon={Eye}
          />

          <SettingToggle
            label="Typing Indicators"
            description="Show when you're typing a message"
            checked={localSettings.showTypingIndicators}
            onChange={(checked) => handleSettingChange('showTypingIndicators', checked)}
            icon={MessageCircle}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced</h3>
        </div>

        <div className="space-y-4">
          <SettingToggle
            label="Auto-download Media"
            description="Automatically download images and files"
            checked={localSettings.autoDownloadMedia}
            onChange={(checked) => handleSettingChange('autoDownloadMedia', checked)}
            icon={Settings}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatSettings;
