import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { getUserId } from "~/lib/auth/auth.server";

// ========================================
// GET /api/properties/:propertyId/rooms/:roomId
// Get a specific room type
// ========================================

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { propertyId, roomId } = params;
    
    if (!propertyId || !roomId) {
      return json({ success: false, error: "Property ID and Room ID required" }, { status: 400 });
    }

    const room = await prisma.roomType.findUnique({
      where: {
        id: roomId
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true
          }
        }
      }
    });

    if (!room || room.propertyId !== propertyId) {
      return json({ success: false, error: "Room not found" }, { status: 404 });
    }

    return json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return json(
      { success: false, error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH /api/properties/:propertyId/rooms/:roomId
// Update a room type
//
// DELETE /api/properties/:propertyId/rooms/:roomId
// Delete a room type
// ========================================

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { propertyId, roomId } = params;
    if (!propertyId || !roomId) {
      return json({ success: false, error: "Property ID and Room ID required" }, { status: 400 });
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

    // Verify room belongs to this property
    const room = await prisma.roomType.findUnique({
      where: { id: roomId }
    });

    if (!room || room.propertyId !== propertyId) {
      return json({ success: false, error: "Room not found" }, { status: 404 });
    }

    // ========================================
    // UPDATE ROOM
    // ========================================
    if (request.method === "PATCH" || request.method === "PUT") {
      const body = await request.json();
      
      const updateData: any = {};
      
      // Only update fields that are provided
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.maxOccupancy !== undefined) updateData.maxOccupancy = parseInt(body.maxOccupancy);
      if (body.adults !== undefined) updateData.adults = parseInt(body.adults);
      if (body.children !== undefined) updateData.children = parseInt(body.children);
      if (body.bedType !== undefined) updateData.bedType = body.bedType;
      if (body.numberOfBeds !== undefined) updateData.numberOfBeds = parseInt(body.numberOfBeds);
      if (body.bedConfiguration !== undefined) updateData.bedConfiguration = body.bedConfiguration;
      if (body.roomSize !== undefined) updateData.roomSize = body.roomSize ? parseFloat(body.roomSize) : null;
      if (body.roomSizeUnit !== undefined) updateData.roomSizeUnit = body.roomSizeUnit;
      if (body.floor !== undefined) updateData.floor = body.floor;
      if (body.view !== undefined) updateData.view = body.view;
      if (body.images !== undefined) updateData.images = body.images;
      if (body.mainImage !== undefined) updateData.mainImage = body.mainImage;
      if (body.amenities !== undefined) updateData.amenities = body.amenities;
      if (body.features !== undefined) updateData.features = body.features;
      if (body.basePrice !== undefined) updateData.basePrice = parseFloat(body.basePrice);
      if (body.currency !== undefined) updateData.currency = body.currency;
      if (body.weekendPrice !== undefined) updateData.weekendPrice = body.weekendPrice ? parseFloat(body.weekendPrice) : null;
      if (body.available !== undefined) updateData.available = body.available;
      if (body.discountPercent !== undefined) updateData.discountPercent = body.discountPercent ? parseFloat(body.discountPercent) : null;
      if (body.specialOffer !== undefined) updateData.specialOffer = body.specialOffer;
      if (body.smokingAllowed !== undefined) updateData.smokingAllowed = body.smokingAllowed;
      if (body.petsAllowed !== undefined) updateData.petsAllowed = body.petsAllowed;
      
      // Handle totalUnits change
      if (body.totalUnits !== undefined) {
        const newTotalUnits = parseInt(body.totalUnits);
        const diff = newTotalUnits - room.totalUnits;
        
        updateData.totalUnits = newTotalUnits;
        
        // Update property's totalRooms count
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            totalRooms: {
              increment: diff
            }
          }
        });
      }

      const updatedRoom = await prisma.roomType.update({
        where: { id: roomId },
        data: updateData
      });

      return json({
        success: true,
        data: updatedRoom
      });
    }

    // ========================================
    // DELETE ROOM
    // ========================================
    if (request.method === "DELETE") {
      // Check if there are any active bookings for this room
      const activeBookings = await prisma.propertyBooking.count({
        where: {
          roomTypeId: roomId,
          status: {
            in: ["PENDING", "CONFIRMED"]
          }
        }
      });

      if (activeBookings > 0) {
        return json(
          { success: false, error: `Cannot delete room with ${activeBookings} active booking(s)` },
          { status: 400 }
        );
      }

      // Update property's totalRooms count
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          totalRooms: {
            decrement: room.totalUnits
          }
        }
      });

      // Delete the room
      await prisma.roomType.delete({
        where: { id: roomId }
      });

      return json({
        success: true,
        message: "Room deleted successfully"
      });
    }

    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error managing room:", error);
    return json(
      { success: false, error: "Failed to manage room" },
      { status: 500 }
    );
  }
}

