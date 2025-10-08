import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { searchConversations, type SearchResult } from "~/lib/chat.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface SearchResponse {
  success: boolean;
  data?: {
    results: SearchResult[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

// ========================================
// GET /api/chat/search
// ========================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const url = new URL(request.url);
    
    // Parse query parameters
    const query = url.searchParams.get("q");
    const conversationId = url.searchParams.get("conversationId");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    
    if (!query || query.trim().length === 0) {
      return json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      userId,
      
      'chat-search-${userId}',
      '50', // 50 searches per minute
      '60' * 1000
    });
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Perform search
    const results = await searchConversations(userId, query.trim(), limit);

    const response: SearchResponse = {
      success: true,
      data: {
        results,
        total: results.length,
        hasMore: results.length === limit
      }
    };

    return json(response);
  } catch (error) {
    console.error("Error in search loader:", error);
    return json(
      { success: false, error: "Failed to search messages" },
      { status: 500 }
    );
  }
}
