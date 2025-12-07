import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { replyToReview, flagReview } from "~/lib/reviews.server";
import { Star, Calendar, MapPin, Reply, Flag } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  // Determine provider profile
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new Response("Unauthorized", { status: 401 });

  let reviews: any[] = [];

  if (user.role === "PROPERTY_OWNER") {
    const properties = await prisma.property.findMany({ 
      where: { owner: { userId } }, 
      select: { id: true, name: true, city: true, country: true } 
    });
    const ids = properties.map(p => p.id);
    if (ids.length > 0) {
    reviews = await prisma.review.findMany({
      where: { serviceType: "property", serviceId: { in: ids } },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    }
  } else if (user.role === "VEHICLE_OWNER") {
    const vehicles = await prisma.vehicle.findMany({ 
      where: { owner: { userId } }, 
      select: { id: true, name: true, city: true, country: true } 
    });
    const ids = vehicles.map(v => v.id);
    if (ids.length > 0) {
    reviews = await prisma.review.findMany({
      where: { serviceType: "vehicle", serviceId: { in: ids } },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    }
  } else if (user.role === "TOUR_GUIDE") {
    const tours = await prisma.tour.findMany({ 
      where: { guide: { userId } }, 
      select: { id: true, title: true, city: true, country: true } 
    });
    const ids = tours.map(t => t.id);
    if (ids.length > 0) {
    reviews = await prisma.review.findMany({
      where: { serviceType: "tour", serviceId: { in: ids } },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    }
  } else {
    // Not a provider role
    reviews = [];
  }

  return json({ role: user.role, reviews });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "reply") {
    const reviewId = formData.get("reviewId") as string;
    const response = (formData.get("ownerResponse") as string) || "";
    await replyToReview(reviewId, userId, response);
    return json({ success: true });
  }

  if (intent === "flag") {
    const reviewId = formData.get("reviewId") as string;
    const reason = (formData.get("reason") as string) || "Provider flagged as inappropriate";
    await flagReview(reviewId, reason);
    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ProviderReviews() {
  const { role, reviews } = useLoaderData<typeof loader>();
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Reviews Received</h1>
        {reviews.length === 0 ? (
          <div className="bg-white p-8 rounded shadow">No reviews yet.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white p-6 rounded shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">by {r.user?.name || 'Anonymous'}</div>
                    <p className="text-gray-800 mb-3">{r.comment}</p>
                    {r.images?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {r.images.map((url: string, idx: number) => (
                          <img key={idx} src={url} alt="review" className="w-full h-24 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className={`text-xs inline-block px-2 py-1 rounded ${r.verified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                      {r.verified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Form method="post" className="flex items-center gap-2">
                    <input type="hidden" name="intent" value="reply" />
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input name="ownerResponse" placeholder="Write a public reply" className="border rounded px-3 py-2 w-80" defaultValue={r.ownerResponse || ''} />
                    <button type="submit" className="px-3 py-2 bg-[#01502E] text-white rounded flex items-center gap-2">
                      <Reply className="w-4 h-4" /> Reply
                    </button>
                  </Form>
                  <Form method="post" className="flex items-center gap-2">
                    <input type="hidden" name="intent" value="flag" />
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input name="reason" placeholder="Reason" className="border rounded px-3 py-2" />
                    <button type="submit" className="px-3 py-2 border rounded flex items-center gap-2">
                      <Flag className="w-4 h-4" /> Flag
                    </button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
