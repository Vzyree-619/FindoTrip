import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Shield, 
  Save,
  Edit,
  Eye,
  EyeOff,
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
  Bell,
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
  Key,
  KeyRound,
  Fingerprint,
  Smartphone,
  Mail,
  Phone,
  AlertCircle,
  Ban,
  CheckCircle2,
  XCircle2,
  Clock3,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  Bug,
  Wrench as WrenchIcon,
  Heart as HeartIcon2,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon2,
  BookmarkCheck as BookmarkCheckIcon2,
  Lightbulb as LightbulbIcon2,
  Target as TargetIcon2,
  Timer as TimerIcon2,
  User as UserIcon2,
  Users as UsersIcon2,
  Calendar as CalendarIcon2,
  Tag as TagIcon2,
  FileText as FileTextIcon2,
  Paperclip as PaperclipIcon2,
  Image as ImageIcon2,
  File as FileIcon2,
  Video as VideoIcon2,
  Music as MusicIcon2,
  Archive as ArchiveIcon2,
  MessageSquare as MessageSquareIcon2,
  RefreshCw as RefreshCwIcon3,
  ArrowUp as ArrowUpIcon2,
  ArrowDown as ArrowDownIcon2,
  ArrowRight as ArrowRightIcon2,
  ArrowLeft as ArrowLeftIcon2,
  RotateCcw as RotateCcwIcon2,
  RotateCw as RotateCwIcon2,
  Maximize as MaximizeIcon2,
  Minimize as MinimizeIcon2,
  Move as MoveIcon2,
  Grip as GripIcon2,
  MoreHorizontal as MoreHorizontalIcon2,
  MoreVertical as MoreVerticalIcon2,
  ChevronUp as ChevronUpIcon2,
  ChevronDown as ChevronDownIcon2,
  ChevronLeft as ChevronLeftIcon2,
  ChevronRight as ChevronRightIcon2,
  Play as PlayIcon2,
  Pause as PauseIcon2,
  Stop as StopIcon2,
  Square as SquareIcon2,
  Circle as CircleIcon2,
  Triangle as TriangleIcon2,
  Hexagon as HexagonIcon2,
  Octagon as OctagonIcon2,
  Diamond as DiamondIcon2
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get security settings
  const securitySettings = await prisma.securitySettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  // Get blocked IPs
  const blockedIPs = await prisma.blockedIP.findMany({
    orderBy: { blockedAt: 'desc' },
    take: 20
  });
  
  // Get backup information
  const backupInfo = await prisma.backupInfo.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  // Get audit logs count
  const auditLogCount = await prisma.auditLog.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    }
  });
  
  // Get failed login attempts
  const failedLogins = await prisma.failedLoginAttempt.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });
  
  return json({
    admin,
    securitySettings: securitySettings || {
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiry: 90
      },
      sessionSettings: {
        sessionTimeout: 30,
        maxConcurrentSessions: 3,
        forceLogoutOnPasswordChange: true
      },
      twoFactorAuth: {
        enabledForAdmins: true,
        enabledForProviders: false,
        enabledForCustomers: false,
        methods: ['sms', 'email', 'authenticator']
      },
      rateLimiting: {
        loginAttempts: { limit: 5, window: 15 },
        apiRequests: { limit: 100, window: 60 },
        messageSending: { limit: 30, window: 60 },
        searchQueries: { limit: 50, window: 60 },
        fileUploads: { limit: 10, window: 300 },
        autoBanIPs: true,
        banDuration: 24
      },
      dataEncryption: {
        encryptSensitiveData: true,
        forceHTTPS: true,
        secureCookies: true,
        enableHSTS: true
      },
      backupSettings: {
        automaticBackups: true,
        backupFrequency: 'daily',
        backupTime: '02:00',
        retentionPeriod: 30,
        lastBackup: new Date(),
        backupSize: '2.5 GB'
      },
      auditLogging: {
        logAdminActions: true,
        logUserAuthentications: true,
        logFinancialTransactions: true,
        logDataExports: true,
        logSettingsChanges: true,
        logRetention: 365
      }
    },
    blockedIPs,
    backupInfo,
    auditLogCount,
    failedLogins
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  
  try {
    if (action === 'save_password_requirements') {
      const passwordRequirements = JSON.parse(formData.get('passwordRequirements') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          passwordRequirements,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          passwordRequirements
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_PASSWORD_REQUIREMENTS', 'Updated password requirements', request);
      
    } else if (action === 'save_session_settings') {
      const sessionSettings = JSON.parse(formData.get('sessionSettings') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          sessionSettings,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          sessionSettings
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_SESSION_SETTINGS', 'Updated session settings', request);
      
    } else if (action === 'save_2fa_settings') {
      const twoFactorAuth = JSON.parse(formData.get('twoFactorAuth') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          twoFactorAuth,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          twoFactorAuth
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_2FA_SETTINGS', 'Updated 2FA settings', request);
      
    } else if (action === 'save_rate_limiting') {
      const rateLimiting = JSON.parse(formData.get('rateLimiting') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          rateLimiting,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          rateLimiting
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_RATE_LIMITING', 'Updated rate limiting settings', request);
      
    } else if (action === 'save_encryption_settings') {
      const dataEncryption = JSON.parse(formData.get('dataEncryption') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          dataEncryption,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          dataEncryption
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_ENCRYPTION_SETTINGS', 'Updated encryption settings', request);
      
    } else if (action === 'save_backup_settings') {
      const backupSettings = JSON.parse(formData.get('backupSettings') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          backupSettings,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          backupSettings
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_BACKUP_SETTINGS', 'Updated backup settings', request);
      
    } else if (action === 'save_audit_logging') {
      const auditLogging = JSON.parse(formData.get('auditLogging') as string);
      
      await prisma.securitySettings.upsert({
        where: { id: 'default' },
        update: {
          auditLogging,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          auditLogging
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_AUDIT_LOGGING', 'Updated audit logging settings', request);
      
    } else if (action === 'block_ip') {
      const ipAddress = formData.get('ipAddress') as string;
      const reason = formData.get('reason') as string;
      
      await prisma.blockedIP.create({
        data: {
          ipAddress,
          reason,
          blockedBy: admin.id,
          blockedAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'BLOCK_IP', `Blocked IP address: ${ipAddress}`, request);
      
    } else if (action === 'unblock_ip') {
      const ipId = formData.get('ipId') as string;
      
      const blockedIP = await prisma.blockedIP.findUnique({
        where: { id: ipId },
        select: { ipAddress: true }
      });
      
      if (!blockedIP) {
        return json({ success: false, error: 'Blocked IP not found' }, { status: 404 });
      }
      
      await prisma.blockedIP.delete({
        where: { id: ipId }
      });
      
      await logAdminAction(admin.id, 'UNBLOCK_IP', `Unblocked IP address: ${blockedIP.ipAddress}`, request);
      
    } else if (action === 'create_backup') {
      // Simulate backup creation
      await prisma.backupInfo.create({
        data: {
          backupType: 'manual',
          status: 'completed',
          size: '2.5 GB',
          createdAt: new Date(),
          createdBy: admin.id
        }
      });
      
      await logAdminAction(admin.id, 'CREATE_BACKUP', 'Created manual backup', request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Security settings action error:', error);
    return json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}

export default function SecuritySettings() {
  const { admin, securitySettings, blockedIPs, backupInfo, auditLogCount, failedLogins } = useLoaderData<typeof loader>();
  const [formData, setFormData] = useState({
    // Password Requirements
    passwordRequirements: securitySettings.passwordRequirements,
    
    // Session Settings
    sessionSettings: securitySettings.sessionSettings,
    
    // 2FA Settings
    twoFactorAuth: securitySettings.twoFactorAuth,
    
    // Rate Limiting
    rateLimiting: securitySettings.rateLimiting,
    
    // Data Encryption
    dataEncryption: securitySettings.dataEncryption,
    
    // Backup Settings
    backupSettings: securitySettings.backupSettings,
    
    // Audit Logging
    auditLogging: securitySettings.auditLogging,
    
    // New IP to block
    newBlockedIP: {
      ipAddress: '',
      reason: ''
    }
  });
  
  const fetcher = useFetcher();
  
  const handleSavePasswordRequirements = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_password_requirements');
    formDataToSubmit.append('passwordRequirements', JSON.stringify(formData.passwordRequirements));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveSessionSettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_session_settings');
    formDataToSubmit.append('sessionSettings', JSON.stringify(formData.sessionSettings));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSave2FASettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_2fa_settings');
    formDataToSubmit.append('twoFactorAuth', JSON.stringify(formData.twoFactorAuth));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveRateLimiting = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_rate_limiting');
    formDataToSubmit.append('rateLimiting', JSON.stringify(formData.rateLimiting));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveEncryptionSettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_encryption_settings');
    formDataToSubmit.append('dataEncryption', JSON.stringify(formData.dataEncryption));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveBackupSettings = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_backup_settings');
    formDataToSubmit.append('backupSettings', JSON.stringify(formData.backupSettings));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleSaveAuditLogging = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'save_audit_logging');
    formDataToSubmit.append('auditLogging', JSON.stringify(formData.auditLogging));
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleBlockIP = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'block_ip');
    formDataToSubmit.append('ipAddress', formData.newBlockedIP.ipAddress);
    formDataToSubmit.append('reason', formData.newBlockedIP.reason);
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
    
    setFormData(prev => ({
      ...prev,
      newBlockedIP: { ipAddress: '', reason: '' }
    }));
  };
  
  const handleUnblockIP = (ipId: string) => {
    if (confirm('Are you sure you want to unblock this IP address?')) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'unblock_ip');
      formDataToSubmit.append('ipId', ipId);
      
      fetcher.submit(formDataToSubmit, { method: 'post' });
    }
  };
  
  const handleCreateBackup = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'create_backup');
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handlePasswordRequirementChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      passwordRequirements: {
        ...prev.passwordRequirements,
        [key]: value
      }
    }));
  };
  
  const handleSessionSettingChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sessionSettings: {
        ...prev.sessionSettings,
        [key]: value
      }
    }));
  };
  
  const handle2FAChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      twoFactorAuth: {
        ...prev.twoFactorAuth,
        [key]: value
      }
    }));
  };
  
  const handleRateLimitChange = (category: string, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rateLimiting: {
        ...prev.rateLimiting,
        [category]: {
          ...prev.rateLimiting[category],
          [key]: value
        }
      }
    }));
  };
  
  const handleEncryptionChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dataEncryption: {
        ...prev.dataEncryption,
        [key]: value
      }
    }));
  };
  
  const handleBackupChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      backupSettings: {
        ...prev.backupSettings,
        [key]: value
      }
    }));
  };
  
  const handleAuditLoggingChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      auditLogging: {
        ...prev.auditLogging,
        [key]: value
      }
    }));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600">Configure platform security and authentication</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
        </div>
      </div>
      
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{failedLogins}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Ban className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked IPs</p>
              <p className="text-2xl font-bold text-gray-900">{blockedIPs.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Audit Logs (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{auditLogCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Backup</p>
              <p className="text-sm font-bold text-gray-900">
                {backupInfo ? new Date(backupInfo.createdAt).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Authentication */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Password Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Length
                </label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={formData.passwordRequirements.minLength}
                  onChange={(e) => handlePasswordRequirementChange('minLength', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Expiry (days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.passwordRequirements.passwordExpiry}
                  onChange={(e) => handlePasswordRequirementChange('passwordExpiry', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              {[
                { key: 'requireUppercase', label: 'Require uppercase letters' },
                { key: 'requireLowercase', label: 'Require lowercase letters' },
                { key: 'requireNumbers', label: 'Require numbers' },
                { key: 'requireSpecialChars', label: 'Require special characters' }
              ].map((requirement) => (
                <div key={requirement.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.passwordRequirements[requirement.key]}
                    onChange={(e) => handlePasswordRequirementChange(requirement.key, e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">{requirement.label}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={formData.sessionSettings.sessionTimeout}
                  onChange={(e) => handleSessionSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Sessions
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.sessionSettings.maxConcurrentSessions}
                  onChange={(e) => handleSessionSettingChange('maxConcurrentSessions', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sessionSettings.forceLogoutOnPasswordChange}
                  onChange={(e) => handleSessionSettingChange('forceLogoutOnPasswordChange', e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700">Force logout on password change</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSavePasswordRequirements}
            disabled={fetcher.state === 'submitting'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Auth Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Fingerprint className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enable 2FA for:</h3>
            <div className="space-y-3">
              {[
                { key: 'enabledForAdmins', label: 'Admins (Required)' },
                { key: 'enabledForProviders', label: 'Providers (Optional)' },
                { key: 'enabledForCustomers', label: 'Customers (Optional)' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.twoFactorAuth[setting.key]}
                    onChange={(e) => handle2FAChange(setting.key, e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">{setting.label}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">2FA Methods:</h3>
            <div className="space-y-3">
              {[
                { key: 'sms', label: 'SMS', icon: <Smartphone className="w-4 h-4" /> },
                { key: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
                { key: 'authenticator', label: 'Authenticator App', icon: <Smartphone className="w-4 h-4" /> }
              ].map((method) => (
                <div key={method.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.twoFactorAuth.methods.includes(method.key)}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...formData.twoFactorAuth.methods, method.key]
                        : formData.twoFactorAuth.methods.filter(m => m !== method.key);
                      handle2FAChange('methods', methods);
                    }}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-2">
                    {method.icon}
                    <label className="text-sm font-medium text-gray-700">{method.label}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSave2FASettings}
            disabled={fetcher.state === 'submitting'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save 2FA Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Rate Limiting */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Rate Limiting</h2>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Login Attempts</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.rateLimiting.loginAttempts.limit}
                    onChange={(e) => handleRateLimitChange('loginAttempts', 'limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Window (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rateLimiting.loginAttempts.window}
                    onChange={(e) => handleRateLimitChange('loginAttempts', 'window', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Requests</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.rateLimiting.apiRequests.limit}
                    onChange={(e) => handleRateLimitChange('apiRequests', 'limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Window (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rateLimiting.apiRequests.window}
                    onChange={(e) => handleRateLimitChange('apiRequests', 'window', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Message Sending</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={formData.rateLimiting.messageSending.limit}
                    onChange={(e) => handleRateLimitChange('messageSending', 'limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Window (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rateLimiting.messageSending.window}
                    onChange={(e) => handleRateLimitChange('messageSending', 'window', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Uploads</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.rateLimiting.fileUploads.limit}
                    onChange={(e) => handleRateLimitChange('fileUploads', 'limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Window (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rateLimiting.fileUploads.window}
                    onChange={(e) => handleRateLimitChange('fileUploads', 'window', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.rateLimiting.autoBanIPs}
                onChange={(e) => handleRateLimitChange('rateLimiting', 'autoBanIPs', e.target.checked)}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">Auto-ban IPs after repeated violations</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ban Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={formData.rateLimiting.banDuration}
                onChange={(e) => handleRateLimitChange('rateLimiting', 'banDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveRateLimiting}
            disabled={fetcher.state === 'submitting'}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Rate Limits'}
          </Button>
        </div>
      </Card>
      
      {/* Blocked IPs */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Ban className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Blocked IP Addresses</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={formData.newBlockedIP.ipAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  newBlockedIP: { ...prev.newBlockedIP, ipAddress: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="192.168.1.100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <input
                type="text"
                value={formData.newBlockedIP.reason}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  newBlockedIP: { ...prev.newBlockedIP, reason: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brute force attack"
              />
            </div>
          </div>
          
          <Button
            onClick={handleBlockIP}
            disabled={fetcher.state === 'submitting' || !formData.newBlockedIP.ipAddress}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Block IP
          </Button>
        </div>
        
        <div className="mt-6 space-y-3">
          {blockedIPs.map((blockedIP) => (
            <div key={blockedIP.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{blockedIP.ipAddress}</p>
                <p className="text-xs text-gray-600">Reason: {blockedIP.reason}</p>
                <p className="text-xs text-gray-500">Blocked: {new Date(blockedIP.blockedAt).toLocaleString()}</p>
              </div>
              
              <Button
                onClick={() => handleUnblockIP(blockedIP.id)}
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700"
              >
                <Unlock className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Data Encryption */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Lock className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Data Encryption</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { key: 'encryptSensitiveData', label: 'Encrypt sensitive data at rest' },
            { key: 'forceHTTPS', label: 'Force HTTPS (Redirect HTTP to HTTPS)' },
            { key: 'secureCookies', label: 'Use secure cookies (HttpOnly, Secure, SameSite)' },
            { key: 'enableHSTS', label: 'Enable HSTS (HTTP Strict Transport Security)' }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dataEncryption[setting.key]}
                onChange={(e) => handleEncryptionChange(setting.key, e.target.checked)}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">{setting.label}</label>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveEncryptionSettings}
            disabled={fetcher.state === 'submitting'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Encryption Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Backup & Recovery */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Database className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Backup & Recovery</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.backupSettings.automaticBackups}
              onChange={(e) => handleBackupChange('automaticBackups', e.target.checked)}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Automatic Backups</label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select
                value={formData.backupSettings.backupFrequency}
                onChange={(e) => handleBackupChange('backupFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Time
              </label>
              <input
                type="time"
                value={formData.backupSettings.backupTime}
                onChange={(e) => handleBackupChange('backupTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retention Period (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.backupSettings.retentionPeriod}
              onChange={(e) => handleBackupChange('retentionPeriod', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Last Backup</p>
                <p className="text-xs text-gray-600">
                  {backupInfo ? new Date(backupInfo.createdAt).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Backup Size</p>
                <p className="text-xs text-gray-600">{formData.backupSettings.backupSize}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleCreateBackup} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Backup Now
            </Button>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Backup History
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Restore
            </Button>
          </div>
          
          <Button
            onClick={handleSaveBackupSettings}
            disabled={fetcher.state === 'submitting'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Backup Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Audit Logging */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Audit Logging</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { key: 'logAdminActions', label: 'Log all admin actions' },
            { key: 'logUserAuthentications', label: 'Log all user authentications' },
            { key: 'logFinancialTransactions', label: 'Log all financial transactions' },
            { key: 'logDataExports', label: 'Log all data exports' },
            { key: 'logSettingsChanges', label: 'Log all settings changes' }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.auditLogging[setting.key]}
                onChange={(e) => handleAuditLoggingChange(setting.key, e.target.checked)}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">{setting.label}</label>
            </div>
          ))}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Retention (days)
            </label>
            <input
              type="number"
              min="30"
              max="3650"
              value={formData.auditLogging.logRetention}
              onChange={(e) => handleAuditLoggingChange('logRetention', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Audit Logs
          </Button>
          
          <Button
            onClick={handleSaveAuditLogging}
            disabled={fetcher.state === 'submitting'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save Audit Settings'}
          </Button>
        </div>
      </Card>
      
      {/* Save All Settings */}
      <div className="flex items-center justify-center">
        <Button
          onClick={() => {
            handleSavePasswordRequirements();
            handleSaveSessionSettings();
            handleSave2FASettings();
            handleSaveRateLimiting();
            handleSaveEncryptionSettings();
            handleSaveBackupSettings();
            handleSaveAuditLogging();
          }}
          disabled={fetcher.state === 'submitting'}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
        >
          <Save className="w-5 h-5 mr-2" />
          {fetcher.state === 'submitting' ? 'Saving All Settings...' : 'Save All Security Settings'}
        </Button>
      </div>
    </div>
  );
}
