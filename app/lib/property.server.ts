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
 * Get all properties with starting prices (for listing page)
 */
export async function getPropertiesWithStartingPrices(filters?: {
  city?: string;
  type?: string;
  maxPrice?: number;
  minPrice?: number;
  guests?: number;
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

  const properties = await prisma.property.findMany({
    where,
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
          basePrice: true,
          currency: true
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
    take: filters?.limit || 20,
    skip: filters?.offset || 0
  });

  // Calculate starting price for each property
  const propertiesWithPrices = properties.map(property => {
    const lowestRoom = property.roomTypes[0];
    const startingPrice = lowestRoom ? lowestRoom.basePrice : property.basePrice;
    const currency = lowestRoom ? lowestRoom.currency : property.currency;
    const isRoomBased = !!lowestRoom;

    return {
      ...property,
      startingPrice,
      currency,
      isRoomBased,
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

