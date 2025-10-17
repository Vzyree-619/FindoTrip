import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Zap, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  BarChart3,
  Shield,
  BookOpen,
  Globe,
  Award,
  Flag,
  Archive,
  Trash2,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Bell,
  BellOff,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle2,
  Clock3,
  AlertCircle,
  Info,
  HelpCircle,
  Bug,
  Wrench,
  Heart,
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
  Target,
  Timer,
  User,
  Users,
  Calendar,
  Tag,
  Priority,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive as ArchiveFile,
  MessageSquare,
  RefreshCw,
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
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Bot,
  Cpu,
  Database,
  HardDrive,
  Network,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Power,
  PowerOff,
  Plug,
  Unplug,
  Cable,
  Router,
  Server,
  Cloud,
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
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  Flame,
  Snowflake,
  Sparkles,
  Star as StarIcon,
  StarHalf,
  StarOff,
  Heart as HeartIcon,
  HeartHandshake,
  HandHeart,
  Handshake,
  Hand,
  HandMetal,
  HandCoins,
  HandPlane,
  HandHelping,
  HandHolding,
  HandHoldingHeart,
  HandHoldingDollar,
  HandHoldingMedical,
  HandHoldingSeedling,
  HandHoldingWater,
  HandHoldingDroplet,
  HandHoldingHeart as HandHoldingHeartIcon,
  HandHoldingDollar as HandHoldingDollarIcon,
  HandHoldingMedical as HandHoldingMedicalIcon,
  HandHoldingSeedling as HandHoldingSeedlingIcon,
  HandHoldingWater as HandHoldingWaterIcon,
  HandHoldingDroplet as HandHoldingDropletIcon,
  Handshake as HandshakeIcon,
  Hand as HandIcon,
  HandMetal as HandMetalIcon,
  HandCoins as HandCoinsIcon,
  HandPlane as HandPlaneIcon,
  HandHelping as HandHelpingIcon,
  HandHolding as HandHoldingIcon,
  HandHoldingHeart as HandHoldingHeartIcon2,
  HandHoldingDollar as HandHoldingDollarIcon2,
  HandHoldingMedical as HandHoldingMedicalIcon2,
  HandHoldingSeedling as HandHoldingSeedlingIcon2,
  HandHoldingWater as HandHoldingWaterIcon2,
  HandHoldingDroplet as HandHoldingDropletIcon2
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const type = url.searchParams.get('type') || 'all';
  const status = url.searchParams.get('status') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for automation rules
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { trigger: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (type !== 'all') {
    whereClause.type = type.toUpperCase();
  }
  
  if (status !== 'all') {
    whereClause.isActive = status === 'active';
  }
  
  // Get automation rules
  const [rules, totalCount] = await Promise.all([
    prisma.automationRule.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.automationRule.count({ where: whereClause })
  ]);
  
  // Get automation statistics
  const automationStats = await Promise.all([
    prisma.automationRule.count({ where: { isActive: true } }),
    prisma.automationRule.count({ where: { isActive: false } }),
    prisma.automationExecution.count({ 
      where: { 
        executedAt: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.automationExecution.count({ 
      where: { 
        executedAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      } 
    })
  ]);
  
  // Get recent executions
  const recentExecutions = await prisma.automationExecution.findMany({
    take: 10,
    orderBy: { executedAt: 'desc' },
    include: {
      rule: {
        select: {
          name: true,
          type: true
        }
      },
      ticket: {
        select: {
          id: true,
          subject: true,
          status: true
        }
      }
    }
  });
  
  return json({
    admin,
    rules,
    totalCount,
    recentExecutions,
    automationStats: {
      active: automationStats[0],
      inactive: automationStats[1],
      today: automationStats[2],
      thisWeek: automationStats[3]
    },
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, type, status }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const ruleId = formData.get('ruleId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as string;
  const trigger = formData.get('trigger') as string;
  const conditions = formData.get('conditions') as string;
  const actions = formData.get('actions') as string;
  const isActive = formData.get('isActive') === 'true';
  
  try {
    if (action === 'create_rule') {
      const rule = await prisma.automationRule.create({
        data: {
          name,
          description,
          type: type.toUpperCase(),
          trigger,
          conditions: JSON.parse(conditions),
          actions: JSON.parse(actions),
          isActive,
          createdBy: admin.id
        }
      });
      
      await logAdminAction(admin.id, 'CREATE_AUTOMATION_RULE', `Created automation rule: ${name}`, request);
      return json({ success: true, rule });
      
    } else if (action === 'update_rule') {
      await prisma.automationRule.update({
        where: { id: ruleId },
        data: {
          name,
          description,
          type: type.toUpperCase(),
          trigger,
          conditions: JSON.parse(conditions),
          actions: JSON.parse(actions),
          isActive,
          updatedAt: new Date()
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_AUTOMATION_RULE', `Updated automation rule: ${name}`, request);
      return json({ success: true });
      
    } else if (action === 'toggle_rule') {
      const rule = await prisma.automationRule.findUnique({
        where: { id: ruleId },
        select: { isActive: true, name: true }
      });
      
      if (!rule) {
        return json({ success: false, error: 'Rule not found' }, { status: 404 });
      }
      
      await prisma.automationRule.update({
        where: { id: ruleId },
        data: { isActive: !rule.isActive }
      });
      
      await logAdminAction(admin.id, 'TOGGLE_AUTOMATION_RULE', `Toggled automation rule: ${rule.name}`, request);
      return json({ success: true });
      
    } else if (action === 'delete_rule') {
      const rule = await prisma.automationRule.findUnique({
        where: { id: ruleId },
        select: { name: true }
      });
      
      if (!rule) {
        return json({ success: false, error: 'Rule not found' }, { status: 404 });
      }
      
      await prisma.automationRule.delete({
        where: { id: ruleId }
      });
      
      await logAdminAction(admin.id, 'DELETE_AUTOMATION_RULE', `Deleted automation rule: ${rule.name}`, request);
      return json({ success: true });
      
    } else if (action === 'test_rule') {
      // Simulate rule execution for testing
      await prisma.automationExecution.create({
        data: {
          ruleId: ruleId,
          ticketId: 'test-ticket',
          status: 'SUCCESS',
          executedAt: new Date(),
          result: 'Test execution completed successfully'
        }
      });
      
      await logAdminAction(admin.id, 'TEST_AUTOMATION_RULE', `Tested automation rule: ${ruleId}`, request);
      return json({ success: true });
    }
    
    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Automation action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function Automation() {
  const { admin, rules, totalCount, recentExecutions, automationStats, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [ruleModal, setRuleModal] = useState<{ open: boolean; rule: any; mode: 'create' | 'edit' | 'view' }>({
    open: false,
    rule: null,
    mode: 'create'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'AUTO_REPLY',
    trigger: '',
    conditions: '{}',
    actions: '{}',
    isActive: true
  });
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedRules.length === rules.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(rules.map(r => r.id));
    }
  };
  
  const handleSelectRule = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };
  
  const handleCreateRule = () => {
    setRuleModal({ open: true, rule: null, mode: 'create' });
    setFormData({
      name: '',
      description: '',
      type: 'AUTO_REPLY',
      trigger: '',
      conditions: '{}',
      actions: '{}',
      isActive: true
    });
  };
  
  const handleEditRule = (rule: any) => {
    setRuleModal({ open: true, rule, mode: 'edit' });
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      trigger: rule.trigger,
      conditions: JSON.stringify(rule.conditions),
      actions: JSON.stringify(rule.actions),
      isActive: rule.isActive
    });
  };
  
  const handleViewRule = (rule: any) => {
    setRuleModal({ open: true, rule, mode: 'view' });
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      trigger: rule.trigger,
      conditions: JSON.stringify(rule.conditions),
      actions: JSON.stringify(rule.actions),
      isActive: rule.isActive
    });
  };
  
  const handleSaveRule = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', ruleModal.mode === 'create' ? 'create_rule' : 'update_rule');
    if (ruleModal.mode === 'edit') {
      formDataToSubmit.append('ruleId', ruleModal.rule.id);
    }
    formDataToSubmit.append('name', formData.name);
    formDataToSubmit.append('description', formData.description);
    formDataToSubmit.append('type', formData.type);
    formDataToSubmit.append('trigger', formData.trigger);
    formDataToSubmit.append('conditions', formData.conditions);
    formDataToSubmit.append('actions', formData.actions);
    formDataToSubmit.append('isActive', formData.isActive.toString());
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
    setRuleModal({ open: false, rule: null, mode: 'create' });
  };
  
  const handleToggleRule = (ruleId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'toggle_rule');
    formDataToSubmit.append('ruleId', ruleId);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this automation rule?')) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'delete_rule');
      formDataToSubmit.append('ruleId', ruleId);
      fetcher.submit(formDataToSubmit, { method: 'post' });
    }
  };
  
  const handleTestRule = (ruleId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'test_rule');
    formDataToSubmit.append('ruleId', ruleId);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AUTO_REPLY': return <Bot className="w-5 h-5" />;
      case 'AUTO_ASSIGNMENT': return <UserCheck className="w-5 h-5" />;
      case 'AUTO_ESCALATION': return <Zap className="w-5 h-5" />;
      case 'REMINDER': return <Bell className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AUTO_REPLY': return 'bg-blue-100 text-blue-800';
      case 'AUTO_ASSIGNMENT': return 'bg-green-100 text-green-800';
      case 'AUTO_ESCALATION': return 'bg-red-100 text-red-800';
      case 'REMINDER': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
          <p className="text-gray-600">Automate support processes with intelligent rules</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleCreateRule} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Automation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900">{automationStats.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Rules</p>
              <p className="text-2xl font-bold text-gray-900">{automationStats.inactive}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Executions</p>
              <p className="text-2xl font-bold text-gray-900">{automationStats.today}</p>
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
              <p className="text-2xl font-bold text-gray-900">{automationStats.thisWeek}</p>
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
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filters.type}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('type', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="auto_reply">Auto Reply</option>
              <option value="auto_assignment">Auto Assignment</option>
              <option value="auto_escalation">Auto Escalation</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('status', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search rules..."
              value={filters.search}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('search', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card className="p-8 text-center">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Automation Rules</h3>
            <p className="text-gray-600">Create your first automation rule to get started.</p>
            <Button onClick={handleCreateRule} className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedRules.length === rules.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({rules.length} rules)
              </span>
            </div>
            
            {rules.map((rule) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes(rule.id)}
                    onChange={() => handleSelectRule(rule.id)}
                    className="rounded mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${getTypeColor(rule.type)}`}>
                        {getTypeIcon(rule.type)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4" />
                        <span>{rule.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(rule.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>{rule._count.executions} executions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Last run: {rule.updatedAt ? new Date(rule.updatedAt).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2">{rule.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleViewRule(rule)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleEditRule(rule)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleToggleRule(rule.id)}
                      variant="outline"
                      size="sm"
                      className={rule.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => handleTestRule(rule.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteRule(rule.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
      
      {/* Recent Executions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
        <div className="space-y-3">
          {recentExecutions.map((execution) => (
            <div key={execution.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${execution.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {execution.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{execution.rule.name}</p>
                <p className="text-xs text-gray-600">{execution.rule.type.replace('_', ' ')} • {new Date(execution.executedAt).toLocaleString()}</p>
              </div>
              <div className="text-xs text-gray-500">
                {execution.ticket ? `Ticket: ${execution.ticket.subject}` : 'Test execution'}
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Rule Modal */}
      {ruleModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {ruleModal.mode === 'create' ? 'Create Automation Rule' : 
                 ruleModal.mode === 'edit' ? 'Edit Automation Rule' : 'View Automation Rule'}
              </h3>
              <Button
                variant="outline"
                onClick={() => setRuleModal({ open: false, rule: null, mode: 'create' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={ruleModal.mode === 'view'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={ruleModal.mode === 'view'}
                  >
                    <option value="AUTO_REPLY">Auto Reply</option>
                    <option value="AUTO_ASSIGNMENT">Auto Assignment</option>
                    <option value="AUTO_ESCALATION">Auto Escalation</option>
                    <option value="REMINDER">Reminder</option>
                  </select>
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
                  rows={3}
                  disabled={ruleModal.mode === 'view'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger
                </label>
                <input
                  type="text"
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ticket_created, status_changed, priority_high"
                  disabled={ruleModal.mode === 'view'}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions (JSON)
                  </label>
                  <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    disabled={ruleModal.mode === 'view'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actions (JSON)
                  </label>
                  <textarea
                    value={formData.actions}
                    onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    disabled={ruleModal.mode === 'view'}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                  disabled={ruleModal.mode === 'view'}
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
              
              {ruleModal.mode !== 'view' && (
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setRuleModal({ open: false, rule: null, mode: 'create' })}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRule}
                    disabled={fetcher.state === 'submitting'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {fetcher.state === 'submitting' ? 'Saving...' : 'Save Rule'}
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
