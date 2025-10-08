import { prisma } from "~/lib/db/db.server";

export interface ChatInsight {
  id: string;
  type: 'improvement' | 'achievement' | 'trend' | 'recommendation' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
  data?: any;
  createdAt: Date;
}

export interface ProviderInsight {
  providerId: string;
  insights: ChatInsight[];
  summary: {
    totalInsights: number;
    highPriority: number;
    achievements: number;
    improvements: number;
  };
}

export interface AdminInsight {
  platformInsights: ChatInsight[];
  providerInsights: Array<{
    providerId: string;
    providerName: string;
    insights: ChatInsight[];
  }>;
  summary: {
    totalInsights: number;
    criticalIssues: number;
    opportunities: number;
  };
}

/**
 * Generate AI-powered insights for a specific provider
 */
export async function generateProviderInsights(
  providerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ProviderInsight> {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const defaultEndDate = endDate || now;

  const insights: ChatInsight[] = [];

  // Get provider data
  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    select: { name: true, role: true },
  });

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Get recent performance data
  const performanceData = await getProviderPerformanceData(providerId, defaultStartDate, defaultEndDate);
  const messageData = await getProviderMessageData(providerId, defaultStartDate, defaultEndDate);
  const bookingData = await getProviderBookingData(providerId, defaultStartDate, defaultEndDate);

  // Generate insights based on data analysis
  insights.push(...await analyzeResponseTime(performanceData, provider.name));
  insights.push(...await analyzeConversionRate(bookingData, provider.name));
  insights.push(...await analyzePeakHours(messageData, provider.name));
  insights.push(...await analyzeCommonQuestions(messageData, provider.name));
  insights.push(...await analyzeCustomerSatisfaction(performanceData, provider.name));
  insights.push(...await analyzeMessageQuality(messageData, provider.name));

  // Sort insights by priority
  insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return {
    providerId,
    insights,
    summary: {
      totalInsights: insights.length,
      highPriority: insights.filter(i => i.priority === 'high').length,
      achievements: insights.filter(i => i.type === 'achievement').length,
      improvements: insights.filter(i => i.type === 'improvement').length,
    },
  };
}

/**
 * Generate platform-wide insights for admins
 */
export async function generateAdminInsights(
  startDate?: Date,
  endDate?: Date
): Promise<AdminInsight> {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || now;

  const platformInsights: ChatInsight[] = [];
  const providerInsights: Array<{
    providerId: string;
    providerName: string;
    insights: ChatInsight[];
  }> = [];

  // Get platform data
  const platformData = await getPlatformData(defaultStartDate, defaultEndDate);
  const supportData = await getSupportData(defaultStartDate, defaultEndDate);
  const paymentData = await getPaymentData(defaultStartDate, defaultEndDate);

  // Generate platform insights
  platformInsights.push(...await analyzeSupportTicketTrends(supportData));
  platformInsights.push(...await analyzePaymentIssues(paymentData));
  platformInsights.push(...await analyzePlatformPerformance(platformData));
  platformInsights.push(...await analyzeUserEngagement(platformData));

  // Get insights for top providers
  const topProviders = await getTopProviders(defaultStartDate, defaultEndDate);
  for (const provider of topProviders) {
    const providerInsight = await generateProviderInsights(
      provider.id,
      defaultStartDate,
      defaultEndDate
    );
    providerInsights.push({
      providerId: provider.id,
      providerName: provider.name,
      insights: providerInsight.insights,
    });
  }

  return {
    platformInsights,
    providerInsights,
    summary: {
      totalInsights: platformInsights.length + providerInsights.reduce((sum, p) => sum + p.insights.length, 0),
      criticalIssues: platformInsights.filter(i => i.priority === 'high' && i.type === 'warning').length,
      opportunities: platformInsights.filter(i => i.type === 'recommendation').length,
    },
  };
}

// Analysis functions

async function analyzeResponseTime(data: any, providerName: string): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.responseTimeIncrease > 30) {
    insights.push({
      id: `response-time-${Date.now()}`,
      type: 'improvement',
      priority: 'high',
      title: 'Response Time Increased',
      description: `Your response time increased ${data.responseTimeIncrease}% this week. Consider enabling notifications.`,
      action: 'Enable push notifications for faster responses',
      impact: 'Faster responses lead to higher customer satisfaction',
      data: { increase: data.responseTimeIncrease },
      createdAt: new Date(),
    });
  }

  if (data.averageResponseTime < 30) {
    insights.push({
      id: `fast-response-${Date.now()}`,
      type: 'achievement',
      priority: 'medium',
      title: 'Excellent Response Time',
      description: `You're responding in an average of ${data.averageResponseTime} minutes - well above average!`,
      action: 'Keep up the great work!',
      impact: 'Fast responses increase booking conversion',
      data: { responseTime: data.averageResponseTime },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzeConversionRate(data: any, providerName: string): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.conversionRate > 40) {
    insights.push({
      id: `high-conversion-${Date.now()}`,
      type: 'achievement',
      priority: 'medium',
      title: 'High Conversion Rate',
      description: `You convert ${data.conversionRate}% of inquiries to bookings, ${data.conversionRate - 25}% above average!`,
      action: 'Share your success strategies with other providers',
      impact: 'High conversion rates maximize revenue',
      data: { conversionRate: data.conversionRate },
      createdAt: new Date(),
    });
  }

  if (data.conversionRate < 15) {
    insights.push({
      id: `low-conversion-${Date.now()}`,
      type: 'improvement',
      priority: 'high',
      title: 'Low Conversion Rate',
      description: `Your conversion rate is ${data.conversionRate}%. Focus on providing detailed information and quick responses.`,
      action: 'Improve listing descriptions and response quality',
      impact: 'Better communication increases bookings',
      data: { conversionRate: data.conversionRate },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzePeakHours(data: any, providerName: string): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.peakHours.length > 0) {
    const peakHour = data.peakHours[0];
    insights.push({
      id: `peak-hours-${Date.now()}`,
      type: 'recommendation',
      priority: 'medium',
      title: 'Peak Inquiry Hours',
      description: `Most inquiries come between ${peakHour}:00-${peakHour + 1}:00. Be available then for maximum impact.`,
      action: 'Schedule availability during peak hours',
      impact: 'Being available during peak hours increases bookings',
      data: { peakHours: data.peakHours },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzeCommonQuestions(data: any, providerName: string): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.commonQuestions.length > 0) {
    const topQuestion = data.commonQuestions[0];
    insights.push({
      id: `common-questions-${Date.now()}`,
      type: 'recommendation',
      priority: 'medium',
      title: 'Frequently Asked Questions',
      description: `Customers often ask about "${topQuestion}". Add this information to your listing description.`,
      action: 'Update listing with frequently asked information',
      impact: 'Proactive information reduces inquiry volume',
      data: { commonQuestions: data.commonQuestions },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzeCustomerSatisfaction(data: any, providerName: string): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.customerSatisfaction > 4.5) {
    insights.push({
      id: `high-satisfaction-${Date.now()}`,
      type: 'achievement',
      priority: 'medium',
      title: 'Excellent Customer Satisfaction',
      description: `Your customer satisfaction rating is ${data.customerSatisfaction}/5 - outstanding!`,
      action: 'Continue providing excellent service',
      impact: 'High satisfaction leads to repeat bookings',
      data: { satisfaction: data.customerSatisfaction },
      createdAt: new Date(),
    });
  }

  if (data.customerSatisfaction < 3.5) {
    insights.push({
      id: `low-satisfaction-${Date.now()}`,
      type: 'improvement',
      priority: 'high',
      title: 'Customer Satisfaction Needs Improvement',
      description: `Your satisfaction rating is ${data.customerSatisfaction}/5. Focus on communication quality.`,
      action: 'Ask customers for feedback and improve responses',
      impact: 'Better satisfaction increases bookings and reviews',
      data: { satisfaction: data.customerSatisfaction },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzeMessageQuality(data: any, providerName: string): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.messageQuality < 70) {
    insights.push({
      id: `message-quality-${Date.now()}`,
      type: 'improvement',
      priority: 'medium',
      title: 'Improve Message Quality',
      description: 'Your messages could be more professional and helpful. Use proper grammar and be more specific.',
      action: 'Review and improve message quality',
      impact: 'Better message quality increases customer trust',
      data: { quality: data.messageQuality },
      createdAt: new Date(),
    });
  }

  return insights;
}

// Admin analysis functions

async function analyzeSupportTicketTrends(data: any): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.ticketIncrease > 20) {
    insights.push({
      id: `support-increase-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'Support Tickets Increased',
      description: `Support tickets increased ${data.ticketIncrease}% this week. Consider adding staff.`,
      action: 'Hire additional support staff or implement automation',
      impact: 'Faster support resolution improves customer experience',
      data: { increase: data.ticketIncrease },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzePaymentIssues(data: any): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.paymentIssues > 0) {
    insights.push({
      id: `payment-issues-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'Payment Issues Detected',
      description: `Payment-related tickets tripled. Check payment system for issues.`,
      action: 'Investigate payment system and fix issues',
      impact: 'Payment issues directly affect revenue',
      data: { issues: data.paymentIssues },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzePlatformPerformance(data: any): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.approvalTime > 5) {
    insights.push({
      id: `approval-time-${Date.now()}`,
      type: 'recommendation',
      priority: 'medium',
      title: 'Property Approvals Taking Too Long',
      description: `Property approvals taking ${data.approvalTime} days on average. Consider hiring help.`,
      action: 'Hire additional approval staff or streamline process',
      impact: 'Faster approvals improve provider experience',
      data: { approvalTime: data.approvalTime },
      createdAt: new Date(),
    });
  }

  return insights;
}

async function analyzeUserEngagement(data: any): Promise<ChatInsight[]> {
  const insights: ChatInsight[] = [];
  
  if (data.engagementIncrease > 15) {
    insights.push({
      id: `engagement-increase-${Date.now()}`,
      type: 'achievement',
      priority: 'low',
      title: 'User Engagement Increased',
      description: `User engagement increased ${data.engagementIncrease}% this week.`,
      action: 'Continue current strategies and scale successful initiatives',
      impact: 'Higher engagement leads to more bookings',
      data: { increase: data.engagementIncrease },
      createdAt: new Date(),
    });
  }

  return insights;
}

// Helper functions to get data

async function getProviderPerformanceData(providerId: string, startDate: Date, endDate: Date) {
  // Mock data - would be replaced with actual database queries
  return {
    responseTimeIncrease: 25,
    averageResponseTime: 45,
    customerSatisfaction: 4.2,
    messageQuality: 75,
  };
}

async function getProviderMessageData(providerId: string, startDate: Date, endDate: Date) {
  return {
    peakHours: [18, 19, 20],
    commonQuestions: ['parking', 'check-in time', 'amenities'],
    totalMessages: 150,
  };
}

async function getProviderBookingData(providerId: string, startDate: Date, endDate: Date) {
  return {
    conversionRate: 35,
    totalBookings: 12,
    revenue: 2500,
  };
}

async function getPlatformData(startDate: Date, endDate: Date) {
  return {
    approvalTime: 6,
    engagementIncrease: 20,
    totalUsers: 1500,
  };
}

async function getSupportData(startDate: Date, endDate: Date) {
  return {
    ticketIncrease: 25,
    totalTickets: 150,
    resolutionTime: 2.5,
  };
}

async function getPaymentData(startDate: Date, endDate: Date) {
  return {
    paymentIssues: 15,
    totalTransactions: 500,
    successRate: 95,
  };
}

async function getTopProviders(startDate: Date, endDate: Date) {
  return [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Bob Johnson' },
  ];
}
