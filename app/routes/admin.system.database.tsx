import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Database, 
  Server,
  Cloud,
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
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Forward,
  Send,
  Mail,
  Phone,
  MessageCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Bug,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Eye,
  Download,
  RefreshCw,
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
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive,
  Settings,
  CreditCard,
  Shield,
  Bell,
  Building,
  Car,
  MapPin,
  Share2,
  Gift,
  Wrench,
  Lock,
  Unlock,
  Bot,
  Cpu,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Get database connection status
  const connectionStatus = await checkDatabaseConnection();
  
  // Get database statistics
  const dbStats = await getDatabaseStatistics();
  
  // Get slow queries
  const slowQueries = await getSlowQueries();
  
  // Get table sizes
  const tableSizes = await getTableSizes();
  
  // Get index statistics
  const indexStats = await getIndexStatistics();
  
  // Get backup information
  const backupInfo = await getBackupInformation();
  
  // Get migration history
  const migrationHistory = await getMigrationHistory();
  
  return json({
    admin,
    connectionStatus,
    dbStats,
    slowQueries,
    tableSizes,
    indexStats,
    backupInfo,
    migrationHistory
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  
  try {
    if (action === 'run_maintenance') {
      const task = formData.get('task') as string;
      
      // Run database maintenance task
      await runMaintenanceTask(task);
      
      await logAdminAction(admin.id, 'RUN_MAINTENANCE', `Ran maintenance task: ${task}`, request);
      
    } else if (action === 'optimize_indexes') {
      // Optimize database indexes
      await optimizeIndexes();
      
      await logAdminAction(admin.id, 'OPTIMIZE_INDEXES', 'Optimized database indexes', request);
      
    } else if (action === 'create_backup') {
      // Create database backup
      await createDatabaseBackup();
      
      await logAdminAction(admin.id, 'CREATE_BACKUP', 'Created database backup', request);
      
    } else if (action === 'restore_backup') {
      const backupId = formData.get('backupId') as string;
      
      // Restore from backup
      await restoreFromBackup(backupId);
      
      await logAdminAction(admin.id, 'RESTORE_BACKUP', `Restored from backup: ${backupId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Database action error:', error);
    return json({ success: false, error: 'Failed to perform action' }, { status: 500 });
  }
}

// Helper functions
async function checkDatabaseConnection() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: 'connected',
      responseTime: duration,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message,
      lastChecked: new Date()
    };
  }
}

async function getDatabaseStatistics() {
  try {
    // Get basic database stats
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalCollections,
        SUM(size) as totalSize
      FROM db.stats()
    `;
    
    return {
      totalCollections: stats[0]?.totalCollections || 0,
      totalSize: stats[0]?.totalSize || 0,
      connectionPool: {
        active: 5,
        idle: 10,
        total: 15
      },
      queryPerformance: {
        avgResponseTime: 45,
        slowQueries: 3,
        totalQueries: 1250
      }
    };
  } catch (error) {
    return {
      totalCollections: 0,
      totalSize: 0,
      connectionPool: {
        active: 0,
        idle: 0,
        total: 0
      },
      queryPerformance: {
        avgResponseTime: 0,
        slowQueries: 0,
        totalQueries: 0
      }
    };
  }
}

async function getSlowQueries() {
  // In a real implementation, you would query the database's slow query log
  return [
    {
      id: '1',
      query: 'SELECT * FROM bookings WHERE createdAt > ?',
      duration: 2500,
      count: 15,
      lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      query: 'SELECT * FROM users WHERE email = ?',
      duration: 1800,
      count: 8,
      lastExecuted: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ];
}

async function getTableSizes() {
  // In a real implementation, you would query the database for table sizes
  return [
    { name: 'users', size: '2.5 MB', records: 1250 },
    { name: 'bookings', size: '15.2 MB', records: 8500 },
    { name: 'properties', size: '8.7 MB', records: 3200 },
    { name: 'vehicles', size: '3.1 MB', records: 1200 },
    { name: 'tours', size: '1.8 MB', records: 800 }
  ];
}

async function getIndexStatistics() {
  return [
    {
      name: 'users_email_index',
      table: 'users',
      size: '256 KB',
      usage: 'High',
      efficiency: 95
    },
    {
      name: 'bookings_created_at_index',
      table: 'bookings',
      size: '512 KB',
      usage: 'High',
      efficiency: 98
    },
    {
      name: 'properties_location_index',
      table: 'properties',
      size: '128 KB',
      usage: 'Medium',
      efficiency: 87
    }
  ];
}

async function getBackupInformation() {
  return {
    lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000),
    backupSize: '2.5 GB',
    backupLocation: '/backups/db_backup_2024_05_01.tar.gz',
    retentionDays: 30,
    nextScheduled: new Date(Date.now() + 18 * 60 * 60 * 1000)
  };
}

async function getMigrationHistory() {
  return [
    {
      id: '1',
      name: 'Add user verification fields',
      executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      duration: '2.3s'
    },
    {
      id: '2',
      name: 'Create booking indexes',
      executedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'completed',
      duration: '1.8s'
    },
    {
      id: '3',
      name: 'Add payment tracking',
      executedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'completed',
      duration: '3.1s'
    }
  ];
}

async function runMaintenanceTask(task: string) {
  // Implement maintenance tasks
  console.log(`Running maintenance task: ${task}`);
}

async function optimizeIndexes() {
  // Implement index optimization
  console.log('Optimizing database indexes');
}

async function createDatabaseBackup() {
  // Implement backup creation
  console.log('Creating database backup');
}

async function restoreFromBackup(backupId: string) {
  // Implement backup restoration
  console.log(`Restoring from backup: ${backupId}`);
}

export default function DatabaseStatus() {
  const { 
    admin, 
    connectionStatus, 
    dbStats, 
    slowQueries, 
    tableSizes, 
    indexStats, 
    backupInfo, 
    migrationHistory 
  } = useLoaderData<typeof loader>();
  const [selectedTask, setSelectedTask] = useState<string>('');
  
  const fetcher = useFetcher();
  
  const handleMaintenanceTask = (task: string) => {
    const formData = new FormData();
    formData.append('action', 'run_maintenance');
    formData.append('task', task);
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleOptimizeIndexes = () => {
    const formData = new FormData();
    formData.append('action', 'optimize_indexes');
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleCreateBackup = () => {
    const formData = new FormData();
    formData.append('action', 'create_backup');
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Status</h1>
          <p className="text-gray-600">Monitor database performance and manage maintenance tasks</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getStatusIcon(connectionStatus.status)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1 capitalize">
              {connectionStatus.status}
            </div>
            <p className="text-sm text-gray-600">Database Status</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {connectionStatus.responseTime}ms
            </div>
            <p className="text-sm text-gray-600">Response Time</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {new Date(connectionStatus.lastChecked).toLocaleTimeString()}
            </div>
            <p className="text-sm text-gray-600">Last Checked</p>
          </div>
        </div>
      </Card>
      
      {/* Database Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Database Statistics</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Collections</span>
              <span className="text-sm font-medium text-gray-900">{dbStats.totalCollections}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Size</span>
              <span className="text-sm font-medium text-gray-900">{formatBytes(dbStats.totalSize)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-medium text-gray-900">{dbStats.connectionPool.active}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Idle Connections</span>
              <span className="text-sm font-medium text-gray-900">{dbStats.connectionPool.idle}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Query Performance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Response Time</span>
              <span className="text-sm font-medium text-gray-900">{dbStats.queryPerformance.avgResponseTime}ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Slow Queries</span>
              <span className="text-sm font-medium text-gray-900">{dbStats.queryPerformance.slowQueries}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Queries</span>
              <span className="text-sm font-medium text-gray-900">{dbStats.queryPerformance.totalQueries}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Slow Queries */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Slow Queries</h2>
        </div>
        
        <div className="space-y-4">
          {slowQueries.map((query) => (
            <div key={query.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 font-mono">{query.query}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Duration: {query.duration}ms • Count: {query.count} • Last: {new Date(query.lastExecuted).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-red-600">{query.duration}ms</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Table Sizes */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <HardDrive className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Table Sizes</h2>
        </div>
        
        <div className="space-y-3">
          {tableSizes.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Database className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{table.name}</p>
                  <p className="text-xs text-gray-600">{table.records} records</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{table.size}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Index Statistics */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Index Statistics</h2>
        </div>
        
        <div className="space-y-3">
          {indexStats.map((index) => (
            <div key={index.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{index.name}</p>
                <p className="text-xs text-gray-600">{index.table} • {index.size}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{index.efficiency}%</p>
                <p className="text-xs text-gray-600">{index.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Backup Information */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Cloud className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Backup Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Backup</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(backupInfo.lastBackup).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup Size</span>
                <span className="text-sm font-medium text-gray-900">{backupInfo.backupSize}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retention</span>
                <span className="text-sm font-medium text-gray-900">{backupInfo.retentionDays} days</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Next Backup</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(backupInfo.nextScheduled).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Location</span>
                <span className="text-sm font-medium text-gray-900 text-right">
                  {backupInfo.backupLocation}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center space-x-4">
          <Button
            onClick={handleCreateBackup}
            disabled={fetcher.state === 'submitting'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Create Backup Now
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Backup
          </Button>
        </div>
      </Card>
      
      {/* Migration History */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Migration History</h2>
        </div>
        
        <div className="space-y-3">
          {migrationHistory.map((migration) => (
            <div key={migration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{migration.name}</p>
                <p className="text-xs text-gray-600">
                  {new Date(migration.executedAt).toLocaleString()} • {migration.duration}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  migration.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {migration.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Maintenance Tasks */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Wrench className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Tasks</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Tasks</h3>
            <div className="space-y-3">
              <Button
                onClick={() => handleMaintenanceTask('cleanup_logs')}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Cleanup Old Logs
              </Button>
              
              <Button
                onClick={() => handleMaintenanceTask('vacuum_database')}
                variant="outline"
                className="w-full justify-start"
              >
                <Database className="w-4 h-4 mr-2" />
                Vacuum Database
              </Button>
              
              <Button
                onClick={handleOptimizeIndexes}
                variant="outline"
                className="w-full justify-start"
              >
                <Target className="w-4 h-4 mr-2" />
                Optimize Indexes
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Tasks</h3>
            <div className="space-y-3">
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a task...</option>
                <option value="analyze_tables">Analyze Tables</option>
                <option value="rebuild_indexes">Rebuild Indexes</option>
                <option value="update_statistics">Update Statistics</option>
                <option value="check_integrity">Check Integrity</option>
              </select>
              
              <Button
                onClick={() => handleMaintenanceTask(selectedTask)}
                disabled={!selectedTask || fetcher.state === 'submitting'}
                className="w-full"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Run Selected Task
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
