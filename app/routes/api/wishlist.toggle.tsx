import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// Unified wishlist toggle for property | vehicle | tour
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, { status: 400 });

  const { serviceType, serviceId, action } = body as {
    serviceType: "property" | "vehicle" | "tour";
    serviceId: string;
    action: "add" | "remove";
  };

  if (!serviceType || !serviceId || !action) {
    return json({ error: "Missing fields" }, { status: 400 });
  }

  const list = await prisma.wishlist.findFirst({ where: { userId } });
  if (!list) {
    // Create default list
    await prisma.wishlist.create({
      data: { userId, name: "My Favorites", propertyIds: [], vehicleIds: [], tourIds: [] }
    });
  }

  const current = await prisma.wishlist.findFirst({ where: { userId } });
  if (!current) return json({ error: "Failed to access wishlist" }, { status: 500 });

  const fields: Record<string, string[]> = {
    propertyIds: current.propertyIds,
    vehicleIds: current.vehicleIds,
    tourIds: current.tourIds,
  };

  const key = serviceType === "property" ? "propertyIds" : serviceType === "vehicle" ? "vehicleIds" : "tourIds";
  const set = new Set(fields[key]);
  if (action === "add") set.add(serviceId); else set.delete(serviceId);

  await prisma.wishlist.update({
    where: { id: current.id },
    data: { [key]: Array.from(set) },
  });

  return json({ success: true });
}

export default function ToggleWishlist() { return null; }

