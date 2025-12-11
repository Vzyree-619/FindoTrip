import { prisma } from "~/lib/db/db.server";
import { format, startOfDay, differenceInDays, addDays } from "date-fns";
import type { PriceAdjustmentType } from "@prisma/client";

/**
 * Calculate price for a room on a specific date
 * Considers: base price, custom prices, seasonal pricing, event pricing, discounts
 */
export async function calculateRoomPrice(
  roomTypeId: string,
  date: Date,
  numberOfNights?: number,
  bookingDate?: Date // Date when booking is made (for early bird/last minute discounts)
): Promise<PriceBreakdown> {
  // 1. Get base price from room
  const room = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: {
      basePrice: true,
      currency: true,
    }
  });

  if (!room) {
    throw new Error(`Room type ${roomTypeId} not found`);
  }

  let finalPrice = room.basePrice;
  let appliedRules: string[] = [];

  // Normalize date to start of day for comparison
  const normalizedDate = startOfDay(date);
  const dayOfWeek = normalizedDate.getDay(); // 0 = Sunday, 6 = Saturday

  // 2. Check for custom price on this specific date (highest priority)
  const customAvailability = await prisma.roomAvailability.findUnique({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date: normalizedDate,
      }
    }
  });

  if (customAvailability?.customPrice) {
    finalPrice = customAvailability.customPrice;
    appliedRules.push(`Custom price set for ${format(date, 'MMM d')}`);
  } else {
    // 3. Check for event pricing (special occasions) - higher priority than seasonal
    const eventPricing = await prisma.specialEventPricing.findFirst({
      where: {
        OR: [
          { roomTypeId: roomTypeId }, // Room-specific events
          { roomTypeId: null } // Property-wide events
        ],
        isActive: true,
        startDate: { lte: normalizedDate },
        endDate: { gte: normalizedDate }
      },
      orderBy: {
        priceMultiplier: 'desc' // Use highest multiplier if multiple events
      }
    });

    if (eventPricing) {
      finalPrice = finalPrice * eventPricing.priceMultiplier;
      appliedRules.push(`${eventPricing.eventName}: ${eventPricing.priceMultiplier}x multiplier`);
    } else {
      // 4. Check for seasonal pricing
      const seasonalPricing = await prisma.seasonalPricing.findFirst({
        where: {
          AND: [
            {
              OR: [
                { roomTypeId: roomTypeId }, // Room-specific seasonal pricing
                { roomTypeId: null } // Property-wide seasonal pricing
              ]
            },
            { isActive: true },
            { startDate: { lte: normalizedDate } },
            { endDate: { gte: normalizedDate } },
            {
              OR: [
                { daysOfWeek: { isEmpty: true } }, // Applies to all days
                { daysOfWeek: { has: dayOfWeek } } // Applies to this day of week
              ]
            }
          ]
        },
        orderBy: {
          priority: 'desc' // Higher priority first
        }
      });

      if (seasonalPricing) {
        finalPrice = applyPriceAdjustment(
          finalPrice,
          seasonalPricing.priceAdjustment,
          seasonalPricing.adjustmentValue
        );
        appliedRules.push(`Seasonal: ${seasonalPricing.name}`);
      }
    }
  }

  // 5. Apply discounts (if booking X nights or X days in advance)
  if (numberOfNights && bookingDate) {
    try {
    const daysInAdvance = differenceInDays(normalizedDate, startOfDay(bookingDate));
    
    // Get property ID for property-wide discounts
    const roomWithProperty = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { propertyId: true }
    });

    // Get applicable discounts with simpler query
    let allDiscounts: any[] = [];
    try {
      allDiscounts = await prisma.discountRule.findMany({
        where: {
          OR: [
            { roomTypeId: roomTypeId },
            ...(roomWithProperty ? [{ propertyId: roomWithProperty.propertyId }] : [])
          ],
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error fetching discounts:', error);
      // Continue without discounts if query fails
    }

    // Filter discounts manually to avoid complex Prisma queries
    const discounts = allDiscounts.filter(discount => {
      try {
        // Check validity dates
        if (discount.validFrom && discount.validFrom > normalizedDate) return false;
        if (discount.validUntil && discount.validUntil < normalizedDate) return false;

        // Check discount conditions
        switch (discount.type) {
          case 'LONG_STAY':
            return discount.minNights ? numberOfNights >= discount.minNights : false;
          case 'EARLY_BIRD':
            return discount.daysInAdvance ? daysInAdvance >= discount.daysInAdvance : false;
          case 'LAST_MINUTE':
            return discount.daysBeforeCheckIn ? daysInAdvance <= discount.daysBeforeCheckIn : false;
          case 'WEEKLY':
            return discount.minNights ? numberOfNights >= discount.minNights : false;
          case 'MONTHLY':
            return discount.minNights ? numberOfNights >= discount.minNights : false;
          default:
            return false;
        }
      } catch (error) {
        console.error('Error filtering discount:', discount, error);
        return false; // Skip problematic discounts
      }
    });

      // Apply best discount (highest percentage)
      if (discounts.length > 0) {
        const bestDiscount = discounts.reduce((prev, current) =>
          current.discountPercent > prev.discountPercent ? current : prev
        );

        const discountAmount = finalPrice * (bestDiscount.discountPercent / 100);
        finalPrice = finalPrice - discountAmount;
        appliedRules.push(`${bestDiscount.type} discount: -${bestDiscount.discountPercent}%`);
      }
    } catch (error) {
      console.error('Error calculating discounts:', error);
      // Continue without discounts if there's an error
    }
  }

  return {
    basePrice: room.basePrice,
    finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimals
    appliedRules,
    date: normalizedDate,
    currency: room.currency,
  };
}

/**
 * Calculate total price for a stay (multiple nights)
 */
export async function calculateStayPrice(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  bookingDate?: Date,
  cleaningFee?: number,
  serviceFeePercent?: number,
  taxRate?: number
): Promise<StayPriceBreakdown> {
  const nights: PriceBreakdown[] = [];
  let currentDate = new Date(checkInDate);
  const numberOfNights = differenceInDays(checkOutDate, checkInDate);

  // Calculate price for each night
  while (currentDate < checkOutDate) {
    const nightPrice = await calculateRoomPrice(
      roomTypeId,
      currentDate,
      numberOfNights,
      bookingDate
    );
    nights.push(nightPrice);
    currentDate = addDays(currentDate, 1);
  }

  const subtotal = nights.reduce((sum, night) => sum + night.finalPrice, 0);

  // Get room details for fees
  const room = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: {
      property: {
        select: {
          cleaningFee: true,
          serviceFee: true,
          taxRate: true,
        }
      }
    }
  });

  const finalCleaningFee = cleaningFee ?? room?.property?.cleaningFee ?? 0;
  // Service fee: if property.serviceFee is set and > 0, use it as fixed amount, otherwise use 10% of subtotal
  const propertyServiceFee = room?.property?.serviceFee ?? 0;
  const finalServiceFee = serviceFeePercent !== undefined 
    ? subtotal * serviceFeePercent 
    : (propertyServiceFee > 0 ? propertyServiceFee : subtotal * 0.10);
  // Tax rate is stored as percentage (e.g., 8 for 8%), convert to decimal
  const finalTaxRate = taxRate !== undefined 
    ? taxRate 
    : (room?.property?.taxRate ?? 8) / 100;

  const serviceFee = finalServiceFee;
  const taxAmount = (subtotal + serviceFee) * finalTaxRate;
  const total = subtotal + finalCleaningFee + serviceFee + taxAmount;

  return {
    nights,
    subtotal: Math.round(subtotal * 100) / 100,
    cleaningFee: Math.round(finalCleaningFee * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    averagePricePerNight: Math.round((subtotal / nights.length) * 100) / 100,
    currency: nights[0]?.currency ?? "PKR",
  };
}

/**
 * Helper function to apply price adjustments
 */
function applyPriceAdjustment(
  basePrice: number,
  type: PriceAdjustmentType,
  value: number
): number {
  switch (type) {
    case 'PERCENTAGE_INCREASE':
      return basePrice * (1 + value / 100);
    case 'PERCENTAGE_DECREASE':
      return basePrice * (1 - value / 100);
    case 'FIXED_INCREASE':
      return basePrice + value;
    case 'FIXED_DECREASE':
      return basePrice - value;
    case 'FIXED_PRICE':
      return value;
    default:
      return basePrice;
  }
}

// TypeScript interfaces
export interface PriceBreakdown {
  basePrice: number;
  finalPrice: number;
  appliedRules: string[];
  date: Date;
  currency: string;
}

export interface StayPriceBreakdown {
  nights: PriceBreakdown[];
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxAmount: number;
  total: number;
  averagePricePerNight: number;
  currency: string;
}

