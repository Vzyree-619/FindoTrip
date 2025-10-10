import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";
import NavBar from "~/components/layout/navigation/NavBarWithAuth";
// Mobile navigation is now handled in NavBarWithAuth
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import { OfflineIndicator, OnlineIndicator } from "~/components/common/LoadingStates";
import { SkipToContent, ScreenReaderAnnouncement } from "~/hooks/useAccessibility";
import { useNetwork } from "~/hooks/useNetwork";
import { getUser } from "~/lib/auth/auth.server";
import { generateMeta, structuredDataTemplates, StructuredData } from "~/components/common/SEOHead";
import { FloatingChatButton } from "~/components/chat/FloatingChatButton";
import "~/styles/shared.css";
import "~/tailwind.css";

export const meta: MetaFunction = () => generateMeta({
  title: "FindoTrip - Your Ultimate Travel Companion",
  description: "Discover amazing accommodations, rent cars, and book experienced tour guides for your perfect trip. Plan your adventure with FindoTrip.",
  keywords: "travel, accommodation, hotels, car rental, tour guides, vacation, booking, trip planning, Pakistan travel"
});

export const links: LinksFunction = () => [
  // Preconnect to external domains
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  
  // Fonts with display=swap for better performance
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  
  // Favicon and app icons
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  
  // Web app manifest
  { rel: "manifest", href: "/manifest.json" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const { isOnline } = useNetwork();
  const [showOnlineIndicator, setShowOnlineIndicator] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowOnlineIndicator(true);
      const timer = setTimeout(() => setShowOnlineIndicator(false), 3000);
      setWasOffline(false);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);
  
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#01502E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <Meta />
        <Links />
        
        {/* Structured Data */}
        <StructuredData data={structuredDataTemplates.organization} />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/FindoTripLogo.png" as="image" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {/* Skip to content for accessibility */}
        <SkipToContent />
        
        {/* Main navigation */}
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <NavBar user={data?.user} />
        </header>
        
        {/* Mobile navigation is now handled in NavBar */}
        
        {/* Main content */}
        <main id="main-content" className="min-h-screen pb-16 lg:pb-0">
          {children}
        </main>
        
        {/* Network status indicators (debounced offline) */}
        {/* Comment out the OfflineIndicator to prevent false offline detection */}
        {/* {!isOnline && (
          <div className="animate-fade-in">
            <OfflineIndicator />
          </div>
        )} */}
        <OnlineIndicator show={showOnlineIndicator} />
        
        {/* Floating Chat Button - only show for authenticated users */}
        {data?.user && (
          <FloatingChatButton currentUserId={data.user.id} />
        )}
        
        {/* Scripts and restoration */}
        <ScrollRestoration />
        <Scripts />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

// Export error boundary for the app
export { ErrorBoundary };
