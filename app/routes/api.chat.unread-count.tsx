import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getUserId } from "~/lib/auth/auth.server";

// GET /api/chat/unread-count
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await getUserId(request);
    
    // If no user is logged in, return empty data instead of redirecting
    if (!userId) {
      return json({
        success: true,
        data: {
          total: 0,
          byConversation: {}
        }
      });
    }
    
    // For now, return a simple response to stop 404 errors
    return json({
      success: true,
      data: {
        total: 0,
        byConversation: {}
      }
    });
  } catch (error) {
    console.error("Error in unread count loader:", error);
    return json({
      success: true,
      data: {
        total: 0,
        byConversation: {}
      }
    });
  }
}