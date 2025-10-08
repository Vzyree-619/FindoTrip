import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { getCustomerChatInsights } from "~/lib/utils/chat-analytics.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  Star,
  Calendar,
  Bookmark,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";

import { listMessages } from "~/lib/messaging.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "30";
  const peerId = url.searchParams.get("peerId") || "";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const insights = await getCustomerChatInsights(userId, startDate, new Date());
  let messages: Array<any> | undefined;
  let peer: { id: string; name: string; avatar?: string | null } | undefined;
  if (peerId) {
    messages = await listMessages(userId, peerId, 100);
    const peerUser = await prisma.user.findUnique({ where: { id: peerId }, select: { id: true, name: true, avatar: true } });
    if (peerUser) peer = peerUser;
  }

  return json({ insights, period, peerId, peer, messages });
}

export default function CustomerMessages() {
  const { insights, period, peerId, peer, messages } = useLoaderData<typeof loader>();
  const [thread, setThread] = useState(messages || []);
  const fetcher = useFetcher();

  useEffect(() => {
    setThread(messages || []);
  }, [messages]);

  useEffect(() => {
    if (!peerId) return;
    const interval = setInterval(() => {
      fetcher.load(`/api/messages?mode=messages&peerId=${peerId}&take=100`);
    }, 5000);
    return () => clearInterval(interval);
  }, [peerId]);

  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).items) {
      setThread((fetcher.data as any).items);
    }
  }, [fetcher.data]);

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getResponseTimeColor = (minutes: number) => {
    if (minutes < 30) return "text-green-600";
    if (minutes < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getResponseTimeIcon = (minutes: number) => {
    if (minutes < 30) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (minutes < 60) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {peerId && peer && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat with {peer.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto border rounded p-3 bg-white">
                  {thread.length === 0 ? (
                    <div className="text-gray-500 text-sm">No messages yet. Say hello!</div>
                  ) : (
                    thread.map((m: any) => (
                      <div key={m.id} className="mb-3">
                        <div className="text-xs text-gray-500">{new Date(m["createdAt" as any]).toLocaleString()}</div>
                        <div className={`inline-block px-3 py-2 rounded-lg ${m.senderId === peerId ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Form method="post" action="/api/messages" className="mt-4 flex gap-2">
                  <input type="hidden" name="intent" value="send" />
                  <input type="hidden" name="receiverId" value={peerId} />
                  <input type="text" name="content" placeholder="Type a message..." className="flex-1 border rounded px-3 py-2" required />
                  <Button type="submit">Send</Button>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Messages</h1>
          <p className="text-gray-600 mt-2">Manage your conversations with service providers</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{insights.activeConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className={`text-2xl font-bold ${getResponseTimeColor(insights.responseTimes.average)}`}>
                    {formatResponseTime(insights.responseTimes.average)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Providers Contacted</p>
                  <p className="text-2xl font-bold text-gray-900">{insights.conversations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Conversations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Recent Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversations Yet</h3>
                      <p className="text-gray-600 mb-4">
                        Start a conversation with a service provider to get help with your bookings.
                      </p>
                      <Button>
                        Browse Services
                      </Button>
                    </div>
                  ) : (
                    insights.conversations.map((conversation) => (
                      <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium">{conversation.provider.name}</h3>
                              <Badge variant="outline">
                                {conversation.provider.role.replace('_', ' ')}
                              </Badge>
                              <Badge className={
                                conversation.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                conversation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {conversation.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {conversation.messages[0] && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {conversation.messages[0].content}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>#{conversation.ticketNumber}</span>
                              <span>•</span>
                              <span>Last message: {new Date(conversation.lastMessageAt).toLocaleDateString()}</span>
                              {conversation.messages[0] && (
                                <>
                                  <span>•</span>
                                  <span>From: {conversation.messages[0].sender.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Bookmark className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Response Times */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average</span>
                    <div className="flex items-center space-x-2">
                      {getResponseTimeIcon(insights.responseTimes.average)}
                      <span className={`text-sm font-medium ${getResponseTimeColor(insights.responseTimes.average)}`}>
                        {formatResponseTime(insights.responseTimes.average)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fastest</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {formatResponseTime(insights.responseTimes.fastest)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Slowest</span>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {formatResponseTime(insights.responseTimes.slowest)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linked Bookings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Linked Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.linkedBookings.length === 0 ? (
                    <p className="text-sm text-gray-500">No bookings linked to conversations yet</p>
                  ) : (
                    insights.linkedBookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{booking.property.name}</h4>
                            <p className="text-xs text-gray-600">
                              Owner: {booking.property.owner.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Provider Performance Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Provider Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.conversations.map((conversation) => {
                const responseTime = Math.random() * 120 + 15; // Mock response time
                return (
                  <div key={conversation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{conversation.provider.name}</h4>
                        <p className="text-sm text-gray-600">{conversation.provider.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <div className="flex items-center space-x-1">
                          {getResponseTimeIcon(responseTime)}
                          <span className={`text-sm font-medium ${getResponseTimeColor(responseTime)}`}>
                            {formatResponseTime(responseTime)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Messages</span>
                        <span className="text-sm font-medium">{conversation.messages.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status</span>
                        <Badge className={
                          conversation.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          conversation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {conversation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Start New Chat</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Bookmark className="h-6 w-6" />
                <span className="text-sm">Saved Messages</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Phone className="h-6 w-6" />
                <span className="text-sm">Contact Support</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <ExternalLink className="h-6 w-6" />
                <span className="text-sm">Browse Services</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
