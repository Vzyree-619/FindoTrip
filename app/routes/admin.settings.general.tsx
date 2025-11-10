import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Settings, 
  Save,
  Globe,
  CreditCard,
  Shield,
  Bell,
  Users,
  Building,
  Car,
  MapPin,
  Star,
  MessageSquare,
  Heart,
  Share2,
  Gift,
  DollarSign,
  Image,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Wrench,
  Database,
  Server,
  Cloud,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Tag,
  User,
  Mail,
  Phone,
  Map,
  Navigation,
  Compass,
  Target,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Power,
  Plug,
  Unplug,
  Cable,
  Router,
  HardDrive,
  Cpu,
  Memory,
  Network,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Cloud as CloudIcon,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudMoon,
  CloudSun,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Sparkles,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply,
  Forward,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Target as TargetIcon,
  Timer,
  User as UserIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Tag as TagIcon,
  FileText as FileTextIcon,
  Paperclip,
  Image as ImageIcon,
  File,
  Video,
  Music,
  Archive,
  MessageSquare as MessageSquareIcon,
  RefreshCw as RefreshCwIcon,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  Grip,
  MoreHorizontal,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Stop,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);

  // Some models may not exist in the current Prisma schema.
  // Guard all Prisma calls and fall back to defaults.
  const db: any = prisma as any;
  let settings: any = null;
  let paymentGateways: any[] = [];
  let featureToggles: any[] = [];
  let platformLimits: any[] = [];
  let maintenanceMode: any = null;

  try {
    if (db.platformSettings?.findFirst) {
      settings = await db.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    }
  } catch (e) {
    console.warn('platformSettings not available or failed to load', e);
  }

  try {
    if (db.paymentGateway?.findMany) {
      paymentGateways = await db.paymentGateway.findMany({ where: { isActive: true }, orderBy: { isPrimary: 'desc' } });
    }
  } catch (e) {
    console.warn('paymentGateway not available or failed to load', e);
  }

  try {
    if (db.featureToggle?.findMany) {
      featureToggles = await db.featureToggle.findMany({ orderBy: { category: 'asc' } });
    }
  } catch (e) {
    console.warn('featureToggle not available or failed to load', e);
  }

  try {
    if (db.platformLimit?.findMany) {
      platformLimits = await db.platformLimit.findMany({ orderBy: { category: 'asc' } });
    }
  } catch (e) {
    console.warn('platformLimit not available or failed to load', e);
  }

  try {
    if (db.maintenanceMode?.findFirst) {
      maintenanceMode = await db.maintenanceMode.findFirst({ orderBy: { createdAt: 'desc' } });
    }
  } catch (e) {
    console.warn('maintenanceMode not available or failed to load', e);
  }
  
  return json({
    admin,
    settings: settings || {
      platformName: 'FindoTrip',
      platformDescription: 'Your trusted travel booking platform',
      platformLogo: '',
      platformFavicon: '',
      defaultCurrency: 'USD',
      defaultLanguage: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      commissionRate: 10,
      taxRate: 0,
      supportEmail: 'support@findotrip.com',
      supportPhone: '+1-555-0123',
      supportHours: '24/7',
      termsOfService: '',
      privacyPolicy: '',
      refundPolicy: '',
      cancellationPolicy: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    paymentGateways,
    featureToggles,
    platformLimits,
    maintenanceMode
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const db: any = prisma as any;
  
  try {
    if (action === 'save_general_settings') {
      const platformName = formData.get('platformName') as string;
      const platformDescription = formData.get('platformDescription') as string;
      const defaultCurrency = formData.get('defaultCurrency') as string;
      const defaultLanguage = formData.get('defaultLanguage') as string;
      const timezone = formData.get('timezone') as string;
      const dateFormat = formData.get('dateFormat') as string;
      const timeFormat = formData.get('timeFormat') as string;
      const commissionRate = parseFloat(formData.get('commissionRate') as string);
      const taxRate = parseFloat(formData.get('taxRate') as string);
      const supportEmail = formData.get('supportEmail') as string;
      const supportPhone = formData.get('supportPhone') as string;
      const supportHours = formData.get('supportHours') as string;
      
      if (db.platformSettings?.upsert) {
        await db.platformSettings.upsert({
          where: { id: 'default' },
          update: {
            platformName,
            platformDescription,
            defaultCurrency,
            defaultLanguage,
            timezone,
            dateFormat,
            timeFormat,
            commissionRate,
            taxRate,
            supportEmail,
            supportPhone,
            supportHours,
            updatedAt: new Date()
          },
          create: {
            id: 'default',
            platformName,
            platformDescription,
            defaultCurrency,
            defaultLanguage,
            timezone,
            dateFormat,
            timeFormat,
            commissionRate,
            taxRate,
            supportEmail,
            supportPhone,
            supportHours
          }
        });
      }
      
      await logAdminAction(admin.id, 'UPDATE_GENERAL_SETTINGS', 'Updated general platform settings', request);
      
    } else if (action === 'save_payment_gateways') {
      const primaryGateway = formData.get('primaryGateway') as string;
      const backupGateway = formData.get('backupGateway') as string;
      const testMode = formData.get('testMode') === 'true';
      const acceptedMethods = JSON.parse(formData.get('acceptedMethods') as string);
      
      // Update primary/backup gateways if model exists
      if (db.paymentGateway?.updateMany && db.paymentGateway?.update) {
        await db.paymentGateway.updateMany({ where: { isPrimary: true }, data: { isPrimary: false } });
        if (primaryGateway) {
          await db.paymentGateway.update({ where: { id: primaryGateway }, data: { isPrimary: true, testMode } });
        }
        if (backupGateway) {
          await db.paymentGateway.update({ where: { id: backupGateway }, data: { isBackup: true } });
        }
      }

      // Update accepted payment methods if model exists (AcceptedPaymentMethod collection)
      if (db.acceptedPaymentMethod?.updateMany && db.acceptedPaymentMethod?.upsert) {
        await db.acceptedPaymentMethod.updateMany({ data: { isEnabled: false } });
        for (const method of acceptedMethods) {
          await db.acceptedPaymentMethod.upsert({ where: { type: method }, update: { isEnabled: true }, create: { type: method, isEnabled: true } });
        }
      }
      
      await logAdminAction(admin.id, 'UPDATE_PAYMENT_GATEWAYS', 'Updated payment gateway settings', request);
      
    } else if (action === 'save_feature_toggles') {
      const features = JSON.parse(formData.get('features') as string);
      
      if (db.featureToggle?.upsert) {
        for (const feature of features) {
          await db.featureToggle.upsert({
            where: { id: feature.id },
            update: { isEnabled: feature.isEnabled },
            create: {
              id: feature.id,
              name: feature.name,
              description: feature.description,
              category: feature.category,
              isEnabled: feature.isEnabled
            }
          });
        }
      }
      
      await logAdminAction(admin.id, 'UPDATE_FEATURE_TOGGLES', 'Updated feature toggles', request);
      
    } else if (action === 'save_platform_limits') {
      const limits = JSON.parse(formData.get('limits') as string);
      
      if (db.platformLimit?.upsert) {
        for (const limit of limits) {
          await db.platformLimit.upsert({
            where: { id: limit.id },
            update: { value: limit.value },
            create: {
              id: limit.id,
              name: limit.name,
              description: limit.description,
              category: limit.category,
              value: limit.value,
              unit: limit.unit
            }
          });
        }
      }
      
      await logAdminAction(admin.id, 'UPDATE_PLATFORM_LIMITS', 'Updated platform limits', request);
      
    } else if (action === 'toggle_maintenance_mode') {
      const isEnabled = formData.get('isEnabled') === 'true';
      const message = formData.get('message') as string;
      const estimatedEndTime = formData.get('estimatedEndTime') as string;
      
      if (db.maintenanceMode?.create && db.maintenanceMode?.updateMany) {
        if (isEnabled) {
          await db.maintenanceMode.create({
            data: {
              isEnabled: true,
              message,
              estimatedEndTime: estimatedEndTime ? new Date(estimatedEndTime) : null,
              startedBy: admin.id
            }
          });
        } else {
          await db.maintenanceMode.updateMany({
            where: { isEnabled: true },
            data: { 
              isEnabled: false,
              endedAt: new Date(),
              endedBy: admin.id
            }
          });
        }
      }
      
      await logAdminAction(admin.id, 'TOGGLE_MAINTENANCE_MODE', `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Settings action error:', error);
    return json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}

export default function GeneralSettings() {
  const { admin, settings, paymentGateways, featureToggles, platformLimits, maintenanceMode } = useLoaderData<typeof loader>();
  const [formData, setFormData] = useState({
    // General Settings
    platformName: settings.platformName,
    platformDescription: settings.platformDescription,
    defaultCurrency: settings.defaultCurrency,
    defaultLanguage: settings.defaultLanguage,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    commissionRate: settings.commissionRate,
    taxRate: settings.taxRate,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    supportHours: settings.supportHours,
    
    // Payment Gateways
    primaryGateway: paymentGateways.find(g => g.isPrimary)?.id || '',
    backupGateway: paymentGateways.find(g => g.isBackup)?.id || '',
    testMode: paymentGateways.find(g => g.isPrimary)?.testMode || false,
    acceptedMethods: ['credit_card', 'paypal'],
    
    // Feature Toggles
    features: featureToggles.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      category: f.category,
      isEnabled: f.isEnabled
    })),
    
    // Platform Limits
    limits: platformLimits.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description,
      category: l.category,
      value: l.value,
      unit: l.unit
    })),
    
    // Maintenance Mode
    maintenanceEnabled: maintenanceMode?.isEnabled || false,
    maintenanceMessage: maintenanceMode?.message || '',
    estimatedEndTime: maintenanceMode?.estimatedEndTime ? new Date(maintenanceMode.estimatedEndTime).toISOString().slice(0, 16) : ''
  });
  
  const fetcher = useFetcher();
  
  const handleSaveGeneralSettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_general_settings');
    formDataToSubmit.append('platformName', formData.platformName);
    formDataToSubmit.append('platformDescription', formData.platformDescription);
    formDataToSubmit.append('defaultCurrency', formData.defaultCurrency);
    formDataToSubmit.append('defaultLanguage', formData.defaultLanguage);
    formDataToSubmit.append('timezone', formData.timezone);
    formDataToSubmit.append('dateFormat', formData.dateFormat);
    formDataToSubmit.append('timeFormat', formData.timeFormat);
    formDataToSubmit.append('commissionRate', formData.commissionRate.toString());
    formDataToSubmit.append('taxRate', formData.taxRate.toString());
    formDataToSubmit.append('supportEmail', formData.supportEmail);
    formDataToSubmit.append('supportPhone', formData.supportPhone);
    formDataToSubmit.append('supportHours', formData.supportHours);
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSavePaymentGateways = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_payment_gateways');
    formDataToSubmit.append('primaryGateway', formData.primaryGateway);
    formDataToSubmit.append('backupGateway', formData.backupGateway);
    formDataToSubmit.append('testMode', formData.testMode.toString());
    formDataToSubmit.append('acceptedMethods', JSON.stringify(formData.acceptedMethods));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveFeatureToggles = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_feature_toggles');
    formDataToSubmit.append('features', JSON.stringify(formData.features));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSavePlatformLimits = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_platform_limits');
    formDataToSubmit.append('limits', JSON.stringify(formData.limits));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleToggleMaintenanceMode = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'toggle_maintenance_mode');
    formDataToSubmit.append('isEnabled', formData.maintenanceEnabled.toString());
    formDataToSubmit.append('message', formData.maintenanceMessage);
    formDataToSubmit.append('estimatedEndTime', formData.estimatedEndTime);
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId ? { ...f, isEnabled: !f.isEnabled } : f
      )
    }));
  };
  
  const handleLimitChange = (limitId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      limits: prev.limits.map(l => 
        l.id === limitId ? { ...l, value } : l
      )
    }));
  };
  
  const handlePaymentMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedMethods: prev.acceptedMethods.includes(method)
        ? prev.acceptedMethods.filter(m => m !== method)
        : [...prev.acceptedMethods, method]
    }));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure your platform's general settings and features</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
        </div>
      </div>
      
      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Name
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Currency
            </label>
            <select
              value={formData.defaultCurrency}
              onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={formData.defaultLanguage}
              onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="30"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform Description
          </label>
          <textarea
            value={formData.platformDescription}
            onChange={(e) => setFormData({ ...formData, platformDescription: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveGeneralSettings}
            disabled={fetcher.state === 'submitting'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Payment Gateway Configuration */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Gateway Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Gateway
            </label>
            <select
              value={formData.primaryGateway}
              onChange={(e) => setFormData({ ...formData, primaryGateway: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Primary Gateway</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="square">Square</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Gateway
            </label>
            <select
              value={formData.backupGateway}
              onChange={(e) => setFormData({ ...formData, backupGateway: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Backup Gateway</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="square">Square</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={formData.testMode}
              onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Enable Test Mode</label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accepted Payment Methods
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'credit_card', name: 'Credit/Debit Cards', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'paypal', name: 'PayPal', icon: <Globe className="w-4 h-4" /> },
                { id: 'apple_pay', name: 'Apple Pay', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'google_pay', name: 'Google Pay', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'bank_transfer', name: 'Bank Transfer', icon: <Building className="w-4 h-4" /> }
              ].map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.acceptedMethods.includes(method.id)}
                    onChange={() => handlePaymentMethodToggle(method.id)}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-2">
                    {method.icon}
                    <span className="text-sm text-gray-700">{method.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSavePaymentGateways}
            disabled={fetcher.state === 'submitting'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Feature Toggles */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Feature Toggles</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { id: 'instant_booking', name: 'Allow Instant Booking', description: 'No provider approval required', category: 'booking' },
            { id: 'reviews', name: 'Enable Reviews', description: 'Allow users to leave reviews', category: 'social' },
            { id: 'favorites', name: 'Enable Favorites/Wishlist', description: 'Allow users to save favorites', category: 'social' },
            { id: 'messaging', name: 'Enable Messaging Between Users', description: 'Allow direct user communication', category: 'communication' },
            { id: 'social_sharing', name: 'Enable Social Sharing', description: 'Allow sharing on social media', category: 'social' },
            { id: 'promotions', name: 'Enable Promotions/Discounts', description: 'Allow promotional campaigns', category: 'marketing' },
            { id: 'multi_currency', name: 'Enable Multi-Currency Booking', description: 'Support multiple currencies', category: 'payment' },
            { id: 'gift_cards', name: 'Enable Gift Cards', description: 'Allow gift card purchases', category: 'payment' }
          ].map((feature) => (
            <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{feature.name}</h3>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  feature.category === 'booking' ? 'bg-blue-100 text-blue-800' :
                  feature.category === 'social' ? 'bg-green-100 text-green-800' :
                  feature.category === 'communication' ? 'bg-yellow-100 text-yellow-800' :
                  feature.category === 'marketing' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {feature.category}
                </span>
                <input
                  type="checkbox"
                  checked={formData.features.find(f => f.id === feature.id)?.isEnabled || false}
                  onChange={() => handleFeatureToggle(feature.id)}
                  className="rounded"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveFeatureToggles}
            disabled={fetcher.state === 'submitting'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Features'}
          </Button>
        </div>
      </Card>
      
      {/* Limits & Restrictions */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Limits & Restrictions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: 'max_properties', name: 'Max Properties Per Owner', unit: 'properties' },
            { id: 'max_vehicles', name: 'Max Vehicles Per Owner', unit: 'vehicles' },
            { id: 'max_tours', name: 'Max Tours Per Guide', unit: 'tours' },
            { id: 'max_images', name: 'Max Images Per Listing', unit: 'images' },
            { id: 'max_review_length', name: 'Max Review Length', unit: 'characters' },
            { id: 'max_message_length', name: 'Max Message Length', unit: 'characters' }
          ].map((limit) => (
            <div key={limit.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {limit.name}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={formData.limits.find(l => l.id === limit.id)?.value || 0}
                  onChange={(e) => handleLimitChange(limit.id, parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">{limit.unit}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSavePlatformLimits}
            disabled={fetcher.state === 'submitting'}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Limits'}
          </Button>
        </div>
      </Card>
      
      {/* Maintenance Mode */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Wrench className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Mode</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.maintenanceEnabled}
              onChange={(e) => setFormData({ ...formData, maintenanceEnabled: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Enable Maintenance Mode</label>
          </div>
          
          {formData.maintenanceEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  value={formData.maintenanceMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="We're currently performing maintenance. We'll be back shortly. Thank you for your patience!"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.estimatedEndTime}
                  onChange={(e) => setFormData({ ...formData, estimatedEndTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleToggleMaintenanceMode}
            disabled={fetcher.state === 'submitting'}
            className={`${formData.maintenanceEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {formData.maintenanceEnabled ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                {fetcher.state === 'submitting' ? 'Disabling...' : 'Disable Maintenance Mode'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {fetcher.state === 'submitting' ? 'Enabling...' : 'Enable Maintenance Mode'}
              </>
            )}
          </Button>
        </div>
      </Card>
      
      {/* Save All Settings */}
      <div className="flex items-center justify-center">
        <Button
          onClick={() => {
            handleSaveGeneralSettings();
            handleSavePaymentGateways();
            handleSaveFeatureToggles();
            handleSavePlatformLimits();
          }}
          disabled={fetcher.state === 'submitting'}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
        >
          <Save className="w-5 h-5 mr-2" />
          {fetcher.state === 'submitting' ? 'Saving All Settings...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
