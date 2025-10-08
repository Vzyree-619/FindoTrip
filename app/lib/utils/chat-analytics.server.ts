import { prisma } from "~/lib/db/db.server";

export interface ChatMetrics {
  totalMessages: number;
  averageResponseTime: number;
  responseRate: number;
  conversionRate: number;
  customerSatisfaction: number;
  peakHours: number[];
  busiestDays: string[];
  messageVolume: MessageVolumeData[];
  responseTimeTrend: ResponseTimeData[];
  conversionTrend: ConversionData[];
}

export interface MessageVolumeData {
  date: string;
  messages: number;
  conversations: number;
}

export interface ResponseTimeData {
  date: string;
  averageResponseTime: number;
  firstResponseTime: number;
}

export interface ConversionData {
  date: string;
  inquiries: number;
  bookings: number;
  conversionRate: number;
}

export interface ProviderPerformanceScore {
  providerId: string;
  score: number;
  breakdown: {
    responseTime: number;
    responseRate: number;
    customerSatisfaction: number;
    conversionRate: number;
    messageQuality: number;
  };
  rank: number;
  totalProviders: number;
}

export interface PlatformMetrics {
  totalMessages: number;
  activeConversations: number;
  averageResponseTime: number;
  responseRate: number;
  conversionRate: number;
  customerSatisfaction: number;
  peakUsageTimes: number[];
  messageVolumeTrend: MessageVolumeData[];
  responseTimeByRole: Record<string, number>;
  supportTicketMetrics: SupportTicketMetrics;
  userEngagement: UserEngagementMetrics;
  conversionMetrics: ConversionMetrics;
  qualityMetrics: QualityMetrics;
}

export interface SupportTicketMetrics {
  totalTickets: number;
  averageResolutionTime: number;
  firstResponseTime: number;
  customerSatisfaction: number;
  escalatedTickets: number;
  reopenedTickets: number;
  ticketsByCategory: Record<string, number>;
}

export interface UserEngagementMetrics {
  customerChatUsage: number;
  providerResponseRate1Hour: number;
  providerResponseRate24Hours: number;
  averageMessagesPerConversation: number;
  averageConversationDuration: number;
}

export interface ConversionMetrics {
  chatInquiriesToBookings: number;
  revenueFromChat: number;
  averageBookingValueChat: number;
  averageBookingValueNoChat: number;
  topPerformingProviders: Array<{
    providerId: string;
    name: string;
    chatEngagement: number;
  }>;
}

export interface QualityMetrics {
  flaggedMessages: number;
  abuseReports: number;
  userBlocks: number;
  deletedConversations: number;
  averageMessageLength: number;
  professionalTonePercentage: number;
}

/**
 * Get provider chat performance metrics
 */
export async function getProviderChatMetrics(
  providerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ChatMetrics> {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const defaultEndDate = endDate || now;

  // Get all messages for the provider
  const messages = await prisma.supportMessage.findMany({
    where: {
      ticket: {
        providerId,
      },
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
    include: {
      sender: {
        select: {
          role: true,
        },
      },
      ticket: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Calculate response times
  const responseTimes = calculateResponseTimes(messages);
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;

  // Calculate response rate
  const totalInquiries = await prisma.supportTicket.count({
    where: {
      providerId,
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
  });

  const respondedInquiries = await prisma.supportTicket.count({
    where: {
      providerId,
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
      messages: {
        some: {
          sender: {
            role: providerId === providerId ? 'PROPERTY_OWNER' : 'CUSTOMER',
          },
        },
      },
    },
  });

  const responseRate = totalInquiries > 0 ? (respondedInquiries / totalInquiries) * 100 : 0;

  // Calculate conversion rate
  const inquiries = await prisma.supportTicket.count({
    where: {
      providerId,
      category: 'APPROVAL_QUESTIONS',
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
  });

  const conversions = await prisma.supportTicket.count({
    where: {
      providerId,
      category: 'APPROVAL_QUESTIONS',
      status: 'RESOLVED',
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
  });

  const conversionRate = inquiries > 0 ? (conversions / inquiries) * 100 : 0;

  // Calculate customer satisfaction (mock for now)
  const customerSatisfaction = 4.2; // This would come from actual ratings

  // Get peak hours
  const peakHours = getPeakHours(messages);
  const busiestDays = getBusiestDays(messages);

  // Get message volume data
  const messageVolume = getMessageVolumeData(messages, defaultStartDate, defaultEndDate);

  // Get response time trend
  const responseTimeTrend = getResponseTimeTrend(messages, defaultStartDate, defaultEndDate);

  // Get conversion trend
  const conversionTrend = getConversionTrend(providerId, defaultStartDate, defaultEndDate);

  return {
    totalMessages: messages.length,
    averageResponseTime,
    responseRate,
    conversionRate,
    customerSatisfaction,
    peakHours,
    busiestDays,
    messageVolume,
    responseTimeTrend,
    conversionTrend,
  };
}

/**
 * Get customer chat insights
 */
export async function getCustomerChatInsights(
  customerId: string,
  startDate?: Date,
  endDate?: Date
) {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || now;

  // Get active conversations
  const activeConversations = await prisma.supportTicket.count({
    where: {
      providerId: customerId,
      status: {
        in: ['NEW', 'IN_PROGRESS', 'WAITING'],
      },
    },
  });

  // Get conversation history with providers
  const conversations = await prisma.supportTicket.findMany({
    where: {
      providerId: customerId,
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
    include: {
      provider: {
        select: {
          name: true,
          role: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  // Calculate response times from providers
  const responseTimes = await calculateProviderResponseTimes(customerId, defaultStartDate, defaultEndDate);

  // Get linked bookings
  const linkedBookings = await prisma.propertyBooking.findMany({
    where: {
      userId: customerId,
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
    include: {
      property: {
        select: {
          name: true,
          owner: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    activeConversations,
    conversations,
    responseTimes,
    linkedBookings,
  };
}

/**
 * Get platform-wide chat analytics
 */
export async function getPlatformChatMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<PlatformMetrics> {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || now;

  // Get total messages
  const totalMessages = await prisma.supportMessage.count({
    where: {
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
  });

  // Get active conversations
  const activeConversations = await prisma.supportTicket.count({
    where: {
      status: {
        in: ['NEW', 'IN_PROGRESS', 'WAITING'],
      },
    },
  });

  // Get average response time
  const averageResponseTime = await calculatePlatformAverageResponseTime(defaultStartDate, defaultEndDate);

  // Get response rate
  const responseRate = await calculatePlatformResponseRate(defaultStartDate, defaultEndDate);

  // Get conversion rate
  const conversionRate = await calculatePlatformConversionRate(defaultStartDate, defaultEndDate);

  // Get customer satisfaction
  const customerSatisfaction = 4.1; // Mock data

  // Get peak usage times
  const peakUsageTimes = await getPlatformPeakUsageTimes(defaultStartDate, defaultEndDate);

  // Get message volume trend
  const messageVolumeTrend = await getPlatformMessageVolumeTrend(defaultStartDate, defaultEndDate);

  // Get response time by role
  const responseTimeByRole = await getResponseTimeByRole(defaultStartDate, defaultEndDate);

  // Get support ticket metrics
  const supportTicketMetrics = await getSupportTicketMetrics(defaultStartDate, defaultEndDate);

  // Get user engagement metrics
  const userEngagement = await getUserEngagementMetrics(defaultStartDate, defaultEndDate);

  // Get conversion metrics
  const conversionMetrics = await getConversionMetrics(defaultStartDate, defaultEndDate);

  // Get quality metrics
  const qualityMetrics = await getQualityMetrics(defaultStartDate, defaultEndDate);

  return {
    totalMessages,
    activeConversations,
    averageResponseTime,
    responseRate,
    conversionRate,
    customerSatisfaction,
    peakUsageTimes,
    messageVolumeTrend,
    responseTimeByRole,
    supportTicketMetrics,
    userEngagement,
    conversionMetrics,
    qualityMetrics,
  };
}

/**
 * Get real-time chat activity
 */
export async function getRealTimeChatActivity() {
  const now = new Date();
  const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

  // Get currently active conversations
  const activeConversations = await prisma.supportTicket.findMany({
    where: {
      status: {
        in: ['NEW', 'IN_PROGRESS', 'WAITING'],
      },
    },
    include: {
      provider: {
        select: {
          name: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
    take: 20,
  });

  // Get recent messages
  const recentMessages = await prisma.supportMessage.findMany({
    where: {
      createdAt: {
        gte: last5Minutes,
      },
    },
    include: {
      sender: {
        select: {
          name: true,
          role: true,
        },
      },
      ticket: {
        select: {
          id: true,
          title: true,
          provider: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  // Get online users (mock for now)
  const onlineUsers = await prisma.user.count({
    where: {
      lastActiveAt: {
        gte: new Date(now.getTime() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
  });

  // Get support tickets awaiting response
  const awaitingResponse = await prisma.supportTicket.count({
    where: {
      status: 'NEW',
    },
  });

  // Get recent escalations
  const recentEscalations = await prisma.supportTicket.count({
    where: {
      escalated: true,
      escalatedAt: {
        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  return {
    activeConversations,
    recentMessages,
    onlineUsers,
    awaitingResponse,
    recentEscalations,
    timestamp: now,
  };
}

/**
 * Calculate provider performance score
 */
export async function calculateProviderPerformanceScore(
  providerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ProviderPerformanceScore> {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || now;

  const metrics = await getProviderChatMetrics(providerId, defaultStartDate, defaultEndDate);

  // Calculate individual scores (0-100)
  const responseTimeScore = Math.max(0, 100 - (metrics.averageResponseTime / 60)); // Penalty for slow response
  const responseRateScore = metrics.responseRate;
  const customerSatisfactionScore = (metrics.customerSatisfaction / 5) * 100;
  const conversionRateScore = metrics.conversionRate;
  const messageQualityScore = 85; // Mock - would be calculated from message analysis

  // Weighted average
  const weights = {
    responseTime: 0.25,
    responseRate: 0.25,
    customerSatisfaction: 0.25,
    conversionRate: 0.15,
    messageQuality: 0.10,
  };

  const score = Math.round(
    responseTimeScore * weights.responseTime +
    responseRateScore * weights.responseRate +
    customerSatisfactionScore * weights.customerSatisfaction +
    conversionRateScore * weights.conversionRate +
    messageQualityScore * weights.messageQuality
  );

  // Get rank among all providers
  const allProviders = await getAllProviderScores(defaultStartDate, defaultEndDate);
  const sortedProviders = allProviders.sort((a, b) => b.score - a.score);
  const rank = sortedProviders.findIndex(p => p.providerId === providerId) + 1;

  return {
    providerId,
    score: Math.max(0, Math.min(100, score)),
    breakdown: {
      responseTime: Math.round(responseTimeScore),
      responseRate: Math.round(responseRateScore),
      customerSatisfaction: Math.round(customerSatisfactionScore),
      conversionRate: Math.round(conversionRateScore),
      messageQuality: Math.round(messageQualityScore),
    },
    rank,
    totalProviders: allProviders.length,
  };
}

// Helper functions

function calculateResponseTimes(messages: any[]): number[] {
  const responseTimes: number[] = [];
  const providerMessages = messages.filter(m => m.sender.role !== 'CUSTOMER');
  
  for (let i = 0; i < providerMessages.length; i++) {
    const currentMessage = providerMessages[i];
    const previousMessage = messages.find(m => 
      m.createdAt < currentMessage.createdAt && 
      m.sender.role === 'CUSTOMER'
    );
    
    if (previousMessage) {
      const responseTime = currentMessage.createdAt.getTime() - previousMessage.createdAt.getTime();
      responseTimes.push(responseTime / (1000 * 60)); // Convert to minutes
    }
  }
  
  return responseTimes;
}

function getPeakHours(messages: any[]): number[] {
  const hourCounts = new Array(24).fill(0);
  
  messages.forEach(message => {
    const hour = message.createdAt.getHours();
    hourCounts[hour]++;
  });
  
  // Find top 3 hours
  return hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.hour);
}

function getBusiestDays(messages: any[]): string[] {
  const dayCounts = new Array(7).fill(0);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  messages.forEach(message => {
    const day = message.createdAt.getDay();
    dayCounts[day]++;
  });
  
  return dayCounts
    .map((count, day) => ({ day: dayNames[day], count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.day);
}

function getMessageVolumeData(messages: any[], startDate: Date, endDate: Date): MessageVolumeData[] {
  const data: MessageVolumeData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const dayMessages = messages.filter(m => 
      m.createdAt >= dayStart && m.createdAt < dayEnd
    );
    
    const conversations = new Set(dayMessages.map(m => m.ticket.id)).size;
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      messages: dayMessages.length,
      conversations,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}

function getResponseTimeTrend(messages: any[], startDate: Date, endDate: Date): ResponseTimeData[] {
  const data: ResponseTimeData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const dayMessages = messages.filter(m => 
      m.createdAt >= dayStart && m.createdAt < dayEnd
    );
    
    const responseTimes = calculateResponseTimes(dayMessages);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      averageResponseTime,
      firstResponseTime: averageResponseTime, // Simplified
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}

async function getConversionTrend(providerId: string, startDate: Date, endDate: Date): Promise<ConversionData[]> {
  const data: ConversionData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const inquiries = await prisma.supportTicket.count({
      where: {
        providerId,
        category: 'APPROVAL_QUESTIONS',
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });
    
    const bookings = await prisma.supportTicket.count({
      where: {
        providerId,
        category: 'APPROVAL_QUESTIONS',
        status: 'RESOLVED',
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      inquiries,
      bookings,
      conversionRate: inquiries > 0 ? (bookings / inquiries) * 100 : 0,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}

async function calculateProviderResponseTimes(customerId: string, startDate: Date, endDate: Date) {
  // This would calculate actual response times from providers
  return {
    average: 45, // minutes
    fastest: 5,
    slowest: 180,
  };
}

async function calculatePlatformAverageResponseTime(startDate: Date, endDate: Date): Promise<number> {
  // Mock implementation
  return 35; // minutes
}

async function calculatePlatformResponseRate(startDate: Date, endDate: Date): Promise<number> {
  // Mock implementation
  return 85; // percentage
}

async function calculatePlatformConversionRate(startDate: Date, endDate: Date): Promise<number> {
  // Mock implementation
  return 25; // percentage
}

async function getPlatformPeakUsageTimes(startDate: Date, endDate: Date): Promise<number[]> {
  // Mock implementation
  return [9, 14, 20]; // Peak hours
}

async function getPlatformMessageVolumeTrend(startDate: Date, endDate: Date): Promise<MessageVolumeData[]> {
  // Mock implementation
  return [];
}

async function getResponseTimeByRole(startDate: Date, endDate: Date): Promise<Record<string, number>> {
  return {
    'PROPERTY_OWNER': 30,
    'VEHICLE_OWNER': 45,
    'TOUR_GUIDE': 25,
    'SUPER_ADMIN': 15,
  };
}

async function getSupportTicketMetrics(startDate: Date, endDate: Date): Promise<SupportTicketMetrics> {
  return {
    totalTickets: 150,
    averageResolutionTime: 2.5, // hours
    firstResponseTime: 0.5, // hours
    customerSatisfaction: 4.2,
    escalatedTickets: 5,
    reopenedTickets: 3,
    ticketsByCategory: {
      'TECHNICAL_SUPPORT': 50,
      'APPROVAL_QUESTIONS': 40,
      'PAYMENT_ISSUES': 30,
      'OTHER': 30,
    },
  };
}

async function getUserEngagementMetrics(startDate: Date, endDate: Date): Promise<UserEngagementMetrics> {
  return {
    customerChatUsage: 75, // percentage
    providerResponseRate1Hour: 60,
    providerResponseRate24Hours: 90,
    averageMessagesPerConversation: 8.5,
    averageConversationDuration: 2.3, // hours
  };
}

async function getConversionMetrics(startDate: Date, endDate: Date): Promise<ConversionMetrics> {
  return {
    chatInquiriesToBookings: 25,
    revenueFromChat: 50000,
    averageBookingValueChat: 2000,
    averageBookingValueNoChat: 1500,
    topPerformingProviders: [
      { providerId: '1', name: 'John Doe', chatEngagement: 95 },
      { providerId: '2', name: 'Jane Smith', chatEngagement: 92 },
      { providerId: '3', name: 'Bob Johnson', chatEngagement: 88 },
    ],
  };
}

async function getQualityMetrics(startDate: Date, endDate: Date): Promise<QualityMetrics> {
  return {
    flaggedMessages: 12,
    abuseReports: 8,
    userBlocks: 5,
    deletedConversations: 3,
    averageMessageLength: 45,
    professionalTonePercentage: 85,
  };
}

async function getAllProviderScores(startDate: Date, endDate: Date): Promise<ProviderPerformanceScore[]> {
  // Mock implementation - would calculate scores for all providers
  return [
    { providerId: '1', score: 95, breakdown: {} as any, rank: 1, totalProviders: 100 },
    { providerId: '2', score: 92, breakdown: {} as any, rank: 2, totalProviders: 100 },
    { providerId: '3', score: 88, breakdown: {} as any, rank: 3, totalProviders: 100 },
  ];
}
