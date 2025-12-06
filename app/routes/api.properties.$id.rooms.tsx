import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { getUserId } from "~/lib/auth/auth.server";

// ========================================
// GET /api/properties/:id/rooms
// Get all rooms for a property
// ========================================

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ success: false, error: "Property ID required" }, { status: 400 });
    }

    const rooms = await prisma.roomType.findMany({
      where: {
        propertyId: id,
        available: true
      },
      orderBy: {
        basePrice: 'asc'
      }
    });

    return json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/properties/:id/rooms
// Create a new room type for a property
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { id: propertyId } = params;
    if (!propertyId) {
      return json({ success: false, error: "Property ID required" }, { status: 400 });
    }

    // Verify user owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        owner: {
          userId: userId
        }
      }
    });

    if (!property) {
      return json({ success: false, error: "Property not found or unauthorized" }, { status: 404 });
    }

    if (request.method === "POST") {
      const body = await request.json();
      
      // Validate required fields
      if (!body.name || !body.description || !body.basePrice || !body.maxOccupancy || !body.totalUnits) {
        return json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Create room type
      const room = await prisma.roomType.create({
        data: {
          propertyId,
          name: body.name,
          description: body.description,
          maxOccupancy: parseInt(body.maxOccupancy),
          adults: parseInt(body.adults || body.maxOccupancy),
          children: parseInt(body.children || 0),
          bedType: body.bedType,
          numberOfBeds: parseInt(body.numberOfBeds || 1),
          bedConfiguration: body.bedConfiguration || `${body.numberOfBeds || 1} ${body.bedType} Bed`,
          roomSize: body.roomSize ? parseFloat(body.roomSize) : null,
          roomSizeUnit: body.roomSizeUnit || "sqm",
          floor: body.floor,
          view: body.view,
          images: body.images || [],
          mainImage: body.mainImage || (body.images && body.images[0]),
          amenities: body.amenities || [],
          features: body.features || [],
          basePrice: parseFloat(body.basePrice),
          currency: body.currency || "PKR",
          weekendPrice: body.weekendPrice ? parseFloat(body.weekendPrice) : null,
          totalUnits: parseInt(body.totalUnits),
          available: body.available !== undefined ? body.available : true,
          discountPercent: body.discountPercent ? parseFloat(body.discountPercent) : null,
          specialOffer: body.specialOffer,
          smokingAllowed: body.smokingAllowed || false,
          petsAllowed: body.petsAllowed || false
        }
      });

      // Update property's totalRooms count
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          totalRooms: {
            increment: room.totalUnits
          }
        }
      });

      return json({
        success: true,
        data: room
      }, { status: 201 });
    }

    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error creating room:", error);
    return json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  }
}

