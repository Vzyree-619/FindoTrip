import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import UniversalReviewForm from "~/components/reviews/UniversalReviewForm";
import { createReview, type ServiceKind } from "~/lib/reviews.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");
  const type = url.searchParams.get("type") as ServiceKind | null; // property | vehicle | tour

  if (!bookingId || !type) {
    throw new Response("Missing bookingId or type", { status: 400 });
  }

  let serviceId = "";
  let service: any = null;
  let bookingType: ServiceKind = type;

  if (type === "property") {
    const booking = await prisma.propertyBooking.findFirst({
      where: { id: bookingId, userId },
      include: { property: true },
    });
    if (!booking) throw new Response("Booking not found", { status: 404 });
    serviceId = booking.propertyId;
    service = booking.property;
  } else if (type === "vehicle") {
    const booking = await prisma.vehicleBooking.findFirst({
      where: { id: bookingId, userId },
      include: { vehicle: true },
    });
    if (!booking) throw new Response("Booking not found", { status: 404 });
    serviceId = booking.vehicleId;
    service = booking.vehicle;
  } else if (type === "tour") {
    const booking = await prisma.tourBooking.findFirst({
      where: { id: bookingId, userId },
      include: { tour: true },
    });
    if (!booking) throw new Response("Booking not found", { status: 404 });
    serviceId = booking.tourId;
    service = booking.tour;
  }

  return json({
    userId,
    serviceType: type,
    serviceId,
    bookingId,
    bookingType,
    service: service ? {
      name: service.name || service.title,
      city: service.city,
      country: service.country,
      images: service.images || [],
      rating: service.rating ?? 0,
      reviewCount: service.reviewCount ?? 0,
    } : null,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent !== "submit-review") return json({ error: "Invalid action" }, { status: 400 });

  const serviceType = formData.get("serviceType") as ServiceKind;
  const serviceId = formData.get("serviceId") as string;
  const bookingId = formData.get("bookingId") as string;
  const bookingType = formData.get("bookingType") as ServiceKind;
  const rating = parseInt(String(formData.get("rating")) || "0", 10);
  const title = (formData.get("title") as string) || undefined;
  const comment = (formData.get("comment") as string) || "";
  const imagesRaw = (formData.get("images") as string) || "[]";
  let images: string[] = [];
  try { images = JSON.parse(imagesRaw) || []; } catch {}

  try {
    await createReview({
      userId,
      bookingId,
      bookingType,
      serviceId,
      serviceType,
      rating,
      title,
      comment,
      images,
    });
    return redirect("/dashboard/reviews?success=review-submitted");
  } catch (e: any) {
    return json({ error: e?.message || "Failed to submit review" }, { status: 400 });
  }
}

export default function NewReview() {
  const { serviceType, serviceId, bookingId, bookingType, service } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Write a Review</h1>
          {service && (
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-16 rounded overflow-hidden bg-gray-100">
                <img src={service.images?.[0] || "/placeholder.jpg"} alt={service.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-semibold">{service.name}</div>
                <div className="text-sm text-gray-600">{service.city}, {service.country}</div>
              </div>
            </div>
          )}
          <UniversalReviewForm
            serviceType={serviceType}
            serviceId={serviceId}
            bookingId={bookingId}
            bookingType={bookingType}
          />
        </div>
      </div>
    </div>
  );
}
