import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { checkRateLimit } from "~/lib/middleware/rate-limit.server";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    type: string;
    size: number;
  };
  error?: string;
}

// ========================================
// POST /api/chat/upload
// ========================================

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);

    if (request.method !== "POST") {
      return json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Rate limiting for file uploads
    const rateLimitResult = await checkRateLimit(
      userId,
      
      'chat-upload-${userId}',
      '20', // 20 uploads per minute
      '60' * 1000
    });
    
    if (!rateLimitResult.allowed) {
      return json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json(
        { success: false, error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return json(
        { success: false, error: "File type not allowed" },
        { status: 400 }
      );
    }

    // TODO: Implement actual file upload
    // This would typically involve:
    // 1. Uploading to cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Generating unique filename
    // 3. Storing file metadata in database
    // 4. Returning public URL
    
    // For now, return a mock response
    const mockUrl = `https://example.com/uploads/${Date.now()}-${file.name}`;
    
    const response: UploadResponse = {
      success: true,
      data: {
        url: mockUrl,
        filename: file.name,
        type: file.type,
        size: file.size
      }
    };

    return json(response, { status: 201 });
  } catch (error) {
    console.error("Error in upload action:", error);
    return json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
