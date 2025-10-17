import { Link, useLocation } from "@remix-run/react";
import { 
  Users, 
  MessageSquare, 
  Star, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Shield, 
  Bell,
  FileText,
  Activity,
  TrendingUp,
  Globe,
  Wrench,
  Mail,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Minus,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Target,
  Timer,
  User,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Maximize,
  Zap,
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
  CreditCard,
  Building,
  Car,
  MapPin,
  Heart,
  Share2,
  Gift,
  Clock as ClockIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Info,
  HelpCircle,
  Wrench as WrenchIcon,
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
  Server,
  Cloud,
  Lock,
  Unlock,
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
  Calendar,
  Tag,
  FileText as FileTextIcon,
  Paperclip as PaperclipIcon,
  Image as ImageIcon,
  File as FileIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Archive as ArchiveIcon,
  MessageSquare as MessageSquareIcon,
  RefreshCw as RefreshCwIcon,
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
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  PieChart,
  LineChart,
  MapPin as MapPinIcon,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Desktop,
  Mail as MailIcon,
  Phone,
  MessageCircle,
  AlertCircle,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  Bug,
  Wrench as WrenchIcon2,
  Heart as HeartIcon2,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Send,
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
  Calendar as CalendarIcon,
  Tag as TagIcon,
  FileText as FileTextIcon2,
  Paperclip as PaperclipIcon2,
  Image as ImageIcon2,
  File as FileIcon2,
  Video as VideoIcon2,
  Music as MusicIcon2,
  Archive as ArchiveIcon2,
  MessageSquare as MessageSquareIcon2,
  RefreshCw as RefreshCwIcon2,
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

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
    children: [
      { name: "All Users", href: "/admin/users", icon: Users },
      { name: "Property Owners", href: "/admin/users/property-owners", icon: Building },
      { name: "Vehicle Owners", href: "/admin/users/vehicle-owners", icon: Car },
      { name: "Tour Guides", href: "/admin/users/tour-guides", icon: MapPin },
      { name: "Customers", href: "/admin/users/customers", icon: User },
    ],
  },
  {
    name: "Support System",
    href: "/admin/support",
    icon: MessageSquare,
    children: [
      { name: "All Tickets", href: "/admin/support/tickets", icon: MessageSquare },
      { name: "Canned Responses", href: "/admin/support/canned-responses", icon: FileText },
      { name: "Status Actions", href: "/admin/support/status-actions", icon: CheckCircle },
      { name: "File Attachments", href: "/admin/support/attachments", icon: Paperclip },
      { name: "Internal Notes", href: "/admin/support/internal-notes", icon: Bookmark },
      { name: "Quick Actions", href: "/admin/support/quick-actions", icon: Zap },
      { name: "Automation", href: "/admin/support/automation", icon: Bot },
      { name: "SLA Tracking", href: "/admin/support/sla-tracking", icon: Clock },
      { name: "All Conversations", href: "/admin/support/conversations", icon: MessageCircle },
      { name: "Escalated Issues", href: "/admin/support/escalated", icon: AlertTriangle },
    ],
  },
  {
    name: "Reviews & Moderation",
    href: "/admin/reviews",
    icon: Star,
    children: [
      { name: "All Reviews", href: "/admin/reviews/all", icon: Star },
      { name: "Flagged Reviews", href: "/admin/reviews/flagged", icon: AlertTriangle },
      { name: "Review Analytics", href: "/admin/reviews/analytics", icon: BarChart3 },
    ],
  },
  {
    name: "Financial Management",
    href: "/admin/financial",
    icon: DollarSign,
    children: [
      { name: "Revenue Overview", href: "/admin/financial/revenue", icon: DollarSign },
      { name: "Commission Tracking", href: "/admin/financial/commission", icon: TrendingUp },
      { name: "Payout Management", href: "/admin/financial/payouts", icon: CreditCard },
      { name: "Financial Reports", href: "/admin/financial/reports", icon: FileText },
    ],
  },
  {
    name: "Platform Settings",
    href: "/admin/settings",
    icon: Settings,
    children: [
      { name: "General Settings", href: "/admin/settings/general", icon: Wrench },
      { name: "Email Templates", href: "/admin/settings/emails", icon: Mail },
      { name: "Notification Settings", href: "/admin/settings/notifications", icon: Bell },
      { name: "Security Settings", href: "/admin/settings/security", icon: Shield },
    ],
  },
  {
    name: "Analytics & Reporting",
    href: "/admin/analytics",
    icon: BarChart3,
    children: [
      { name: "Platform Analytics", href: "/admin/analytics/platform", icon: BarChart3 },
      { name: "Growth Metrics", href: "/admin/analytics/growth", icon: TrendingUp },
      { name: "Activity Logs", href: "/admin/analytics/activity", icon: Activity },
      { name: "Audit Logs", href: "/admin/analytics/audit", icon: FileText },
    ],
  },
];

export default function AdminNavigation() {
  const location = useLocation();
  
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };
  
  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };
  
  return (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <div key={item.name}>
          <Link
            to={item.href}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isParentActive(item)
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon
              className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isParentActive(item)
                  ? "text-gray-500"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            {item.name}
          </Link>
          
          {item.children && isParentActive(item) && (
            <div className="ml-8 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.name}
                  to={child.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(child.href)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <child.icon
                    className={`mr-3 h-4 w-4 flex-shrink-0 ${
                      isActive(child.href)
                        ? "text-gray-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
