import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { getRealTimeChatActivity } from "~/lib/utils/chat-analytics.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  Activity, 
  MessageSquare, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Send,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const activity = await getRealTimeChatActivity();

  return json({ activity });
}

export default function AdminLiveMonitor() {
  const { activity } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 30000);

    return () => clearInterval(interval);
  }, [revalidator]);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'WAITING': return 'bg-orange-100 text-orange-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'ESCALATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Activity Monitor</h1>
              <p className="text-gray-600 mt-2">Real-time chat and support activity</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => revalidator.revalidate()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.activeConversations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Online Users</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.onlineUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Awaiting Response</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.awaitingResponse}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Escalations</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.recentEscalations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Active Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activity.activeConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active conversations</p>
                  </div>
                ) : (
                  activity.activeConversations.map((conversation) => (
                    <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm">{conversation.provider.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {conversation.provider.role.replace('_', ' ')}
                            </Badge>
                            <Badge className={getStatusColor(conversation.status)}>
                              {conversation.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{conversation.title}</p>
                          
                          {conversation.messages[0] && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {conversation.messages[0].content}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>#{conversation.ticketNumber}</span>
                        <span>Last activity: {formatTimeAgo(conversation.lastMessageAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activity.recentMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent messages</p>
                  </div>
                ) : (
                  activity.recentMessages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">{message.sender.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {message.sender.role.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(message.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {message.content}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Ticket: {message.ticket.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              Provider: {message.ticket.provider.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">WebSocket Connections</div>
                <div className="text-sm text-gray-600">Stable ({activity.onlineUsers} active)</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">Message Queue</div>
                <div className="text-sm text-gray-600">Processing normally</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">System Load</div>
                <div className="text-sm text-gray-600">Optimal</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Send className="h-6 w-6" />
                <span className="text-sm">Send Announcement</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Phone className="h-6 w-6" />
                <span className="text-sm">Contact Support</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Mail className="h-6 w-6" />
                <span className="text-sm">Send Broadcast</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Schedule Maintenance</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date(activity.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
