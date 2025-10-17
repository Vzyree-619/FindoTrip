import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUserId, getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { v2 as cloudinary } from "cloudinary";
import { Camera } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  if (!user) throw json({ error: 'Unauthorized' }, { status: 401 });
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const intent = form.get('intent');
  if (intent === 'update-avatar') {
    const file = form.get('avatar') as File | null;
    if (!file) return json({ error: 'No file provided' }, { status: 400 });
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return json({ error: 'Invalid file type' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return json({ error: 'File too large (max 5MB)' }, { status: 400 });
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    let url: string | null = null;
    try {
      if (cloudName && apiKey && apiSecret) {
        try {
          cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
          const arrayBuffer = await file.arrayBuffer();
          const uploadResult: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'findo' }, (err, result) => {
              if (err) reject(err); else resolve(result);
            });
            stream.end(Buffer.from(arrayBuffer));
          });
          url = uploadResult.secure_url as string;
        } catch (cloudErr) {
          const uploadsDir = "public/uploads/profiles";
          const fs = await import('fs');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const ext = file.name.split('.').pop() || 'jpg';
          const filename = `${userId}-${Date.now()}.${ext}`;
          const arrayBuffer = await file.arrayBuffer();
          fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
          url = `/uploads/profiles/${filename}`;
        }
      } else {
        const uploadsDir = "public/uploads/profiles";
        const fs = await import('fs');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${userId}-${Date.now()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(`${uploadsDir}/${filename}`, Buffer.from(arrayBuffer));
        url = `/uploads/profiles/${filename}`;
      }
      await prisma.user.update({ where: { id: userId }, data: { avatar: url! } });
      const target = url?.startsWith('http') ? 'cloudinary' : 'local';
      return json({ success: 'Profile picture updated!', target, url });
    } catch (e) {
      return json({ error: 'Failed to upload image' }, { status: 500 });
    }
  }
  return json({ error: 'Invalid action' }, { status: 400 });
}

export default function TourGuideProfile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 border">
        <h1 className="text-xl font-semibold">Tour Guide Profile</h1>
        <div className="mt-4 flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#01502E] text-white flex items-center justify-center text-lg font-bold">
              {user.name[0].toUpperCase()}
            </div>
          )}
          <Form method="post" encType="multipart/form-data" className="flex items-center gap-2">
            <input type="hidden" name="intent" value="update-avatar" />
            <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="text-xs" />
            <button type="submit" className="inline-flex items-center px-3 py-1.5 border rounded text-sm">
              <Camera className="w-4 h-4 mr-1" /> Change Photo
            </button>
          </Form>
        </div>
        {actionData?.error && (
          <p className="mt-3 text-sm text-red-600">{actionData.error}</p>
        )}
        {actionData?.success && (
          <p className="mt-3 text-sm text-green-600">
            {actionData.success} {actionData?.target ? `(Uploaded to: ${actionData.target})` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
