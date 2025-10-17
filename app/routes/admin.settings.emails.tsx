import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Mail, 
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
  Diamond as DiamondIcon
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  const search = url.searchParams.get('search') || '';
  
  // Build where clause for email templates
  const whereClause: any = {};
  
  if (category !== 'all') {
    whereClause.category = category.toUpperCase();
  }
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Get email templates
  const templates = await prisma.emailTemplate.findMany({
    where: whereClause,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });
  
  // Get template categories
  const categories = await prisma.emailTemplate.groupBy({
    by: ['category'],
    _count: { category: true }
  });
  
  // Get template statistics
  const templateStats = await Promise.all([
    prisma.emailTemplate.count(),
    prisma.emailTemplate.count({ where: { isEnabled: true } }),
    prisma.emailTemplate.count({ where: { isEnabled: false } }),
    prisma.emailLog.count({ 
      where: { 
        sentAt: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        } 
      } 
    })
  ]);
  
  return json({
    admin,
    templates,
    categories,
    templateStats: {
      total: templateStats[0],
      enabled: templateStats[1],
      disabled: templateStats[2],
      sentToday: templateStats[3]
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const templateId = formData.get('templateId') as string;
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const fromName = formData.get('fromName') as string;
  const fromEmail = formData.get('fromEmail') as string;
  const body = formData.get('body') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const isEnabled = formData.get('isEnabled') === 'true';
  const testEmail = formData.get('testEmail') as string;
  
  try {
    if (action === 'create_template') {
      const template = await prisma.emailTemplate.create({
        data: {
          name,
          subject,
          fromName,
          fromEmail,
          body,
          category: category.toUpperCase(),
          description,
          isEnabled,
          createdBy: admin.id
        }
      });
      
      await logAdminAction(admin.id, 'CREATE_EMAIL_TEMPLATE', `Created email template: ${name}`, request);
      return json({ success: true, template });
      
    } else if (action === 'update_template') {
      await prisma.emailTemplate.update({
        where: { id: templateId },
        data: {
          name,
          subject,
          fromName,
          fromEmail,
          body,
          category: category.toUpperCase(),
          description,
          isEnabled,
          updatedAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_EMAIL_TEMPLATE', `Updated email template: ${name}`, request);
      return json({ success: true });
      
    } else if (action === 'delete_template') {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
        select: { name: true }
      });
      
      if (!template) {
        return json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      
      await prisma.emailTemplate.delete({
        where: { id: templateId }
      });
      
      await logAdminAction(admin.id, 'DELETE_EMAIL_TEMPLATE', `Deleted email template: ${template.name}`, request);
      return json({ success: true });
      
    } else if (action === 'toggle_template') {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
        select: { isEnabled: true, name: true }
      });
      
      if (!template) {
        return json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      
      await prisma.emailTemplate.update({
        where: { id: templateId },
        data: { isEnabled: !template.isEnabled }
      });
      
      await logAdminAction(admin.id, 'TOGGLE_EMAIL_TEMPLATE', `Toggled email template: ${template.name}`, request);
      return json({ success: true });
      
    } else if (action === 'send_test_email') {
      // Log test email send
      await prisma.emailLog.create({
        data: {
          templateId: templateId,
          recipientEmail: testEmail,
          recipientName: 'Test User',
          status: 'SENT',
          sentAt: new Date(),
          isTest: true
        }
      });
      
      await logAdminAction(admin.id, 'SEND_TEST_EMAIL', `Sent test email for template: ${templateId}`, request);
      return json({ success: true });
      
    } else if (action === 'duplicate_template') {
      const originalTemplate = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!originalTemplate) {
        return json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      
      const duplicatedTemplate = await prisma.emailTemplate.create({
        data: {
          name: `${originalTemplate.name} (Copy)`,
          subject: originalTemplate.subject,
          fromName: originalTemplate.fromName,
          fromEmail: originalTemplate.fromEmail,
          body: originalTemplate.body,
          category: originalTemplate.category,
          description: originalTemplate.description,
          isEnabled: false,
          createdBy: admin.id
        }
      });
      
      await logAdminAction(admin.id, 'DUPLICATE_EMAIL_TEMPLATE', `Duplicated email template: ${originalTemplate.name}`, request);
      return json({ success: true, template: duplicatedTemplate });
    }
    
    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Email template action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function EmailTemplates() {
  const { admin, templates, categories, templateStats } = useLoaderData<typeof loader>();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [templateModal, setTemplateModal] = useState<{ open: boolean; template: any; mode: 'create' | 'edit' | 'view' }>({
    open: false,
    template: null,
    mode: 'create'
  });
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    fromName: 'FindoTrip',
    fromEmail: 'noreply@findotrip.com',
    body: '',
    category: 'CUSTOMER',
    description: '',
    isEnabled: true
  });
  const [testEmail, setTestEmail] = useState(admin.email);
  
  const fetcher = useFetcher();
  
  const handleCreateTemplate = () => {
    setTemplateModal({ open: true, template: null, mode: 'create' });
    setFormData({
      name: '',
      subject: '',
      fromName: 'FindoTrip',
      fromEmail: 'noreply@findotrip.com',
      body: '',
      category: 'CUSTOMER',
      description: '',
      isEnabled: true
    });
  };
  
  const handleEditTemplate = (template: any) => {
    setTemplateModal({ open: true, template, mode: 'edit' });
    setFormData({
      name: template.name,
      subject: template.subject,
      fromName: template.fromName,
      fromEmail: template.fromEmail,
      body: template.body,
      category: template.category,
      description: template.description,
      isEnabled: template.isEnabled
    });
  };
  
  const handleViewTemplate = (template: any) => {
    setTemplateModal({ open: true, template, mode: 'view' });
    setFormData({
      name: template.name,
      subject: template.subject,
      fromName: template.fromName,
      fromEmail: template.fromEmail,
      body: template.body,
      category: template.category,
      description: template.description,
      isEnabled: template.isEnabled
    });
  };
  
  const handleSaveTemplate = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', templateModal.mode === 'create' ? 'create_template' : 'update_template');
    if (templateModal.mode === 'edit') {
      formDataToSubmit.append('templateId', templateModal.template.id);
    }
    formDataToSubmit.append('name', formData.name);
    formDataToSubmit.append('subject', formData.subject);
    formDataToSubmit.append('fromName', formData.fromName);
    formDataToSubmit.append('fromEmail', formData.fromEmail);
    formDataToSubmit.append('body', formData.body);
    formDataToSubmit.append('category', formData.category);
    formDataToSubmit.append('description', formData.description);
    formDataToSubmit.append('isEnabled', formData.isEnabled.toString());
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
    setTemplateModal({ open: false, template: null, mode: 'create' });
  };
  
  const handleToggleTemplate = (templateId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'toggle_template');
    formDataToSubmit.append('templateId', templateId);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this email template?')) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'delete_template');
      formDataToSubmit.append('templateId', templateId);
      fetcher.submit(formDataToSubmit, { method: 'post' });
    }
  };
  
  const handleSendTestEmail = (templateId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'send_test_email');
    formDataToSubmit.append('templateId', templateId);
    formDataToSubmit.append('testEmail', testEmail);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleDuplicateTemplate = (templateId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'duplicate_template');
    formDataToSubmit.append('templateId', templateId);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + `{{${variable}}}`
    }));
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CUSTOMER': return <User className="w-5 h-5" />;
      case 'PROVIDER': return <Building className="w-5 h-5" />;
      case 'ADMIN': return <Shield className="w-5 h-5" />;
      default: return <Mail className="w-5 h-5" />;
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800';
      case 'PROVIDER': return 'bg-green-100 text-green-800';
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const availableVariables = [
    { name: 'customerName', description: 'Customer name' },
    { name: 'bookingNumber', description: 'Booking reference number' },
    { name: 'serviceName', description: 'Service name' },
    { name: 'checkInDate', description: 'Check-in date' },
    { name: 'checkOutDate', description: 'Check-out date' },
    { name: 'totalAmount', description: 'Total booking amount' },
    { name: 'providerName', description: 'Provider name' },
    { name: 'confirmationLink', description: 'Booking confirmation link' },
    { name: 'cancellationLink', description: 'Cancellation link' },
    { name: 'reviewLink', description: 'Review submission link' },
    { name: 'supportEmail', description: 'Support email address' },
    { name: 'platformName', description: 'Platform name' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Template Manager</h1>
          <p className="text-gray-600">Manage all email templates for your platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Template Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templateStats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Enabled</p>
              <p className="text-2xl font-bold text-gray-900">{templateStats.enabled}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-gray-900">{templateStats.disabled}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sent Today</p>
              <p className="text-2xl font-bold text-gray-900">{templateStats.sentToday}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="customer">Customer Emails</option>
              <option value="provider">Provider Emails</option>
              <option value="admin">Admin Emails</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Email Categories */}
      <div className="space-y-6">
        {categories.map((category) => (
          <Card key={category.category} className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${getCategoryColor(category.category)}`}>
                {getCategoryIcon(category.category)}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {category.category} EMAILS ({category._count.category})
              </h2>
            </div>
            
            <div className="space-y-3">
              {templates
                .filter(t => t.category === category.category)
                .map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{template.description}</p>
                      <p className="text-xs text-gray-500">Subject: {template.subject}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleViewTemplate(template)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleEditTemplate(template)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleToggleTemplate(template.id)}
                        variant="outline"
                        size="sm"
                        className={template.isEnabled ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {template.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => handleSendTestEmail(template.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDuplicateTemplate(template.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteTemplate(template.id)}
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
        ))}
      </div>
      
      {/* Template Modal */}
      {templateModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {templateModal.mode === 'create' ? 'Create Email Template' : 
                 templateModal.mode === 'edit' ? 'Edit Email Template' : 'View Email Template'}
              </h3>
              <Button
                variant="outline"
                onClick={() => setTemplateModal({ open: false, template: null, mode: 'create' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={templateModal.mode === 'view'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={templateModal.mode === 'view'}
                  >
                    <option value="CUSTOMER">Customer Emails</option>
                    <option value="PROVIDER">Provider Emails</option>
                    <option value="ADMIN">Admin Emails</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Your Booking is Confirmed! #{{bookingNumber}}"
                  disabled={templateModal.mode === 'view'}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={templateModal.mode === 'view'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={templateModal.mode === 'view'}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={templateModal.mode === 'view'}
                />
              </div>
              
              {/* Available Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Variables (click to insert)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.name}
                      onClick={() => insertVariable(variable.name)}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      disabled={templateModal.mode === 'view'}
                    >
                      {variable.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body (HTML)
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={12}
                  placeholder="Hi {{customerName}},&#10;&#10;Great news! Your booking has been confirmed.&#10;&#10;Booking Number: {{bookingNumber}}&#10;Service: {{serviceName}}&#10;Check-in: {{checkInDate}}&#10;Total Paid: {{totalAmount}}&#10;&#10;What's next?..."
                  disabled={templateModal.mode === 'view'}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="rounded"
                  disabled={templateModal.mode === 'view'}
                />
                <label className="text-sm font-medium text-gray-700">Enable This Email</label>
              </div>
              
              {templateModal.mode !== 'view' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Send Test Email To:</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}
              
              {templateModal.mode !== 'view' && (
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setTemplateModal({ open: false, template: null, mode: 'create' })}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={fetcher.state === 'submitting'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {fetcher.state === 'submitting' ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
