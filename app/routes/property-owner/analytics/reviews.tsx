import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { calculateProviderRating } from "~/lib/ratings.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  customer: {
    id: string;
    name: string;
    avatar?: string;
  };
  service: {
    id: string;
    title: string;
    type: 'property' | 'vehicle' | 'tour';
  };
  categories: {
    cleanliness?: number;
    communication?: number;
    value?: number;
    location?: number;
  };
  wouldRecommend: boolean;
  createdAt: string;
}

interface RatingBreakdown {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  total: number;
}

interface RatingTrend {
  month: string;
  averageRating: number;
  reviewCount: number;
}

interface LoaderData {
  provider: {
    id: string;
    name: string;
    averageRating: number;
    totalReviews: number;
  };
  recentReviews: ReviewData[];
  ratingBreakdown: RatingBreakdown;
  ratingTrends: RatingTrend[];
  categoryAverages: {
    cleanliness: number;
    communication: number;
    value: number;
    location: number;
  };
  comparison: {
    platformAverage: number;
    yourRating: number;
    percentile: number;
  };
}

// ========================================
// LOADER
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    
    // Get provider details
    const provider = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        averageRating: true,
        totalReviews: true
      }
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    // Get recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await prisma.review.findMany({
      where: {
        OR: [
          { property: { ownerId: userId } },
          { vehicle: { ownerId: userId } },
          { tour: { guideId: userId } }
        ],
        isActive: true,
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        property: {
          select: { id: true, title: true }
        },
        vehicle: {
          select: { id: true, name: true }
        },
        tour: {
          select: { id: true, title: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Format recent reviews
    const formattedReviews: ReviewData[] = recentReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customer: {
        id: review.customer.id,
        name: review.customer.name,
        avatar: review.customer.avatar
      },
      service: {
        id: review.property?.id || review.vehicle?.id || review.tour?.id || '',
        title: review.property?.title || review.vehicle?.name || review.tour?.title || '',
        type: review.property ? 'property' : review.vehicle ? 'vehicle' : 'tour'
      },
      categories: review.categories as any,
      wouldRecommend: review.wouldRecommend,
      createdAt: review.createdAt.toISOString()
    }));

    // Get rating breakdown
    const allReviews = await prisma.review.findMany({
      where: {
        OR: [
          { property: { ownerId: userId } },
          { vehicle: { ownerId: userId } },
          { tour: { guideId: userId } }
        ],
        isActive: true
      },
      select: {
        rating: true
      }
    });

    const ratingBreakdown: RatingBreakdown = {
      fiveStar: allReviews.filter(r => r.rating === 5).length,
      fourStar: allReviews.filter(r => r.rating === 4).length,
      threeStar: allReviews.filter(r => r.rating === 3).length,
      twoStar: allReviews.filter(r => r.rating === 2).length,
      oneStar: allReviews.filter(r => r.rating === 1).length,
      total: allReviews.length
    };

    // Get rating trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyReviews = await prisma.review.findMany({
      where: {
        OR: [
          { property: { ownerId: userId } },
          { vehicle: { ownerId: userId } },
          { tour: { guideId: userId } }
        ],
        isActive: true,
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        rating: true,
        createdAt: true
      }
    });

    // Group by month and calculate averages
    const monthlyData = new Map<string, { ratings: number[]; count: number }>();
    
    monthlyReviews.forEach(review => {
      const month = review.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { ratings: [], count: 0 });
      }
      monthlyData.get(month)!.ratings.push(review.rating);
      monthlyData.get(month)!.count++;
    });

    const ratingTrends: RatingTrend[] = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      averageRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length,
      reviewCount: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate category averages
    const categoryTotals = { cleanliness: 0, communication: 0, value: 0, location: 0 };
    let categoryCount = 0;

    allReviews.forEach(review => {
      if (review.categories) {
        const categories = review.categories as any;
        if (categories.cleanliness) {
          categoryTotals.cleanliness += categories.cleanliness;
          categoryCount++;
        }
        if (categories.communication) {
          categoryTotals.communication += categories.communication;
        }
        if (categories.value) {
          categoryTotals.value += categories.value;
        }
        if (categories.location) {
          categoryTotals.location += categories.location;
        }
      }
    });

    const categoryAverages = {
      cleanliness: categoryCount > 0 ? categoryTotals.cleanliness / categoryCount : 0,
      communication: categoryCount > 0 ? categoryTotals.communication / categoryCount : 0,
      value: categoryCount > 0 ? categoryTotals.value / categoryCount : 0,
      location: categoryCount > 0 ? categoryTotals.location / categoryCount : 0
    };

    // Get platform average for comparison
    const platformStats = await prisma.$queryRaw`
      SELECT AVG(average_rating) as platform_average
      FROM (
        SELECT average_rating FROM properties WHERE is_active = true AND is_approved = true
        UNION ALL
        SELECT average_rating FROM vehicles WHERE is_active = true AND is_approved = true
        UNION ALL
        SELECT average_rating FROM tours WHERE is_active = true AND is_approved = true
      ) ratings
    `;

    const platformAverage = platformStats[0]?.platform_average || 0;
    const yourRating = provider.averageRating || 0;
    const percentile = yourRating > platformAverage ? 
      Math.min(100, ((yourRating - platformAverage) / platformAverage) * 100 + 50) : 
      Math.max(0, (yourRating / platformAverage) * 50);

    const loaderData: LoaderData = {
      provider: {
        id: provider.id,
        name: provider.name,
        averageRating: provider.averageRating || 0,
        totalReviews: provider.totalReviews || 0
      },
      recentReviews: formattedReviews,
      ratingBreakdown,
      ratingTrends,
      categoryAverages,
      comparison: {
        platformAverage,
        yourRating,
        percentile: Math.round(percentile)
      }
    };

    return json(loaderData);
  } catch (error) {
    console.error("Error in reviews loader:", error);
    throw new Response("Failed to load reviews data", { status: 500 });
  }
}

// ========================================
// COMPONENT
// ========================================

export default function ReviewsAnalytics() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Analytics</h1>
            <p className="text-gray-600">Track your performance and customer feedback</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {data.provider.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              {data.provider.totalReviews} reviews
            </div>
          </div>
        </div>
      </div>

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Rating */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-3xl font-bold text-gray-900">
              {data.provider.averageRating.toFixed(1)}
            </div>
            <div className="text-yellow-400 text-2xl">★</div>
          </div>
          <div className="text-sm text-gray-600">
            {data.provider.totalReviews} total reviews
          </div>
          <div className="mt-2 text-sm text-green-600">
            {data.comparison.percentile}th percentile
          </div>
        </div>

        {/* Platform Comparison */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Comparison</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Your Rating</span>
              <span className="text-sm font-medium">{data.comparison.yourRating.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Platform Average</span>
              <span className="text-sm font-medium">{data.comparison.platformAverage.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(data.comparison.yourRating / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {data.ratingTrends.length > 0 ? data.ratingTrends[data.ratingTrends.length - 1].averageRating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">
            Last 30 days
          </div>
          {data.ratingTrends.length > 1 && (
            <div className="text-sm text-green-600 mt-1">
              {data.ratingTrends[data.ratingTrends.length - 1].averageRating > data.ratingTrends[data.ratingTrends.length - 2].averageRating ? '↗' : '↘'} 
              {Math.abs(data.ratingTrends[data.ratingTrends.length - 1].averageRating - data.ratingTrends[data.ratingTrends.length - 2].averageRating).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
        <div className="space-y-3">
          {[
            { stars: 5, count: data.ratingBreakdown.fiveStar, color: 'bg-green-500' },
            { stars: 4, count: data.ratingBreakdown.fourStar, color: 'bg-blue-500' },
            { stars: 3, count: data.ratingBreakdown.threeStar, color: 'bg-yellow-500' },
            { stars: 2, count: data.ratingBreakdown.twoStar, color: 'bg-orange-500' },
            { stars: 1, count: data.ratingBreakdown.oneStar, color: 'bg-red-500' }
          ].map(({ stars, count, color }) => (
            <div key={stars} className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600 w-8">{stars}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`${color} h-2 rounded-full`}
                  style={{ width: `${data.ratingBreakdown.total > 0 ? (count / data.ratingBreakdown.total) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Averages */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Cleanliness', value: data.categoryAverages.cleanliness },
            { name: 'Communication', value: data.categoryAverages.communication },
            { name: 'Value', value: data.categoryAverages.value },
            { name: 'Location', value: data.categoryAverages.location }
          ].map(({ name, value }) => (
            <div key={name} className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {value.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">{name}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-blue-600 h-1 rounded-full" 
                  style={{ width: `${(value / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {data.recentReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {review.customer.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{review.customer.name}</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Service: {review.service.title}</span>
                    <span>Type: {review.service.type}</span>
                    {review.wouldRecommend && (
                      <span className="text-green-600">✓ Recommended</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {data.recentReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent reviews
            </div>
          )}
        </div>
      </div>

      {/* Rating Trends Chart */}
      {data.ratingTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Trends</h3>
          <div className="h-64 flex items-end space-x-2">
            {data.ratingTrends.map((trend, index) => (
              <div key={trend.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-500 rounded-t"
                  style={{ 
                    height: `${(trend.averageRating / 5) * 200}px`,
                    width: '100%'
                  }}
                ></div>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {trend.month.substring(5)}<br />
                  {trend.averageRating.toFixed(1)}★
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
