import { json, type ActionFunctionArgs, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";

const uploadHandler = unstable_createMemoryUploadHandler({
  maxPartSize: 5 * 1024 * 1024, // 5MB
});

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);

  try {
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const file = formData.get("file") as File | null;

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      return json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return json({ error: "File too large" }, { status: 400 });
    }

    // Simulate upload. In production, upload to S3/Cloudinary and return the secure URL
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const url = `/uploads/reviews/${Date.now()}-${safeName}`;

    return json({ success: true, url });
  } catch (e) {
    console.error("Review photo upload failed", e);
    return json({ error: "Upload failed" }, { status: 500 });
  }
}
