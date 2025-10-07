import { Loader2, Wifi, WifiOff } from "lucide-react";

// Generic Loading Spinner
export function LoadingSpinner({ 
  size = "md", 
  className = "" 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  );
}

// Full Page Loading
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-[#01502E] mb-4 mx-auto" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-300"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </>
  );
}

// Accommodation Grid Skeleton
export function AccommodationGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <CardSkeleton count={8} />
    </div>
  );
}

// List Item Skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow animate-pulse">
          <div className="h-16 w-16 bg-gray-300 rounded-lg flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );
}

// Button Loading State
export function LoadingButton({ 
  children, 
  isLoading = false, 
  disabled = false,
  className = "",
  ...props 
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center ${className} ${
        (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}

// Search Loading State
export function SearchLoading() {
  return (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" className="text-[#01502E] mb-4 mx-auto" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Searching...</h3>
      <p className="text-gray-600">Finding the best options for you</p>
    </div>
  );
}

// Offline Indicator
export function OfflineIndicator() {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center">
      <WifiOff className="h-5 w-5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">You're offline</p>
        <p className="text-sm opacity-90">Some features may not be available</p>
      </div>
    </div>
  );
}

// Online Indicator (shows briefly when coming back online)
export function OnlineIndicator({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center animate-slide-up">
      <Wifi className="h-5 w-5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">Back online</p>
        <p className="text-sm opacity-90">All features are now available</p>
      </div>
    </div>
  );
}

// Image Loading Placeholder
export function ImagePlaceholder({ 
  className = "",
  aspectRatio = "aspect-video"
}: { 
  className?: string;
  aspectRatio?: string;
}) {
  return (
    <div className={`${aspectRatio} bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
      <div className="text-gray-400">
        <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

// Progress Bar
export function ProgressBar({ 
  progress, 
  className = "",
  showPercentage = false 
}: { 
  progress: number; 
  className?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-[#01502E] h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Typing Indicator (for chat/messaging)
export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm text-gray-500 ml-2">Typing...</span>
    </div>
  );
}
