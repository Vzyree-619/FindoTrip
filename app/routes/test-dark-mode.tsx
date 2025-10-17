import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import ShareModal from "~/components/common/ShareModal";
import FloatingShareButton from "~/components/common/FloatingShareButton";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, avatar: true }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return json({ 
    currentUserId: userId,
    user
  });
}

export default function TestDarkMode() {
  const { currentUserId, user } = useLoaderData<typeof loader>();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Share Modal Test</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Share Modal Test</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Test the share modal with improved dark mode contrast and readability.
          </p>
          <button
            onClick={() => setShareModalOpen(true)}
            className="bg-[#01502E] dark:bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-[#013d23] dark:hover:bg-green-700 transition-colors"
          >
            Open Share Modal
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Color Contrast Test</h2>
          <div className="space-y-4">
            <div className="p-4 bg-[#01502E]/10 dark:bg-green-400/20 rounded-lg">
              <p className="text-[#01502E] dark:text-green-400 font-medium">Primary Green Text</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">This should be clearly readable in both light and dark modes</p>
            </div>
            
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-green-700 dark:text-green-300 font-medium">Success State</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Copied! state with good contrast</p>
            </div>
            
            <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 font-medium">Border Test</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Border should be visible but not harsh</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Instructions</h2>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Click "Open Share Modal" to test the share functionality</li>
            <li>Try all three tabs: Link, Social, QR Code</li>
            <li>Test the floating share button in the bottom-right corner</li>
            <li>Switch between light and dark modes to verify contrast</li>
            <li>Check that all text is clearly readable</li>
          </ol>
        </div>

        {/* Share Modal */}
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title="Test Listing"
          url={typeof window !== 'undefined' ? window.location.href : ''}
          description="This is a test listing to verify dark mode contrast and readability improvements."
          image="/placeholder-image.jpg"
        />

        {/* Floating Share Button */}
        <FloatingShareButton
          title="Test Listing"
          url={typeof window !== 'undefined' ? window.location.href : ''}
          description="This is a test listing to verify dark mode contrast and readability improvements."
          image="/placeholder-image.jpg"
          position="bottom-right"
          variant="floating"
        />
      </div>
    </div>
  );
}
