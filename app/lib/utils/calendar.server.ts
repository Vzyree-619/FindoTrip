import { prisma } from "~/lib/db/db.server";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: "booking" | "unavailable" | "maintenance";
  status: "confirmed" | "pending" | "cancelled";
  color?: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarAvailability {
  date: Date;
  available: boolean;
  reason?: string;
  bookings?: CalendarEvent[];
}

/**
 * Get calendar events for a service
 */
export async function getServiceCalendarEvents(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // Get bookings
  let bookings: any[] = [];
  if (serviceType === "property") {
    bookings = await prisma.propertyBooking.findMany({
      where: {
        propertyId: serviceId,
        OR: [
          {
            checkIn: { lte: endDate },
            checkOut: { gte: startDate },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } else if (serviceType === "vehicle") {
    bookings = await prisma.vehicleBooking.findMany({
      where: {
        vehicleId: serviceId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } else if (serviceType === "tour") {
    bookings = await prisma.tourBooking.findMany({
      where: {
        tourId: serviceId,
        tourDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Convert bookings to calendar events
  for (const booking of bookings) {
    let start: Date;
    let end: Date;
    let title: string;

    if (serviceType === "property") {
      start = new Date(booking.checkIn);
      end = new Date(booking.checkOut);
      title = `Booking: ${booking.user.name}`;
    } else if (serviceType === "vehicle") {
      start = new Date(booking.startDate);
      end = new Date(booking.endDate);
      title = `Rental: ${booking.user.name}`;
    } else {
      start = new Date(booking.tourDate);
      end = new Date(booking.tourDate);
      end.setHours(end.getHours() + 4); // Assume 4-hour tour
      title = `Tour: ${booking.user.name} (${booking.participants} people)`;
    }

    events.push({
      id: booking.id,
      title,
      start,
      end,
      allDay: serviceType === "property",
      type: "booking",
      status: booking.status.toLowerCase() as "confirmed" | "pending" | "cancelled",
      color: getStatusColor(booking.status),
      description: booking.specialRequests || "",
      location: serviceType === "property" ? booking.property?.address : 
                serviceType === "vehicle" ? booking.pickupLocation : 
                booking.tour?.meetingPoint,
      attendees: [booking.user.email],
    });
  }

  // Get unavailable dates
  const unavailableDates = await prisma.unavailableDate.findMany({
    where: {
      serviceId,
      serviceType,
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  // Convert unavailable dates to calendar events
  for (const unavailable of unavailableDates) {
    events.push({
      id: unavailable.id,
      title: `Unavailable: ${unavailable.reason || "Blocked"}`,
      start: new Date(unavailable.startDate),
      end: new Date(unavailable.endDate),
      allDay: true,
      type: "unavailable",
      status: "confirmed",
      color: "#f59e0b", // Orange for unavailable
      description: unavailable.reason || "This period is unavailable",
    });
  }

  return events;
}

/**
 * Get calendar availability for a date range
 */
export async function getServiceAvailability(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  startDate: Date,
  endDate: Date
): Promise<CalendarAvailability[]> {
  const availability: CalendarAvailability[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const date = new Date(currentDate);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Check for bookings on this date
    let bookings: any[] = [];
    if (serviceType === "property") {
      bookings = await prisma.propertyBooking.findMany({
        where: {
          propertyId: serviceId,
          status: { in: ["CONFIRMED", "PENDING"] },
          OR: [
            {
              checkIn: { lte: dayEnd },
              checkOut: { gte: dayStart },
            },
          ],
        },
      });
    } else if (serviceType === "vehicle") {
      bookings = await prisma.vehicleBooking.findMany({
        where: {
          vehicleId: serviceId,
          status: { in: ["CONFIRMED", "PENDING"] },
          OR: [
            {
              startDate: { lte: dayEnd },
              endDate: { gte: dayStart },
            },
          ],
        },
      });
    } else if (serviceType === "tour") {
      bookings = await prisma.tourBooking.findMany({
        where: {
          tourId: serviceId,
          status: { in: ["CONFIRMED", "PENDING"] },
          tourDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });
    }

    // Check for unavailable dates
    const unavailableDates = await prisma.unavailableDate.findMany({
      where: {
        serviceId,
        serviceType,
        OR: [
          {
            startDate: { lte: dayEnd },
            endDate: { gte: dayStart },
          },
        ],
      },
    });

    const isAvailable = bookings.length === 0 && unavailableDates.length === 0;
    let reason: string | undefined;

    if (bookings.length > 0) {
      reason = "Booked";
    } else if (unavailableDates.length > 0) {
      reason = unavailableDates[0].reason || "Unavailable";
    }

    availability.push({
      date: new Date(date),
      available: isAvailable,
      reason,
      bookings: bookings.map(booking => ({
        id: booking.id,
        title: `Booking: ${booking.user?.name || "Guest"}`,
        start: serviceType === "property" ? new Date(booking.checkIn) :
               serviceType === "vehicle" ? new Date(booking.startDate) :
               new Date(booking.tourDate),
        end: serviceType === "property" ? new Date(booking.checkOut) :
             serviceType === "vehicle" ? new Date(booking.endDate) :
             new Date(booking.tourDate),
        allDay: serviceType === "property",
        type: "booking" as const,
        status: booking.status.toLowerCase() as "confirmed" | "pending" | "cancelled",
        color: getStatusColor(booking.status),
      })),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
}

/**
 * Block dates for a service
 */
export async function blockServiceDates(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  startDate: Date,
  endDate: Date,
  reason: string,
  ownerId: string
): Promise<void> {
  await prisma.unavailableDate.create({
    data: {
      serviceId,
      serviceType,
      startDate,
      endDate,
      reason,
      // If this block is due to an actual booking, mark as 'booked' so
      // cancellation logic that deletes type: "booked" entries works correctly.
      type: reason?.toLowerCase() === "booked" ? "booked" : "blocked",
      ownerId,
    },
  });
}

/**
 * Unblock dates for a service
 */
export async function unblockServiceDates(
  serviceId: string,
  serviceType: "property" | "vehicle" | "tour",
  startDate: Date,
  endDate: Date
): Promise<void> {
  await prisma.unavailableDate.deleteMany({
    where: {
      serviceId,
      serviceType,
      startDate,
      endDate,
      type: "blocked",
    },
  });
}

/**
 * Get provider's calendar overview
 */
export async function getProviderCalendarOverview(
  providerId: string,
  providerRole: "PROPERTY_OWNER" | "VEHICLE_OWNER" | "TOUR_GUIDE",
  startDate: Date,
  endDate: Date
): Promise<{
  totalBookings: number;
  totalRevenue: number;
  availability: CalendarAvailability[];
  upcomingBookings: CalendarEvent[];
}> {
  let services: any[] = [];
  let bookings: any[] = [];

  if (providerRole === "PROPERTY_OWNER") {
    services = await prisma.property.findMany({
      where: { ownerId: providerId },
      select: { id: true, name: true },
    });

    bookings = await prisma.propertyBooking.findMany({
      where: {
        property: { ownerId: providerId },
        OR: [
          {
            checkIn: { lte: endDate },
            checkOut: { gte: startDate },
          },
        ],
      },
      include: {
        property: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });
  } else if (providerRole === "VEHICLE_OWNER") {
    services = await prisma.vehicle.findMany({
      where: { ownerId: providerId },
      select: { id: true, name: true },
    });

    bookings = await prisma.vehicleBooking.findMany({
      where: {
        vehicle: { ownerId: providerId },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      include: {
        vehicle: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });
  } else if (providerRole === "TOUR_GUIDE") {
    services = await prisma.tour.findMany({
      where: { guideId: providerId },
      select: { id: true, title: true },
    });

    bookings = await prisma.tourBooking.findMany({
      where: {
        guideId: providerId,
        tourDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        tour: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });
  }

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

  // Get availability for all services
  const availability: CalendarAvailability[] = [];
  for (const service of services) {
    const serviceAvailability = await getServiceAvailability(
      service.id,
      providerRole === "PROPERTY_OWNER" ? "property" :
      providerRole === "VEHICLE_OWNER" ? "vehicle" : "tour",
      startDate,
      endDate
    );
    availability.push(...serviceAvailability);
  }

  // Get upcoming bookings
  const upcomingBookings: CalendarEvent[] = bookings
    .filter(booking => {
      const bookingDate = providerRole === "PROPERTY_OWNER" ? new Date(booking.checkIn) :
                         providerRole === "VEHICLE_OWNER" ? new Date(booking.startDate) :
                         new Date(booking.tourDate);
      return bookingDate >= new Date();
    })
    .map(booking => {
      const start = providerRole === "PROPERTY_OWNER" ? new Date(booking.checkIn) :
                   providerRole === "VEHICLE_OWNER" ? new Date(booking.startDate) :
                   new Date(booking.tourDate);
      const end = providerRole === "PROPERTY_OWNER" ? new Date(booking.checkOut) :
                 providerRole === "VEHICLE_OWNER" ? new Date(booking.endDate) :
                 new Date(booking.tourDate);

      return {
        id: booking.id,
        title: `Booking: ${booking.user.name}`,
        start,
        end,
        allDay: providerRole === "PROPERTY_OWNER",
        type: "booking" as const,
        status: booking.status.toLowerCase() as "confirmed" | "pending" | "cancelled",
        color: getStatusColor(booking.status),
        description: booking.specialRequests || "",
        attendees: [booking.user.email],
      };
    });

  return {
    totalBookings,
    totalRevenue,
    availability,
    upcomingBookings,
  };
}

/**
 * Get booking status color
 */
function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "#10b981"; // Green
    case "PENDING":
      return "#f59e0b"; // Orange
    case "CANCELLED":
      return "#ef4444"; // Red
    case "COMPLETED":
      return "#6366f1"; // Blue
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Export calendar events to ICS format
 */
export function exportCalendarToICS(events: CalendarEvent[]): string {
  let ics = "BEGIN:VCALENDAR\n";
  ics += "VERSION:2.0\n";
  ics += "PRODID:-//FindoTrip//Booking Calendar//EN\n";
  ics += "CALSCALE:GREGORIAN\n";

  for (const event of events) {
    ics += "BEGIN:VEVENT\n";
    ics += `UID:${event.id}@findotrip.com\n`;
    ics += `DTSTART:${formatDateForICS(event.start)}\n`;
    ics += `DTEND:${formatDateForICS(event.end)}\n`;
    ics += `SUMMARY:${event.title}\n`;
    if (event.description) {
      ics += `DESCRIPTION:${event.description}\n`;
    }
    if (event.location) {
      ics += `LOCATION:${event.location}\n`;
    }
    ics += "STATUS:CONFIRMED\n";
    ics += "END:VEVENT\n";
  }

  ics += "END:VCALENDAR\n";
  return ics;
}

/**
 * Format date for ICS format
 */
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Sync with external calendar (Google Calendar, Outlook, etc.)
 */
export async function syncWithExternalCalendar(
  providerId: string,
  calendarType: "google" | "outlook" | "apple",
  accessToken: string
): Promise<boolean> {
  // In a real application, you would integrate with the respective calendar APIs
  // This is a placeholder for the integration logic
  
  try {
    // Placeholder for external calendar sync
    console.log(`Syncing calendar for provider ${providerId} with ${calendarType}`);
    
    // Example integration points:
    // - Google Calendar API
    // - Microsoft Graph API (Outlook)
    // - Apple Calendar API
    
    return true;
  } catch (error) {
    console.error("Error syncing with external calendar:", error);
    return false;
  }
}
