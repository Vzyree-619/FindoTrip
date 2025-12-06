import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { startOfDay } from "date-fns";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const roomTypeId = formData.get("roomTypeId") as string;
  const dates = JSON.parse((formData.get("dates") as string) || "[]") as string[];
  const actionType = formData.get("action") as string;

  if (!roomTypeId || !dates || dates.length === 0 || !actionType) {
    return json(
      { error: "Missing required fields: roomTypeId, dates, action" },
      { status: 400 }
    );
  }

  // Verify user owns this room
  const room = await prisma.roomType.findFirst({
    where: {
      id: roomTypeId,
      property: {
        owner: { userId },
      },
    },
    select: {
      id: true,
      totalUnits: true,
    },
  });

  if (!room) {
    return json({ error: "Unauthorized or room not found" }, { status: 403 });
  }

  const results = [];

  for (const dateStr of dates) {
    const date = startOfDay(new Date(dateStr));

    if (isNaN(date.getTime())) {
      results.push({ date: dateStr, error: "Invalid date" });
      continue;
    }

    try {
      switch (actionType) {
        case "setPrice": {
          const customPrice = parseFloat(formData.get("price") as string);
          if (isNaN(customPrice) || customPrice < 0) {
            results.push({ date: dateStr, error: "Invalid price" });
            break;
          }

          await prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: { roomTypeId, date },
            },
            create: {
              roomTypeId,
              date,
              customPrice,
              availableUnits: room.totalUnits,
              isAvailable: true,
              createdBy: userId,
            },
            update: {
              customPrice,
            },
          });

          results.push({
            date: dateStr,
            action: "priceSet",
            price: customPrice,
          });
          break;
        }

        case "block": {
          const reason = (formData.get("reason") as string) || "Blocked by owner";
          const notes = (formData.get("notes") as string) || null;

          await prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: { roomTypeId, date },
            },
            create: {
              roomTypeId,
              date,
              isAvailable: false,
              availableUnits: 0,
              reason,
              notes,
              createdBy: userId,
            },
            update: {
              isAvailable: false,
              availableUnits: 0,
              reason,
              notes,
            },
          });

          results.push({
            date: dateStr,
            action: "blocked",
            reason,
          });
          break;
        }

        case "unblock": {
          await prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: { roomTypeId, date },
            },
            create: {
              roomTypeId,
              date,
              isAvailable: true,
              availableUnits: room.totalUnits,
              createdBy: userId,
            },
            update: {
              isAvailable: true,
              availableUnits: room.totalUnits,
              reason: null,
              notes: null,
            },
          });

          results.push({ date: dateStr, action: "unblocked" });
          break;
        }

        case "setMinStay": {
          const minStay = parseInt(formData.get("minStay") as string);
          if (isNaN(minStay) || minStay < 1) {
            results.push({ date: dateStr, error: "Invalid minStay" });
            break;
          }

          await prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: { roomTypeId, date },
            },
            create: {
              roomTypeId,
              date,
              minStay,
              availableUnits: room.totalUnits,
              isAvailable: true,
              createdBy: userId,
            },
            update: {
              minStay,
            },
          });

          results.push({
            date: dateStr,
            action: "minStaySet",
            minStay,
          });
          break;
        }

        case "setMaxStay": {
          const maxStay = parseInt(formData.get("maxStay") as string);
          if (isNaN(maxStay) || maxStay < 1) {
            results.push({ date: dateStr, error: "Invalid maxStay" });
            break;
          }

          await prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: { roomTypeId, date },
            },
            create: {
              roomTypeId,
              date,
              maxStay,
              availableUnits: room.totalUnits,
              isAvailable: true,
              createdBy: userId,
            },
            update: {
              maxStay,
            },
          });

          results.push({
            date: dateStr,
            action: "maxStaySet",
            maxStay,
          });
          break;
        }

        default:
          results.push({
            date: dateStr,
            error: `Unknown action: ${actionType}`,
          });
      }
    } catch (error: any) {
      console.error(`Error processing date ${dateStr}:`, error);
      results.push({
        date: dateStr,
        error: error.message || "Failed to process",
      });
    }
  }

  return json({ success: true, results });
}

