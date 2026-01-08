import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";

// Layout & Components
import NavBar from "~/components/layout/navigation/NavBarWithAuth";
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import {
  OfflineIndicator,
  OnlineIndicator,
} from "~/components/common/LoadingStates";
import {
  SkipToContent,
} from "~/hooks/useAccessibility";
import { useNetwork } from "~/hooks/useNetwork";
import { getUser } from "~/lib/auth/auth.server";
import {
  generateMeta,
  structuredDataTemplates,
  StructuredData,
} from "~/components/common/SEOHead";
import { FloatingChatButton } from "~/components/chat/FloatingChatButton";

// CSS Imports - These variables hold the URL strings for your CSS files
import sharedStyles from "~/styles/shared.css";
import tailwindStyles from "~/tailwind.css";

export const meta: MetaFunction = () =>
  generateMeta({
    title: "FindoTrip - Your Ultimate Travel Companion",
    description:
      "Discover amazing accommodations, rent cars, and book experienced tour guides for your perfect trip.",
    keywords:
      "travel, accommodation, hotels, car rental, tour guides, vacation, booking, trip planning",
  });

export const links: LinksFunction = () => [
  // 1. Local CSS Files (The Missing Piece)
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "stylesheet", href: sharedStyles },

  // 2. External Fonts
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },

  // 3. Assets & Manifest
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
  { rel: "manifest", href: "/manifest.json" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUser(request);
    return json({ user });
  } catch (error) {
    console.error("Root loader error:", error);
    return json({ user: null });
  }
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#01502E" />
        <Meta />
        <Links />
        <StructuredData data={structuredDataTemplates.organization} />
        <link rel="preload" href="/FindoTripLogo.png" as="image" />
      </head>
      <body className="bg-white text-gray-900 antialiased overflow-x-hidden">
        <SkipToContent />

        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <NavBar user={user} />
        </header>

        <main id="main-content" className="pb-0">
          <Outlet />
        </main>

        <OnlineIndicator show={showOnlineIndicator} />

        {user && <FloatingChatButton currentUserId={user.id} />}

        <ScrollRestoration />
        <Scripts />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered'); })
                    .catch(function(err) { console.log('SW failed', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

export { ErrorBoundary };
