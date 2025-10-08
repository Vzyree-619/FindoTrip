import { prisma } from "~/lib/db/db.server";
import { calculateProviderPerformanceScore, type ProviderPerformanceScore } from "~/lib/utils/chat-analytics.server";

export interface PerformanceLeaderboard {
  providers: Array<{
    id: string;
    name: string;
    role: string;
    score: number;
    rank: number;
    breakdown: {
      responseTime: number;
      responseRate: number;
      customerSatisfaction: number;
      conversionRate: number;
      messageQuality: number;
    };
    totalBookings: number;
    totalRevenue: number;
    customerRating: number;
  }>;
  totalProviders: number;
  averageScore: number;
  topPerformers: Array<{
    id: string;
    name: string;
    score: number;
    improvement: number;
  }>;
  strugglingProviders: Array<{
    id: string;
    name: string;
    score: number;
    issues: string[];
  }>;
}

export interface PerformanceInsights {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  keyMetrics: {
    averageScore: number;
    topPerformerScore: number;
    strugglingProviderScore: number;
    scoreDistribution: Record<string, number>;
  };
  trends: {
    improvingProviders: number;
    decliningProviders: number;
    stableProviders: number;
  };
  recommendations: Array<{
    type: 'individual' | 'platform' | 'system';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
  }>;
}

/**
 * Get performance leaderboard for all providers
 */
export async function getPerformanceLeaderboard(
  startDate?: Date,
  endDate?: Date
): Promise<PerformanceLeaderboard> {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || now;

  // Get all providers
  const providers = await prisma.user.findMany({
    where: {
      role: {
        in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'],
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  // Calculate scores for each provider
  const providerScores = await Promise.all(
    providers.map(async (provider) => {
      const score = await calculateProviderPerformanceScore(
        provider.id,
        defaultStartDate,
        defaultEndDate
      );

      // Get additional metrics
      const totalBookings = await getTotalBookings(provider.id, defaultStartDate, defaultEndDate);
      const totalRevenue = await getTotalRevenue(provider.id, defaultStartDate, defaultEndDate);
      const customerRating = await getCustomerRating(provider.id, defaultStartDate, defaultEndDate);

      return {
        id: provider.id,
        name: provider.name,
        role: provider.role,
        score: score.score,
        rank: score.rank,
        breakdown: score.breakdown,
        totalBookings,
        totalRevenue,
        customerRating,
      };
    })
  );

  // Sort by score
  const sortedProviders = providerScores.sort((a, b) => b.score - a.score);

  // Calculate average score
  const averageScore = sortedProviders.reduce((sum, provider) => sum + provider.score, 0) / sortedProviders.length;

  // Get top performers (top 10%)
  const topPerformerCount = Math.max(1, Math.floor(sortedProviders.length * 0.1));
  const topPerformers = sortedProviders.slice(0, topPerformerCount).map((provider, index) => ({
    id: provider.id,
    name: provider.name,
    score: provider.score,
    improvement: index === 0 ? 0 : provider.score - sortedProviders[index - 1]?.score || 0,
  }));

  // Get struggling providers (bottom 20%)
  const strugglingCount = Math.max(1, Math.floor(sortedProviders.length * 0.2));
  const strugglingProviders = sortedProviders.slice(-strugglingCount).map((provider) => ({
    id: provider.id,
    name: provider.name,
    score: provider.score,
    issues: getPerformanceIssues(provider.breakdown),
  }));

  return {
    providers: sortedProviders,
    totalProviders: sortedProviders.length,
    averageScore: Math.round(averageScore),
    topPerformers,
    strugglingProviders,
  };
}

/**
 * Get performance insights and recommendations
 */
export async function getPerformanceInsights(
  startDate?: Date,
  endDate?: Date
): Promise<PerformanceInsights> {
  const leaderboard = await getPerformanceLeaderboard(startDate, endDate);

  // Calculate overall health
  const overallHealth = getOverallHealth(leaderboard.averageScore);

  // Calculate key metrics
  const keyMetrics = {
    averageScore: leaderboard.averageScore,
    topPerformerScore: leaderboard.topPerformers[0]?.score || 0,
    strugglingProviderScore: leaderboard.strugglingProviders[0]?.score || 0,
    scoreDistribution: getScoreDistribution(leaderboard.providers),
  };

  // Calculate trends (mock for now)
  const trends = {
    improvingProviders: Math.floor(leaderboard.totalProviders * 0.3),
    decliningProviders: Math.floor(leaderboard.totalProviders * 0.1),
    stableProviders: leaderboard.totalProviders - Math.floor(leaderboard.totalProviders * 0.3) - Math.floor(leaderboard.totalProviders * 0.1),
  };

  // Generate recommendations
  const recommendations = generateRecommendations(leaderboard, keyMetrics);

  return {
    overallHealth,
    keyMetrics,
    trends,
    recommendations,
  };
}

/**
 * Get individual provider performance report
 */
export async function getProviderPerformanceReport(
  providerId: string,
  startDate?: Date,
  endDate?: Date
) {
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || now;

  const score = await calculateProviderPerformanceScore(providerId, defaultStartDate, defaultEndDate);
  const leaderboard = await getPerformanceLeaderboard(startDate, endDate);
  const provider = leaderboard.providers.find(p => p.id === providerId);

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Get historical performance
  const historicalScores = await getHistoricalScores(providerId, defaultStartDate, defaultEndDate);

  // Get improvement suggestions
  const suggestions = getImprovementSuggestions(score.breakdown);

  // Get comparison with similar providers
  const similarProviders = getSimilarProviders(provider, leaderboard.providers);

  return {
    currentScore: score,
    provider,
    historicalScores,
    suggestions,
    similarProviders,
    leaderboard: {
      rank: score.rank,
      totalProviders: score.totalProviders,
      percentile: Math.round(((score.totalProviders - score.rank + 1) / score.totalProviders) * 100),
    },
  };
}

// Helper functions

async function getTotalBookings(providerId: string, startDate: Date, endDate: Date): Promise<number> {
  // Get bookings for all service types
  const [propertyBookings, vehicleBookings, tourBookings] = await Promise.all([
    prisma.propertyBooking.count({
      where: {
        property: {
          ownerId: providerId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.vehicleBooking.count({
      where: {
        vehicle: {
          ownerId: providerId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.tourBooking.count({
      where: {
        tour: {
          guideId: providerId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);

  return propertyBookings + vehicleBookings + tourBookings;
}

async function getTotalRevenue(providerId: string, startDate: Date, endDate: Date): Promise<number> {
  // Get revenue from all service types
  const [propertyRevenue, vehicleRevenue, tourRevenue] = await Promise.all([
    prisma.propertyBooking.aggregate({
      where: {
        property: {
          ownerId: providerId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
      },
      _sum: {
        basePrice: true,
      },
    }),
    prisma.vehicleBooking.aggregate({
      where: {
        vehicle: {
          ownerId: providerId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
      },
      _sum: {
        basePrice: true,
      },
    }),
    prisma.tourBooking.aggregate({
      where: {
        tour: {
          guideId: providerId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
      },
      _sum: {
        pricePerPerson: true,
      },
    }),
  ]);

  return (propertyRevenue._sum.basePrice || 0) + 
         (vehicleRevenue._sum.basePrice || 0) + 
         (tourRevenue._sum.pricePerPerson || 0);
}

async function getCustomerRating(providerId: string, startDate: Date, endDate: Date): Promise<number> {
  // Get average rating from reviews
  const reviews = await prisma.review.findMany({
    where: {
      property: {
        ownerId: providerId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length === 0) return 0;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}

function getOverallHealth(averageScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (averageScore >= 85) return 'excellent';
  if (averageScore >= 70) return 'good';
  if (averageScore >= 50) return 'fair';
  return 'poor';
}

function getScoreDistribution(providers: any[]): Record<string, number> {
  const distribution = {
    'excellent': 0, // 85-100
    'good': 0,     // 70-84
    'fair': 0,      // 50-69
    'poor': 0,      // 0-49
  };

  providers.forEach(provider => {
    if (provider.score >= 85) distribution.excellent++;
    else if (provider.score >= 70) distribution.good++;
    else if (provider.score >= 50) distribution.fair++;
    else distribution.poor++;
  });

  return distribution;
}

function getPerformanceIssues(breakdown: any): string[] {
  const issues = [];

  if (breakdown.responseTime < 60) {
    issues.push("Slow response time");
  }
  if (breakdown.responseRate < 70) {
    issues.push("Low response rate");
  }
  if (breakdown.customerSatisfaction < 70) {
    issues.push("Poor customer satisfaction");
  }
  if (breakdown.conversionRate < 20) {
    issues.push("Low conversion rate");
  }
  if (breakdown.messageQuality < 70) {
    issues.push("Poor message quality");
  }

  return issues;
}

function generateRecommendations(
  leaderboard: PerformanceLeaderboard,
  keyMetrics: any
): Array<{
  type: 'individual' | 'platform' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}> {
  const recommendations: Array<{
    type: 'individual' | 'platform' | 'system';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
  }> = [];

  // Platform-level recommendations
  if (keyMetrics.averageScore < 70) {
    recommendations.push({
      type: 'platform',
      priority: 'high',
      title: 'Improve Overall Platform Performance',
      description: 'The average provider performance is below optimal levels. Consider implementing training programs.',
      action: 'Launch provider training initiative',
    });
  }

  // Individual recommendations for struggling providers
  if (leaderboard.strugglingProviders.length > 0) {
    recommendations.push({
      type: 'individual',
      priority: 'high',
      title: 'Support Struggling Providers',
      description: `${leaderboard.strugglingProviders.length} providers are performing below expectations.`,
      action: 'Schedule one-on-one support sessions',
    });
  }

  // System recommendations
  if (keyMetrics.scoreDistribution.poor > leaderboard.totalProviders * 0.2) {
    recommendations.push({
      type: 'system',
      priority: 'medium',
      title: 'Review Performance Metrics',
      description: 'A significant portion of providers are struggling. Review and adjust performance criteria.',
      action: 'Analyze performance criteria and adjust if needed',
    });
  }

  return recommendations;
}

async function getHistoricalScores(providerId: string, startDate: Date, endDate: Date) {
  // Mock historical data - would calculate scores for different time periods
  return [
    { period: 'Week 1', score: 75 },
    { period: 'Week 2', score: 78 },
    { period: 'Week 3', score: 82 },
    { period: 'Week 4', score: 85 },
  ];
}

function getImprovementSuggestions(breakdown: any): string[] {
  const suggestions = [];

  if (breakdown.responseTime < 80) {
    suggestions.push("Set up auto-responses for when you're unavailable");
    suggestions.push("Use mobile notifications to respond faster");
  }

  if (breakdown.responseRate < 80) {
    suggestions.push("Check messages more frequently throughout the day");
    suggestions.push("Set up message forwarding to your phone");
  }

  if (breakdown.customerSatisfaction < 80) {
    suggestions.push("Ask customers for feedback on your communication");
    suggestions.push("Use more professional and friendly language");
  }

  if (breakdown.conversionRate < 30) {
    suggestions.push("Provide more detailed information about your services");
    suggestions.push("Follow up with potential customers who don't book");
  }

  if (breakdown.messageQuality < 80) {
    suggestions.push("Use proper grammar and spelling");
    suggestions.push("Be more specific and helpful in your responses");
  }

  return suggestions;
}

function getSimilarProviders(provider: any, allProviders: any[]): any[] {
  // Find providers with similar roles and performance
  const similarProviders = allProviders
    .filter(p => p.id !== provider.id && p.role === provider.role)
    .filter(p => Math.abs(p.score - provider.score) <= 10)
    .slice(0, 5);

  return similarProviders;
}
