import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { getPerformanceLeaderboard, getPerformanceInsights } from "~/lib/utils/performance-scoring.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Activity,
  Crown,
  Medal,
  Zap
} from "lucide-react";

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

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "30";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const [leaderboard, insights] = await Promise.all([
    getPerformanceLeaderboard(startDate, new Date()),
    getPerformanceInsights(startDate, new Date()),
  ]);

  return json({ leaderboard, insights, period });
}

export default function AdminPerformance() {
  const { leaderboard, insights, period } = useLoaderData<typeof loader>();

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-100";
    if (score >= 70) return "bg-blue-100";
    if (score >= 50) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <Crown className="h-5 w-5 text-green-600" />;
      case 'good': return <Award className="h-5 w-5 text-blue-600" />;
      case 'fair': return <Medal className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (rank <= 3) return <Trophy className="h-4 w-4 text-orange-600" />;
    if (rank <= 10) return <Medal className="h-4 w-4 text-blue-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Provider Performance Leaderboard</h1>
          <p className="text-gray-600 mt-2">Track and analyze provider performance across the platform</p>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Providers</p>
                  <p className="text-2xl font-bold text-gray-900">{leaderboard.totalProviders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{leaderboard.averageScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                {getHealthIcon(insights.overallHealth)}
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Health</p>
                  <p className={`text-2xl font-bold ${getHealthColor(insights.overallHealth)}`}>
                    {insights.overallHealth.charAt(0).toUpperCase() + insights.overallHealth.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Improving</p>
                  <p className="text-2xl font-bold text-gray-900">{insights.trends.improvingProviders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaderboard.topPerformers.map((performer, index) => (
                <div key={performer.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <h3 className="font-medium">{performer.name}</h3>
                      <p className="text-sm text-gray-600">Score: {performer.score}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Improvement</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium text-green-600">+{performer.improvement}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.providers.slice(0, 20).map((provider, index) => (
                <div key={provider.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-gray-600">{provider.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Score</p>
                      <p className={`text-lg font-bold ${getScoreColor(provider.score)}`}>
                        {provider.score}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Bookings</p>
                      <p className="text-lg font-bold text-gray-900">{provider.totalBookings}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-lg font-bold text-gray-900">${provider.totalRevenue.toLocaleString()}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Rating</p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-lg font-bold text-gray-900">{provider.customerRating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getScoreBgColor(provider.score)} ${getScoreColor(provider.score)}`}>
                        {provider.score >= 85 ? 'Excellent' :
                         provider.score >= 70 ? 'Good' :
                         provider.score >= 50 ? 'Fair' : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Struggling Providers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Providers Needing Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaderboard.strugglingProviders.map((provider) => (
                <div key={provider.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-gray-600">Score: {provider.score}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-800">Issues:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {provider.issues.map((issue, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Zap className="h-3 w-3 mr-2" />
                    Provide Support
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Performance Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Key Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="text-sm font-medium">{insights.keyMetrics.averageScore}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Top Performer Score</span>
                    <span className="text-sm font-medium">{insights.keyMetrics.topPerformerScore}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Struggling Provider Score</span>
                    <span className="text-sm font-medium">{insights.keyMetrics.strugglingProviderScore}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Score Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(insights.keyMetrics.scoreDistribution).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{category}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Trends</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Improving Providers</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">{insights.trends.improvingProviders}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Declining Providers</span>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">{insights.trends.decliningProviders}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stable Providers</span>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">{insights.trends.stableProviders}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Recommendations</h4>
                  <div className="space-y-3">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center space-x-2">
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">{rec.type}</Badge>
                          </div>
                        </div>
                        
                        <h5 className="font-medium text-gray-900 mt-2">{rec.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <p className="text-sm text-blue-600 mt-2">{rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
