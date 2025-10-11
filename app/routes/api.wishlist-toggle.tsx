import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await requireUserId(request);
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { serviceType, serviceId, action } = body as {
      serviceType: "property" | "vehicle" | "tour";
      serviceId: string;
      action: "add" | "remove";
    };

    if (!serviceType || !serviceId || !action) {
      return json({ error: "Missing fields" }, { status: 400 });
    }

    // Find or create wishlist for user
    let wishlist = await prisma.wishlist.findFirst({ 
      where: { userId } 
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { 
          userId, 
          name: "My Favorites", 
          propertyIds: [], 
          vehicleIds: [], 
          tourIds: [] 
        }
      });
    }

    // Update the appropriate array based on service type
    const fieldMap = {
      property: 'propertyIds',
      vehicle: 'vehicleIds', 
      tour: 'tourIds'
    } as const;

    const field = fieldMap[serviceType];
    const currentIds = wishlist[field] || [];
    
    let updatedIds: string[];
    if (action === "add") {
      updatedIds = [...new Set([...currentIds, serviceId])];
    } else {
      updatedIds = currentIds.filter(id => id !== serviceId);
    }

    await prisma.wishlist.update({
      where: { id: wishlist.id },
      data: { [field]: updatedIds }
    });

    return json({ 
      success: true, 
      message: `Item ${action === 'add' ? 'added to' : 'removed from'} favorites` 
    });
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export default function ToggleWishlist() { 
  return null; 
}