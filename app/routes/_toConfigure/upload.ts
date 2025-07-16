import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_dbtmbl2lv,
  api_key: process.env.CLOUDINARY_146188299796337,
  api_secret: process.env.CLOUDINARY_aEErbwaRVlbjPVj4Hqxt3kkpRW8,
});

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const files = formData.getAll("images") as File[]; // Use "images" for multiple files

  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ error: "No files uploaded" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        return new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "uploads" },
            (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve(result!.secure_url); // Resolve with the Cloudinary URL
            }
          );

          stream.pipe(uploadStream);
        });
      })
    );

    return new Response(JSON.stringify({ imageUrls: uploadedUrls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upload images to Cloudinary" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};