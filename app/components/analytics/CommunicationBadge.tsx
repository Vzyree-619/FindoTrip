import { Badge } from "~/components/ui/badge";
import { Trophy, Award, Medal, Target, TrendingUp, Star } from "lucide-react";

interface CommunicationBadgeProps {
  score: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary";
}

export function CommunicationBadge({ 
  score, 
  showScore = true, 
  size = "md",
  variant = "default" 
}: CommunicationBadgeProps) {
  const getBadgeInfo = (score: number) => {
    if (score >= 90) {
      return {
        text: "Excellent Communication",
        icon: <Trophy className="h-3 w-3" />,
        className: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
        description: "Outstanding communication skills"
      };
    } else if (score >= 80) {
      return {
        text: "Great Communication",
        icon: <Award className="h-3 w-3" />,
        className: "bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-400",
        description: "Very good communication skills"
      };
    } else if (score >= 70) {
      return {
        text: "Good Communication",
        icon: <Medal className="h-3 w-3" />,
        className: "bg-gradient-to-r from-amber-600 to-amber-800 text-white border-amber-700",
        description: "Good communication skills"
      };
    } else {
      return null; // No badge for scores below 70
    }
  };

  const badgeInfo = getBadgeInfo(score);

  if (!badgeInfo) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Target className="h-4 w-4 text-gray-400" />
        <span>Improve communication to earn a badge</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        className={`${badgeInfo.className} ${sizeClasses[size]} font-medium shadow-sm`}
        variant={variant}
      >
        <div className="flex items-center space-x-1">
          {badgeInfo.icon}
          <span>{badgeInfo.text}</span>
          {showScore && (
            <span className="ml-1 font-bold">{score}</span>
          )}
        </div>
      </Badge>
      <span className="text-xs text-gray-500 hidden sm:inline">
        {badgeInfo.description}
      </span>
    </div>
  );
}

interface CommunicationScoreProps {
  score: number;
  previousScore?: number;
  showTrend?: boolean;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CommunicationScore({ 
  score, 
  previousScore, 
  showTrend = true,
  showBadge = true,
  size = "md"
}: CommunicationScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-yellow-600";
    if (score >= 80) return "text-gray-600";
    if (score >= 70) return "text-amber-600";
    return "text-gray-500";
  };

  const getTrendIcon = () => {
    if (!previousScore) return null;
    const change = score - previousScore;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
    return null;
  };

  const getTrendText = () => {
    if (!previousScore) return null;
    const change = score - previousScore;
    if (change > 0) return `+${change} from last period`;
    if (change < 0) return `${change} from last period`;
    return "No change from last period";
  };

  return (
    <div className="flex items-center space-x-3">
      {showBadge && (
        <CommunicationBadge score={score} size={size} />
      )}
      
      <div className="flex items-center space-x-2">
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className="text-sm text-gray-500">
          /100
        </div>
      </div>

      {showTrend && previousScore && (
        <div className="flex items-center space-x-1 text-xs">
          {getTrendIcon()}
          <span className="text-gray-600">{getTrendText()}</span>
        </div>
      )}
    </div>
  );
}

interface ProviderCommunicationCardProps {
  providerId: string;
  providerName: string;
  score: number;
  previousScore?: number;
  rank?: number;
  totalProviders?: number;
  showRank?: boolean;
  showBadge?: boolean;
}

export function ProviderCommunicationCard({
  providerId,
  providerName,
  score,
  previousScore,
  rank,
  totalProviders,
  showRank = true,
  showBadge = true
}: ProviderCommunicationCardProps) {
  const getRankIcon = (rank?: number) => {
    if (!rank) return null;
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-600" />;
    if (rank <= 3) return <Award className="h-4 w-4 text-orange-600" />;
    if (rank <= 10) return <Medal className="h-4 w-4 text-[#01502E]" />;
    return <Star className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#01502E]/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-[#01502E]">
              {providerName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{providerName}</h3>
            {showRank && rank && totalProviders && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                {getRankIcon(rank)}
                <span>#{rank} of {totalProviders}</span>
              </div>
            )}
          </div>
        </div>
        
        <CommunicationScore 
          score={score} 
          previousScore={previousScore}
          size="sm"
        />
      </div>
      
      {showBadge && (
        <div className="mt-2">
          <CommunicationBadge score={score} size="sm" />
        </div>
      )}
    </div>
  );
}
