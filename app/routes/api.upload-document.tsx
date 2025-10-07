import {
  json,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import { getUserId } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

// In a real implementation, you would upload to a cloud storage service
// like AWS S3, Google Cloud Storage, or Cloudinary
const uploadHandler = unstable_createMemoryUploadHandler({
  maxPartSize: 5 * 1024 * 1024, // 5MB
});

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const relatedId = formData.get("relatedId") as string;
    const relatedType = formData.get("relatedType") as string;

    if (!file || !documentType) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return json({ error: "File too large" }, { status: 400 });
    }

    // Get user role for validation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // In a real implementation, upload to cloud storage
    // For now, we'll simulate with a local URL
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    const fileUrl = `/uploads/${fileName}`; // This would be your cloud storage URL

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        type: documentType as any, // Cast to DocumentType enum
        name: file.name,
        originalName: file.name,
        url: fileUrl,
        size: file.size,
        mimeType: file.type,
        userId,
        userRole: user.role,
        relatedId,
        relatedType,
      },
    });

    // Create a service request for document verification
    await prisma.serviceRequest.create({
      data: {
        type: "PROFILE_UPDATE",
        title: `Document Upload: ${documentType}`,
        description: `New ${documentType} document uploaded for verification`,
        requesterId: userId,
        requesterRole: user.role,
        relatedId: document.id,
        requestData: {
          documentId: document.id,
          documentType,
          fileName: file.name,
          fileSize: file.size
        }
      },
    });

    return json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        url: document.url,
        type: document.type,
        verified: document.verified
      }
    });

  } catch (error) {
    console.error("Document upload error:", error);
    return json({ error: "Upload failed" }, { status: 500 });
  }
}

// Helper function to get document requirements by user role
export function getDocumentRequirements(userRole: string) {
  const requirements = {
    CUSTOMER: [
      {
        type: "NATIONAL_ID",
        label: "National ID Card",
        required: false,
        description: "For identity verification (optional)"
      }
    ],
    PROPERTY_OWNER: [
      {
        type: "NATIONAL_ID",
        label: "National ID Card",
        required: true,
        description: "Government-issued identity document"
      },
      {
        type: "BUSINESS_LICENSE",
        label: "Business License",
        required: true,
        description: "Valid business registration certificate"
      },
      {
        type: "TAX_CERTIFICATE",
        label: "Tax Certificate",
        required: false,
        description: "Tax registration document (if applicable)"
      }
    ],
    VEHICLE_OWNER: [
      {
        type: "NATIONAL_ID",
        label: "National ID Card",
        required: true,
        description: "Government-issued identity document"
      },
      {
        type: "DRIVING_LICENSE",
        label: "Driving License",
        required: true,
        description: "Valid driving license"
      },
      {
        type: "VEHICLE_REGISTRATION",
        label: "Vehicle Registration",
        required: true,
        description: "Vehicle registration documents"
      },
      {
        type: "INSURANCE_DOCUMENT",
        label: "Insurance Certificate",
        required: true,
        description: "Valid vehicle insurance certificate"
      },
      {
        type: "BUSINESS_LICENSE",
        label: "Business License",
        required: false,
        description: "Business registration (if applicable)"
      }
    ],
    TOUR_GUIDE: [
      {
        type: "NATIONAL_ID",
        label: "National ID Card",
        required: true,
        description: "Government-issued identity document"
      },
      {
        type: "TOUR_GUIDE_LICENSE",
        label: "Tour Guide License",
        required: false,
        description: "Tourism authority license (if available)"
      },
      {
        type: "BUSINESS_LICENSE",
        label: "Certifications",
        required: false,
        description: "Professional certifications or training certificates"
      }
    ]
  };

  return requirements[userRole as keyof typeof requirements] || [];
}
