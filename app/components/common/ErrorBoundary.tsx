import { isRouteErrorResponse, useRouteError, Link } from "@remix-run/react";
import { AlertTriangle, Home, RefreshCw, Mail } from "lucide-react";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {error.status} - {error.statusText}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              {error.status === 404 
                ? "The page you're looking for doesn't exist."
                : "Something went wrong on our end."
              }
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-4"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Try Again
            </button>
            
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </div>

          {error.status >= 500 && (
            <div className="mt-8 p-4 bg-white rounded-lg border border-red-200">
              <p className="text-sm text-gray-600 mb-2">
                If this problem persists, please contact support:
              </p>
              <a 
                href="mailto:support@findotrip.com" 
                className="inline-flex items-center text-sm text-red-600 hover:underline"
              >
                <Mail className="h-4 w-4 mr-1" />
                support@findotrip.com
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle unexpected errors
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-4"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reload Page
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg border border-red-200">
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Technical Details (for developers)
            </summary>
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </details>
          
          <p className="text-sm text-gray-600 mt-4">
            Error ID: {Date.now().toString(36).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
