import { Form, useNavigation } from "@remix-run/react";
import { useState } from "react";

export type ServiceKind = "property" | "vehicle" | "tour";

interface UniversalReviewFormProps {
  serviceType: ServiceKind;
  serviceId: string;
  bookingId: string;
  bookingType: ServiceKind;
  submitAction?: string; // optional action path
  maxImages?: number;
}

export default function UniversalReviewForm({ serviceType, serviceId, bookingId, bookingType, submitAction, maxImages = 6 }: UniversalReviewFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [rating, setRating] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const uploadCount = Math.min(files.length, maxImages - images.length);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < uploadCount; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload-review-photo", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (data?.url) uploaded.push(data.url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Photo upload error", err);
    } finally {
      setUploading(false);
      // reset input so the same file can be uploaded again if needed
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <Form method="post" action={submitAction} className="space-y-4">
        <input type="hidden" name="intent" value="submit-review" />
        <input type="hidden" name="serviceType" value={serviceType} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="bookingType" value={bookingType} />
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <input type="hidden" name="rating" value={rating} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overall Rating</label>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={`w-8 h-8 rounded-full ${star <= rating ? 'bg-yellow-400' : 'bg-gray-200'} flex items-center justify-center`}
                aria-label={`Set rating ${star}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
          <input name="title" type="text" className="w-full p-2 border rounded" placeholder="Great stay!" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
          <textarea name="comment" className="w-full p-3 border rounded" rows={4} required placeholder="Share your experience..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional)</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} disabled={uploading || images.length >= maxImages} />
          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={i} className="w-full h-24 bg-gray-100 rounded overflow-hidden">
                  <img src={url} alt={`review-${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button type="submit" disabled={isSubmitting || rating === 0} className="px-4 py-2 bg-[#01502E] text-white rounded hover:bg-[#013d23] disabled:opacity-50">
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </Form>
    </div>
  );
}
