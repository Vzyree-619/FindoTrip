import { prisma } from "~/lib/db/db.server";

/**
 * Get the lowest price for a property (for "starting from" display)
 * For multi-room properties, returns the lowest room price
 * For single-unit properties, returns the base price
 */
export async function getPropertyStartingPrice(propertyId: string): Promise<{
  price: number;
  currency: string;
  isRoomBased: boolean;
}> {
  try {
    // First check if property has rooms
    const lowestRoom = await prisma.roomType.findFirst({
      where: {
        propertyId,
        available: true
      },
      orderBy: {
        basePrice: 'asc'
      },
      select: {
        basePrice: true,
        currency: true
      }
    });

    if (lowestRoom) {
      return {
        price: lowestRoom.basePrice,
        currency: lowestRoom.currency,
        isRoomBased: true
      };
    }

    // If no rooms, get property base price
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        basePrice: true,
        currency: true
      }
    });

    if (!property) {
      throw new Error("Property not found");
    }

    return {
      price: property.basePrice,
      currency: property.currency,
      isRoomBased: false
    };
  } catch (error) {
    console.error("Error getting property starting price:", error);
    throw error;
  }
}

/**
 * Get enriched property data with starting price
 */
export async function getPropertyWithStartingPrice(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        select: {
          businessName: true,
          verified: true
        }
      },
      roomTypes: {
        where: { available: true },
        select: {
          id: true,
          name: true,
          basePrice: true,
          currency: true
        },
        orderBy: {
          basePrice: 'asc'
        }
      }
    }
  });

  if (!property) {
    return null;
  }

  const startingPrice = await getPropertyStartingPrice(propertyId);

  return {
    ...property,
    startingPrice: startingPrice.price,
    currency: startingPrice.currency,
    isRoomBased: startingPrice.isRoomBased
  };
}

/**
 * Filter properties by room availability for specific dates
 */
export async function filterPropertiesByRoomAvailability(
  propertyIds: string[],
  checkIn: Date,
  checkOut: Date,
  numberOfRooms: number = 1,
  guests?: number
): Promise<string[]> {
  if (propertyIds.length === 0) return [];

  // Get all room types for these properties
  const roomTypes = await prisma.roomType.findMany({
    where: {
      propertyId: { in: propertyIds },
      available: true,
      ...(guests && { maxOccupancy: { gte: guests } })
    },
    select: {
      id: true,
      propertyId: true,
      totalUnits: true
    }
  });

  // Group rooms by property
  const roomsByProperty = new Map<string, typeof roomTypes>();
  roomTypes.forEach(room => {
    if (!roomsByProperty.has(room.propertyId)) {
      roomsByProperty.set(room.propertyId, []);
    }
    roomsByProperty.get(room.propertyId)!.push(room);
  });

  // Check availability for each property
  const availablePropertyIds: string[] = [];

  for (const propertyId of propertyIds) {
    const propertyRooms = roomsByProperty.get(propertyId) || [];
    
    // If property has no rooms, skip it (or handle single-unit properties differently)
    if (propertyRooms.length === 0) {
      // For single-unit properties, check property-level bookings
      const booked = await prisma.propertyBooking.count({
        where: {
          propertyId,
          roomTypeId: null,
          status: { not: 'CANCELLED' },
          OR: [
            { checkIn: { gte: checkIn, lt: checkOut } },
            { checkOut: { gt: checkIn, lte: checkOut } },
            {
              AND: [
                { checkIn: { lte: checkIn } },
                { checkOut: { gte: checkOut } }
              ]
            }
          ]
        }
      });
      
      if (booked === 0) {
        availablePropertyIds.push(propertyId);
      }
      continue;
    }

    // Check if at least one room type has availability
    let hasAvailableRoom = false;
    for (const room of propertyRooms) {
      const bookedUnits = await prisma.propertyBooking.count({
        where: {
          roomTypeId: room.id,
          status: { not: 'CANCELLED' },
          OR: [
            { checkIn: { gte: checkIn, lt: checkOut } },
            { checkOut: { gt: checkIn, lte: checkOut } },
            {
              AND: [
                { checkIn: { lte: checkIn } },
                { checkOut: { gte: checkOut } }
              ]
            }
          ]
        }
      });

      const availableUnits = (room.totalUnits || 1) - bookedUnits;
      if (availableUnits >= numberOfRooms) {
        hasAvailableRoom = true;
        break;
      }
    }

    if (hasAvailableRoom) {
      availablePropertyIds.push(propertyId);
    }
  }

  return availablePropertyIds;
}

/**
 * Get all properties with starting prices (for listing page)
 */
export async function getPropertiesWithStartingPrices(filters?: {
  city?: string;
  type?: string;
  maxPrice?: number;
  minPrice?: number;
  guests?: number;
  checkIn?: Date;
  checkOut?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    available: true,
    approvalStatus: "APPROVED"
  };

  if (filters?.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.guests) {
    where.maxGuests = { gte: filters.guests };
  }

  // Build room filter
  const roomWhere: any = { available: true };
  if (filters?.guests) {
    roomWhere.maxOccupancy = { gte: filters.guests };
  }
  if (filters?.minPrice || filters?.maxPrice) {
    roomWhere.basePrice = {};
    if (filters.minPrice) roomWhere.basePrice.gte = filters.minPrice;
    if (filters.maxPrice) roomWhere.basePrice.lte = filters.maxPrice;
  }

  let properties;
  try {
    properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            businessName: true,
            verified: true
          }
        },
        roomTypes: {
          where: roomWhere,
          select: {
            id: true,
            basePrice: true,
            currency: true,
            maxOccupancy: true
          },
          orderBy: {
            basePrice: 'asc'
          },
          take: 1
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: filters?.limit ? filters.limit * 2 : 40, // Get more to filter by availability
      skip: filters?.offset || 0
    });
  } catch (error) {
    console.error('Error in getPropertiesWithStartingPrices:', error);
    throw error;
  }

  // Calculate starting price for each property
  const propertiesWithPrices = properties.map(property => {
    const lowestRoom = property.roomTypes && property.roomTypes.length > 0 ? property.roomTypes[0] : null;
    const startingPrice = lowestRoom ? lowestRoom.basePrice : (property.basePrice || 0);
    const currency = lowestRoom ? lowestRoom.currency : (property.currency || 'PKR');
    const isRoomBased = !!lowestRoom;
    
    // Count total room types for this property
    const totalRoomTypes = property.roomTypes ? property.roomTypes.length : 0;

    return {
      ...property,
      startingPrice,
      currency,
      isRoomBased,
      totalRoomTypes,
      roomTypes: undefined // Remove detailed room data from list view
    };
  });

  // Apply price filters if provided
  let filtered = propertiesWithPrices;
  if (filters?.minPrice) {
    filtered = filtered.filter(p => p.startingPrice >= filters.minPrice!);
  }
  if (filters?.maxPrice) {
    filtered = filtered.filter(p => p.startingPrice <= filters.maxPrice!);
  }

  // Filter by room availability if dates provided
  if (filters?.checkIn && filters?.checkOut) {
    const propertyIds = filtered.map(p => p.id);
    const availablePropertyIds = await filterPropertiesByRoomAvailability(
      propertyIds,
      filters.checkIn,
      filters.checkOut,
      1, // numberOfRooms
      filters.guests
    );
    
    filtered = filtered.filter(p => availablePropertyIds.includes(p.id));
  }

  // Sort by starting price (ascending)
  filtered.sort((a, b) => a.startingPrice - b.startingPrice);

  // Apply limit after filtering
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Check room availability for specific dates
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  numberOfRooms: number = 1
): Promise<boolean> {
  try {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: {
        totalUnits: true,
        available: true
      }
    });

    if (!roomType || !roomType.available) {
      return false;
    }

    // Check how many rooms are already booked for these dates
    const overlappingBookings = await prisma.propertyBooking.findMany({
      where: {
        roomTypeId,
        status: {
          in: ["PENDING", "CONFIRMED"]
        },
        OR: [
          {
            AND: [
              { checkIn: { lte: checkIn } },
              { checkOut: { gt: checkIn } }
            ]
          },
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gte: checkOut } }
            ]
          },
          {
            AND: [
              { checkIn: { gte: checkIn } },
              { checkOut: { lte: checkOut } }
            ]
          }
        ]
      },
      select: {
        numberOfRooms: true
      }
    });

    const bookedRooms = overlappingBookings.reduce((sum, booking) => sum + booking.numberOfRooms, 0);
    const availableRooms = roomType.totalUnits - bookedRooms;

    return availableRooms >= numberOfRooms;
  } catch (error) {
    console.error("Error checking room availability:", error);
    return false;
  }
}

/**
 * Calculate total booking price with all fees
 */
export function calculateBookingPrice(
  roomRate: number,
  numberOfNights: number,
  numberOfRooms: number,
  cleaningFee: number = 0,
  serviceFee: number = 0,
  taxRate: number = 0
): {
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
} {
  const basePrice = roomRate * numberOfNights * numberOfRooms;
  const taxes = basePrice * (taxRate / 100);
  const total = basePrice + cleaningFee + serviceFee + taxes;

  return {
    basePrice,
    cleaningFee,
    serviceFee,
    taxes,
    total
  };
}

