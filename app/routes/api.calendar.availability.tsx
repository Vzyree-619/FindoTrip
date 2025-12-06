import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const roomTypeId = formData.get("roomTypeId") as string;
  const dates = JSON.parse(formData.get("dates") as string) as string[];
  const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
  const isBlocked = formData.get("isBlocked") === "true";
  const reason = formData.get("blockReason") as string | null; // Keep blockReason in form for UI, map to reason in DB
  const notes = formData.get("notes") as string | null;
  const minStay = formData.get("minStay") ? parseInt(formData.get("minStay") as string) : null;
  const maxStay = formData.get("maxStay") ? parseInt(formData.get("maxStay") as string) : null;

  if (!roomTypeId || !dates || dates.length === 0) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify ownership
  const roomType = await prisma.roomType.findFirst({
    where: {
      id: roomTypeId,
      property: {
        owner: { userId }
      }
    }
  });

  if (!roomType) {
    return json({ error: "Room type not found or unauthorized" }, { status: 403 });
  }

  try {
    // Process each date
    const results = await Promise.all(
      dates.map(async (dateStr) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        // Check if availability record exists
        const existing = await prisma.roomAvailability.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId,
              date,
            }
          }
        });

        if (intent === "update") {
          if (existing) {
            return await prisma.roomAvailability.update({
              where: { id: existing.id },
              data: {
                isAvailable: !isBlocked,
                reason: isBlocked ? reason : null,
                customPrice: price,
                notes: notes || null,
                minStay: minStay,
                maxStay: maxStay,
              }
            });
          } else {
            return await prisma.roomAvailability.create({
              data: {
                roomTypeId,
                date,
                isAvailable: !isBlocked,
                reason: isBlocked ? reason : null,
                customPrice: price,
                notes: notes || null,
                minStay: minStay,
                maxStay: maxStay,
                availableUnits: roomType.totalUnits || 1, // Set available units to total units by default
                createdBy: userId,
              }
            });
          }
        } else if (intent === "delete") {
          if (existing) {
            return await prisma.roomAvailability.delete({
              where: { id: existing.id }
            });
          }
          return null;
        }

        return existing;
      })
    );

    return json({ success: true, results: results.filter(Boolean) });
  } catch (error: any) {
    console.error("Error updating availability:", error);
    return json({ error: error.message || "Failed to update availability" }, { status: 500 });
  }
}

