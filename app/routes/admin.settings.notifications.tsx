import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Bell, 
  Save,
  Edit,
  Eye,
  Send,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Minus,
  Trash2,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Target,
  Timer,
  User,
  Users,
  Calendar,
  Tag,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  MessageSquare,
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
  Diamond,
  Settings,
  Globe,
  CreditCard,
  Shield,
  Building,
  Car,
  MapPin,
  Star,
  Heart,
  Share2,
  Gift,
  DollarSign,
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
  EyeOff,
  Bot,
  Cpu,
  HardDrive,
  Network,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Power,
  Plug,
  Unplug,
  Cable,
  Router,
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
  Reply,
  Forward,
  Bookmark as BookmarkIcon,
  BookmarkCheck as BookmarkCheckIcon,
  Lightbulb as LightbulbIcon,
  Target as TargetIcon,
  Timer as TimerIcon,
  User as UserIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Tag as TagIcon,
  FileText as FileTextIcon,
  Paperclip as PaperclipIcon,
  Image as ImageIcon,
  File as FileIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Archive as ArchiveIcon,
  MessageSquare as MessageSquareIcon,
  RefreshCw as RefreshCwIcon2,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Move as MoveIcon,
  Grip as GripIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Hexagon as HexagonIcon,
  Octagon as OctagonIcon,
  Diamond as DiamondIcon,
  Mail,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Monitor,
  Phone,
  MessageCircle,
  AlertCircle,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get notification settings
  const notificationSettings = await prisma.notificationSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  // Get admin notification recipients
  const adminRecipients = await prisma.adminNotificationRecipient.findMany({
    orderBy: { email: 'asc' }
  });
  
  // Get push notification settings
  const pushSettings = await prisma.pushNotificationSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  // Get SMS settings
  const smsSettings = await prisma.smsSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  // Get notification statistics
  const notificationStats = await Promise.all([
    prisma.notificationLog.count({ 
      where: { 
        sentAt: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.notificationLog.count({ 
      where: { 
        sentAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.notificationLog.count({ 
      where: { 
        type: 'EMAIL',
        sentAt: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.notificationLog.count({ 
      where: { 
        type: 'SMS',
        sentAt: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        } 
      } 
    })
  ]);
  
  return json({
    admin,
    notificationSettings: notificationSettings || {
      adminNotifications: {
        newUserRegistration: true,
        newProviderApplication: true,
        newServiceListing: true,
        newSupportTicket: true,
        highPriorityTicket: true,
        paymentFailures: true,
        flaggedReviews: true,
        bookingDisputes: true,
        everyNewBooking: false,
        dailySummary: true,
        weeklyAnalytics: true
      },
      userNotifications: {
        customers: {
          bookingConfirmations: true,
          paymentReceipts: true,
          bookingReminders: true,
          newMessages: true,
          reviewRequests: true,
          promotionalOffers: true
        },
        providers: {
          newBookingNotifications: true,
          approvalStatusUpdates: true,
          newCustomerMessages: true,
          newReviews: true,
          payoutProcessed: true,
          platformUpdates: true
        }
      },
      pushNotifications: {
        enabled: true,
        serviceWorkerActive: true
      },
      smsNotifications: {
        enabled: true,
        provider: 'twilio',
        remainingCredits: 5000
      }
    },
    adminRecipients,
    pushSettings,
    smsSettings,
    notificationStats: {
      sentToday: notificationStats[0],
      sentThisWeek: notificationStats[1],
      emailsToday: notificationStats[2],
      smsToday: notificationStats[3]
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  
  try {
    if (action === 'save_admin_notifications') {
      const adminNotifications = JSON.parse(formData.get('adminNotifications') as string);
      
      await prisma.notificationSettings.upsert({
        where: { id: 'default' },
        update: {
          adminNotifications,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          adminNotifications
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_ADMIN_NOTIFICATIONS', 'Updated admin notification settings', request);
      
    } else if (action === 'save_user_notifications') {
      const userNotifications = JSON.parse(formData.get('userNotifications') as string);
      
      await prisma.notificationSettings.upsert({
        where: { id: 'default' },
        update: {
          userNotifications,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          userNotifications
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_USER_NOTIFICATIONS', 'Updated user notification settings', request);
      
    } else if (action === 'save_push_settings') {
      const pushSettings = JSON.parse(formData.get('pushSettings') as string);
      
      await prisma.pushNotificationSettings.upsert({
        where: { id: 'default' },
        update: {
          ...pushSettings,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          ...pushSettings
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_PUSH_SETTINGS', 'Updated push notification settings', request);
      
    } else if (action === 'save_sms_settings') {
      const smsSettings = JSON.parse(formData.get('smsSettings') as string);
      
      await prisma.smsSettings.upsert({
        where: { id: 'default' },
        update: {
          ...smsSettings,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          ...smsSettings
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_SMS_SETTINGS', 'Updated SMS notification settings', request);
      
    } else if (action === 'add_admin_recipient') {
      const email = formData.get('email') as string;
      const name = formData.get('name') as string;
      const isSmsEnabled = formData.get('isSmsEnabled') === 'true';
      const phoneNumber = formData.get('phoneNumber') as string;
      
      await prisma.adminNotificationRecipient.create({
        data: {
          email,
          name,
          isSmsEnabled,
          phoneNumber: isSmsEnabled ? phoneNumber : null
        }
      });
      
      await logAdminAction(admin.id, 'ADD_ADMIN_RECIPIENT', `Added admin recipient: ${email}`, request);
      
    } else if (action === 'remove_admin_recipient') {
      const recipientId = formData.get('recipientId') as string;
      
      const recipient = await prisma.adminNotificationRecipient.findUnique({
        where: { id: recipientId },
        select: { email: true }
      });
      
      if (!recipient) {
        return json({ success: false, error: 'Recipient not found' }, { status: 404 });
      }
      
      await prisma.adminNotificationRecipient.delete({
        where: { id: recipientId }
      });
      
      await logAdminAction(admin.id, 'REMOVE_ADMIN_RECIPIENT', `Removed admin recipient: ${recipient.email}`, request);
      
    } else if (action === 'test_notification') {
      const type = formData.get('type') as string;
      const recipient = formData.get('recipient') as string;
      
      // Log test notification
      await prisma.notificationLog.create({
        data: {
          type: type.toUpperCase(),
          recipientEmail: recipient,
          recipientName: 'Test User',
          subject: 'Test Notification',
          content: 'This is a test notification',
          status: 'SENT',
          sentAt: new Date(),
          isTest: true
        }
      });
      
      await logAdminAction(admin.id, 'SEND_TEST_NOTIFICATION', `Sent test ${type} notification`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Notification settings action error:', error);
    return json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}

export default function NotificationSettings() {
  const { admin, notificationSettings, adminRecipients, pushSettings, smsSettings, notificationStats } = useLoaderData<typeof loader>();
  const [formData, setFormData] = useState({
    // Admin Notifications
    adminNotifications: notificationSettings.adminNotifications,
    
    // User Notifications
    userNotifications: notificationSettings.userNotifications,
    
    // Push Notifications
    pushSettings: pushSettings || {
      enabled: true,
      serviceWorkerActive: true,
      vapidPublicKey: '',
      vapidPrivateKey: ''
    },
    
    // SMS Settings
    smsSettings: smsSettings || {
      enabled: true,
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromNumber: '',
      remainingCredits: 5000
    },
    
    // New Admin Recipient
    newRecipient: {
      email: '',
      name: '',
      isSmsEnabled: false,
      phoneNumber: ''
    }
  });
  
  const fetcher = useFetcher();
  
  const handleSaveAdminNotifications = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_admin_notifications');
    formDataToSubmit.append('adminNotifications', JSON.stringify(formData.adminNotifications));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveUserNotifications = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_user_notifications');
    formDataToSubmit.append('userNotifications', JSON.stringify(formData.userNotifications));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSavePushSettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_push_settings');
    formDataToSubmit.append('pushSettings', JSON.stringify(formData.pushSettings));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveSmsSettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_sms_settings');
    formDataToSubmit.append('smsSettings', JSON.stringify(formData.smsSettings));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleAddAdminRecipient = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'add_admin_recipient');
    formDataToSubmit.append('email', formData.newRecipient.email);
    formDataToSubmit.append('name', formData.newRecipient.name);
    formDataToSubmit.append('isSmsEnabled', formData.newRecipient.isSmsEnabled.toString());
    formDataToSubmit.append('phoneNumber', formData.newRecipient.phoneNumber);
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
    
    setFormData(prev => ({
      ...prev,
      newRecipient: {
        email: '',
        name: '',
        isSmsEnabled: false,
        phoneNumber: ''
      }
    }));
  };
  
  const handleRemoveAdminRecipient = (recipientId: string) => {
    if (confirm('Are you sure you want to remove this admin recipient?')) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'remove_admin_recipient');
      formDataToSubmit.append('recipientId', recipientId);
      
      fetcher.submit(formDataToSubmit, { method: 'post' });
    }
  };
  
  const handleTestNotification = (type: string, recipient: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'test_notification');
    formDataToSubmit.append('type', type);
    formDataToSubmit.append('recipient', recipient);
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleAdminNotificationToggle = (key: string) => {
    setFormData(prev => ({
      ...prev,
      adminNotifications: {
        ...prev.adminNotifications,
        [key]: !prev.adminNotifications[key]
      }
    }));
  };
  
  const handleUserNotificationToggle = (userType: string, key: string) => {
    setFormData(prev => ({
      ...prev,
      userNotifications: {
        ...prev.userNotifications,
        [userType]: {
          ...prev.userNotifications[userType],
          [key]: !prev.userNotifications[userType][key]
        }
      }
    }));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Configure system notifications and communication preferences</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
        </div>
      </div>
      
      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sent Today</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.sentToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Emails Today</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.emailsToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Smartphone className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">SMS Today</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.smsToday}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.sentThisWeek}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Admin Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Admin Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Send notifications to admins for:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'newUserRegistration', label: 'New user registration', urgent: false },
              { key: 'newProviderApplication', label: 'New provider application (immediate)', urgent: true },
              { key: 'newServiceListing', label: 'New service listing submitted', urgent: false },
              { key: 'newSupportTicket', label: 'New support ticket (immediate)', urgent: true },
              { key: 'highPriorityTicket', label: 'High-priority support ticket (SMS + Email)', urgent: true },
              { key: 'paymentFailures', label: 'Payment failures', urgent: false },
              { key: 'flaggedReviews', label: 'Flagged reviews', urgent: false },
              { key: 'bookingDisputes', label: 'Booking disputes', urgent: false },
              { key: 'everyNewBooking', label: 'Every new booking (can be overwhelming)', urgent: false },
              { key: 'dailySummary', label: 'Daily summary report (8 AM)', urgent: false },
              { key: 'weeklyAnalytics', label: 'Weekly analytics report (Monday 9 AM)', urgent: false }
            ].map((notification) => (
              <div key={notification.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.adminNotifications[notification.key]}
                    onChange={() => handleAdminNotificationToggle(notification.key)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{notification.label}</p>
                    {notification.urgent && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveAdminNotifications}
            disabled={fetcher.state === 'submitting'}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Admin Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Admin Email Recipients */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Admin Email Recipients</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.newRecipient.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  newRecipient: { ...prev.newRecipient, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@platform.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.newRecipient.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  newRecipient: { ...prev.newRecipient, name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Admin Name"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.newRecipient.isSmsEnabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  newRecipient: { ...prev.newRecipient, isSmsEnabled: e.target.checked }
                }))}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">Enable SMS for urgent notifications</label>
            </div>
            
            {formData.newRecipient.isSmsEnabled && (
              <div className="flex-1">
                <input
                  type="tel"
                  value={formData.newRecipient.phoneNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newRecipient: { ...prev.newRecipient, phoneNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1-555-0123"
                />
              </div>
            )}
          </div>
          
          <Button
            onClick={handleAddAdminRecipient}
            disabled={fetcher.state === 'submitting' || !formData.newRecipient.email}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recipient
          </Button>
        </div>
        
        <div className="mt-6 space-y-3">
          {adminRecipients.map((recipient) => (
            <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{recipient.name}</p>
                  <p className="text-xs text-gray-600">{recipient.email}</p>
                  {recipient.isSmsEnabled && recipient.phoneNumber && (
                    <p className="text-xs text-gray-500">SMS: {recipient.phoneNumber}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleTestNotification('email', recipient.email)}
                  variant="outline"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
                {recipient.isSmsEnabled && recipient.phoneNumber && (
                  <Button
                    onClick={() => handleTestNotification('sms', recipient.phoneNumber)}
                    variant="outline"
                    size="sm"
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => handleRemoveAdminRecipient(recipient.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* User Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">User Notification Preferences (Defaults)</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customers receive:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'bookingConfirmations', label: 'Booking confirmations (Email)' },
                { key: 'paymentReceipts', label: 'Payment receipts (Email)' },
                { key: 'bookingReminders', label: 'Booking reminders (Email + Push)' },
                { key: 'newMessages', label: 'New messages (Email + Push)' },
                { key: 'reviewRequests', label: 'Review requests (Email)' },
                { key: 'promotionalOffers', label: 'Promotional offers (Email - user can opt out)' }
              ].map((notification) => (
                <div key={notification.key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.userNotifications.customers[notification.key]}
                    onChange={() => handleUserNotificationToggle('customers', notification.key)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{notification.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Providers receive:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'newBookingNotifications', label: 'New booking notifications (Email + SMS + Push)' },
                { key: 'approvalStatusUpdates', label: 'Approval status updates (Email + Push)' },
                { key: 'newCustomerMessages', label: 'New customer messages (Email + Push)' },
                { key: 'newReviews', label: 'New reviews (Email + Push)' },
                { key: 'payoutProcessed', label: 'Payout processed (Email)' },
                { key: 'platformUpdates', label: 'Platform updates (Email)' }
              ].map((notification) => (
                <div key={notification.key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.userNotifications.providers[notification.key]}
                    onChange={() => handleUserNotificationToggle('providers', notification.key)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{notification.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-xs text-gray-500">(Users can customize in their profile settings)</p>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveUserNotifications}
            disabled={fetcher.state === 'submitting'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save User Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Push Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Smartphone className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.pushSettings.enabled}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                pushSettings: { ...prev.pushSettings, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Enable Push Notifications</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Service Worker Status:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              formData.pushSettings.serviceWorkerActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {formData.pushSettings.serviceWorkerActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAPID Public Key
              </label>
              <input
                type="text"
                value={formData.pushSettings.vapidPublicKey}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pushSettings: { ...prev.pushSettings, vapidPublicKey: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter VAPID public key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAPID Private Key
              </label>
              <input
                type="password"
                value={formData.pushSettings.vapidPrivateKey}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pushSettings: { ...prev.pushSettings, vapidPrivateKey: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter VAPID private key"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSavePushSettings}
            disabled={fetcher.state === 'submitting'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Push Settings'}
          </Button>
        </div>
      </Card>
      
      {/* SMS Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Phone className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">SMS Notifications (via Twilio)</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              formData.smsSettings.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {formData.smsSettings.enabled ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Remaining Credits:</span>
            <span className="text-sm font-medium text-gray-900">{formData.smsSettings.remainingCredits.toLocaleString()} messages</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={formData.smsSettings.accountSid}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  smsSettings: { ...prev.smsSettings, accountSid: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Twilio Account SID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token
              </label>
              <input
                type="password"
                value={formData.smsSettings.authToken}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  smsSettings: { ...prev.smsSettings, authToken: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Twilio Auth Token"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Number
            </label>
            <input
              type="tel"
              value={formData.smsSettings.fromNumber}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                smsSettings: { ...prev.smsSettings, fromNumber: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1-555-0123"
            />
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View SMS Logs
            </Button>
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Top Up Credits
            </Button>
          </div>
          
          <Button
            onClick={handleSaveSmsSettings}
            disabled={fetcher.state === 'submitting'}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save SMS Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Save All Settings */}
      <div className="flex items-center justify-center">
        <Button
          onClick={() => {
            handleSaveAdminNotifications();
            handleSaveUserNotifications();
            handleSavePushSettings();
            handleSaveSmsSettings();
          }}
          disabled={fetcher.state === 'submitting'}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
        >
          <Save className="w-5 h-5 mr-2" />
          {fetcher.state === 'submitting' ? 'Saving All Settings...' : 'Save All Notification Settings'}
        </Button>
      </div>
    </div>
  );
}
