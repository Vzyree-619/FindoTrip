/**
 * Client-safe utility functions for property/room calculations
 * These functions don't use server-only code (like Prisma) and can be used in client components
 */

/**
 * Calculate booking price breakdown
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

