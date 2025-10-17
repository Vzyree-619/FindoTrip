import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Mail, 
  CreditCard, 
  Globe, 
  Bell,
  Database,
  Server,
  Lock,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  EyeOff
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get current platform settings (mock data for now)
  const settings = {
    general: {
      siteName: "FindoTrip",
      siteDescription: "Multi-service booking platform for properties, vehicles, and tours",
      siteUrl: "https://findotrip.com",
      adminEmail: "admin@findotrip.com",
      supportEmail: "support@findotrip.com",
      phone: "+92 300 1234567",
      address: "Karachi, Pakistan",
      timezone: "Asia/Karachi",
      currency: "PKR",
      language: "en"
    },
    business: {
      commissionRate: 10,
      minCommission: 100,
      maxCommission: 5000,
      paymentTerms: 7,
      refundPolicy: 24,
      cancellationPolicy: 48
    },
    security: {
      requireEmailVerification: true,
      requirePhoneVerification: true,
      requireIdentityVerification: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      passwordMinLength: 8,
      requireStrongPassword: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      adminNotifications: true,
      bookingNotifications: true,
      paymentNotifications: true,
      reviewNotifications: true,
      marketingEmails: false
    },
    features: {
      enableReviews: true,
      enableRatings: true,
      enableWishlist: true,
      enableFavorites: true,
      enableChat: true,
      enableVideoCalls: false,
      enableLiveTracking: false,
      enableMultiLanguage: false,
      enableDarkMode: true
    },
    integrations: {
      googleMaps: true,
      googleAnalytics: true,
      facebookPixel: false,
      stripePayment: true,
      jazzcashPayment: true,
      easypaisaPayment: false,
      smsGateway: true,
      emailService: true,
      cloudStorage: true
    },
    limits: {
      maxPropertiesPerOwner: 10,
      maxVehiclesPerOwner: 5,
      maxToursPerGuide: 20,
      maxBookingsPerUser: 50,
      maxImagesPerListing: 20,
      maxFileSize: 5,
      maxUsersPerDay: 1000,
      maxBookingsPerDay: 500
    }
  };
  
  return json({ admin, settings });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const section = formData.get('section') as string;
  const settings = JSON.parse(formData.get('settings') as string);
  
  try {
    // In a real application, you would save these to a database
    // For now, we'll just log the action
    await logAdminAction(admin.id, 'SETTINGS_UPDATE', `Updated ${section} settings`, request);
    
    return json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    return json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}

export default function AdminSettings() {
  const { admin, settings } = useLoaderData<typeof loader>();
  const [activeSection, setActiveSection] = useState('general');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetcher = useFetcher();
  
  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'business', label: 'Business', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'features', label: 'Features', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: Server },
    { id: 'limits', label: 'Limits', icon: Users }
  ];
  
  const handleSave = (section: string, data: any) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('section', section);
    formData.append('settings', JSON.stringify(data));
    fetcher.submit(formData, { method: 'post' });
    setIsLoading(false);
  };
  
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
          <input
            type="text"
            defaultValue={settings.general.siteName}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
          <input
            type="url"
            defaultValue={settings.general.siteUrl}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
        <textarea
          defaultValue={settings.general.siteDescription}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
          <input
            type="email"
            defaultValue={settings.general.adminEmail}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
          <input
            type="email"
            defaultValue={settings.general.supportEmail}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            defaultValue={settings.general.phone}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            defaultValue={settings.general.currency}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PKR">PKR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            defaultValue={settings.general.language}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="ur">Urdu</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
          <input
            type="number"
            defaultValue={settings.business.commissionRate}
            min="0"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Min Commission (PKR)</label>
          <input
            type="number"
            defaultValue={settings.business.minCommission}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Commission (PKR)</label>
          <input
            type="number"
            defaultValue={settings.business.maxCommission}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (days)</label>
          <input
            type="number"
            defaultValue={settings.business.paymentTerms}
            min="1"
            max="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Refund Policy (hours)</label>
          <input
            type="number"
            defaultValue={settings.business.refundPolicy}
            min="0"
            max="168"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy (hours)</label>
          <input
            type="number"
            defaultValue={settings.business.cancellationPolicy}
            min="0"
            max="168"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
  
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Verification</h3>
            <p className="text-xs text-gray-500">Require email verification for new users</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.security.requireEmailVerification}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Phone Verification</h3>
            <p className="text-xs text-gray-500">Require phone verification for new users</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.security.requirePhoneVerification}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            defaultValue={settings.security.sessionTimeout}
            min="5"
            max="480"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
          <input
            type="number"
            defaultValue={settings.security.maxLoginAttempts}
            min="3"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
          <input
            type="number"
            defaultValue={settings.security.lockoutDuration}
            min="5"
            max="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
          <input
            type="number"
            defaultValue={settings.security.passwordMinLength}
            min="6"
            max="20"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
  
  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
            <p className="text-xs text-gray-500">Send email notifications to users</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.notifications.emailNotifications}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
            <p className="text-xs text-gray-500">Send SMS notifications to users</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.notifications.smsNotifications}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
            <p className="text-xs text-gray-500">Send push notifications to mobile apps</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.notifications.pushNotifications}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Admin Notifications</h3>
            <p className="text-xs text-gray-500">Send notifications to admin panel</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.notifications.adminNotifications}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
  
  const renderFeatureSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Reviews & Ratings</h3>
            <p className="text-xs text-gray-500">Allow users to review and rate services</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.features.enableReviews}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Wishlist</h3>
            <p className="text-xs text-gray-500">Allow users to save favorites</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.features.enableWishlist}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Chat System</h3>
            <p className="text-xs text-gray-500">Enable messaging between users</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.features.enableChat}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Dark Mode</h3>
            <p className="text-xs text-gray-500">Enable dark theme for users</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.features.enableDarkMode}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
  
  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Google Maps</h3>
            <p className="text-xs text-gray-500">Enable Google Maps integration</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.integrations.googleMaps}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Stripe Payment</h3>
            <p className="text-xs text-gray-500">Enable Stripe payment processing</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.integrations.stripePayment}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">JazzCash Payment</h3>
            <p className="text-xs text-gray-500">Enable JazzCash payment processing</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.integrations.jazzcashPayment}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">SMS Gateway</h3>
            <p className="text-xs text-gray-500">Enable SMS notifications</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.integrations.smsGateway}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
  
  const renderLimitSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Properties per Owner</label>
          <input
            type="number"
            defaultValue={settings.limits.maxPropertiesPerOwner}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Vehicles per Owner</label>
          <input
            type="number"
            defaultValue={settings.limits.maxVehiclesPerOwner}
            min="1"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Tours per Guide</label>
          <input
            type="number"
            defaultValue={settings.limits.maxToursPerGuide}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Bookings per User</label>
          <input
            type="number"
            defaultValue={settings.limits.maxBookingsPerUser}
            min="1"
            max="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Images per Listing</label>
          <input
            type="number"
            defaultValue={settings.limits.maxImagesPerListing}
            min="1"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
          <input
            type="number"
            defaultValue={settings.limits.maxFileSize}
            min="1"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
  
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'business': return renderBusinessSettings();
      case 'security': return renderSecuritySettings();
      case 'notifications': return renderNotificationSettings();
      case 'features': return renderFeatureSettings();
      case 'integrations': return renderIntegrationSettings();
      case 'limits': return renderLimitSettings();
      default: return renderGeneralSettings();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            size="sm"
            onClick={() => handleSave(activeSection, {})}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {sections.find(s => s.id === activeSection)?.label} Settings
              </h2>
              {fetcher.data?.success && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Settings saved successfully</span>
                </div>
              )}
            </div>
            
            {renderSectionContent()}
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-end space-x-4">
                <Button variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSave(activeSection, {})}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
