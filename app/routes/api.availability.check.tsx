import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { isAfter, isBefore, differenceInDays, startOfDay } from "date-fns";
import { checkDateRangeAvailability } from "~/lib/availability.server";
import { calculateStayPrice } from "~/lib/pricing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const roomId = url.searchParams.get('roomId');
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');
  const numberOfRooms = parseInt(url.searchParams.get('rooms') || '1');

  if (!roomId || !checkIn || !checkOut) {
    return json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Validate dates
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return json({
      isAvailable: false,
      error: 'Invalid date format'
    }, { status: 400 });
  }

  if (isAfter(checkInDate, checkOutDate)) {
    return json({
      isAvailable: false,
      error: 'Check-out must be after check-in'
    }, { status: 400 });
  }

  if (isBefore(checkInDate, startOfDay(new Date()))) {
    return json({
      isAvailable: false,
      error: 'Cannot book dates in the past'
    }, { status: 400 });
  }

  // Check availability
  const availability = await checkDateRangeAvailability(
    roomId,
    checkInDate,
    checkOutDate,
    numberOfRooms
  );

  if (!availability.isAvailable) {
    // Get alternative dates
    const numberOfNights = differenceInDays(checkOutDate, checkInDate);
    const suggestions = await suggestAlternativeDates(
      roomId,
      checkInDate,
      numberOfNights,
      14
    );

    return json({
      isAvailable: false,
      reason: availability.reason,
      conflicts: availability.conflicts,
      minStay: availability.minStay,
      maxStay: availability.maxStay,
      suggestions
    });
  }

  // Calculate pricing
  const pricing = await calculateStayPrice(roomId, checkInDate, checkOutDate);

  return json({
    isAvailable: true,
    numberOfNights: availability.numberOfNights,
    pricing: {
      nights: pricing.nights.map(n => ({
        date: n.date,
        price: n.finalPrice,
        appliedRules: n.appliedRules
      })),
      subtotal: pricing.subtotal,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      taxAmount: pricing.taxAmount,
      total: pricing.total,
      averagePricePerNight: pricing.averagePricePerNight
    }
  });
}

// Helper function for alternative dates (imported from availability.server but adapted for API)
async function suggestAlternativeDates(
  roomId: string,
  preferredCheckIn: Date,
  numberOfNights: number,
  searchRadius: number = 14
) {
  const { checkDateRangeAvailability, calculateStayPrice } = await import("~/lib/availability.server");
  const { subDays, addDays } = await import("date-fns");

  const suggestions = [];

  // Check dates before preferred date
  for (let i = 1; i <= searchRadius; i++) {
    const checkIn = subDays(preferredCheckIn, i);
    const checkOut = addDays(checkIn, numberOfNights);

    const availability = await checkDateRangeAvailability(roomId, checkIn, checkOut);

    if (availability.isAvailable) {
      // Get pricing for this date range
      const pricing = await calculateStayPrice(roomId, checkIn, checkOut);
      suggestions.push({
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        totalPrice: pricing.total,
        avgPricePerNight: pricing.averagePricePerNight,
        daysDifferent: -i
      });
    }
  }

  // Check dates after preferred date
  for (let i = 1; i <= searchRadius; i++) {
    const checkIn = addDays(preferredCheckIn, i);
    const checkOut = addDays(checkIn, numberOfNights);

    const availability = await checkDateRangeAvailability(roomId, checkIn, checkOut);

    if (availability.isAvailable) {
      // Get pricing for this date range
      const pricing = await calculateStayPrice(roomId, checkIn, checkOut);
      suggestions.push({
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        totalPrice: pricing.total,
        avgPricePerNight: pricing.averagePricePerNight,
        daysDifferent: i
      });
    }

    // Limit to 5 suggestions
    if (suggestions.length >= 5) break;
  }

  // Sort by price (cheapest first) and proximity
  return suggestions.sort((a, b) => {
    const priceDiff = a.totalPrice - b.totalPrice;
    if (Math.abs(priceDiff) > 50) return priceDiff;
    return Math.abs(a.daysDifferent) - Math.abs(b.daysDifferent);
  });
}
