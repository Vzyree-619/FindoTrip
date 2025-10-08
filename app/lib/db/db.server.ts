import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

export { prisma };

// ==========================================
// UPDATED UTILITIES FOR NEW PRISMA MODELS
// ==========================================

export async function getProperties(filters?: {
  city?: string;
  country?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
}) {
  const where: any = { available: true, approvalStatus: "APPROVED" };

  if (filters?.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters?.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters?.type) where.type = filters.type;
  if (filters?.minPrice)
    where.basePrice = { ...where.basePrice, gte: filters.minPrice };
  if (filters?.maxPrice)
    where.basePrice = { ...where.basePrice, lte: filters.maxPrice };
  if (filters?.guests) where.maxGuests = { gte: filters.guests };

  const properties = await prisma.property.findMany({
    where,
    include: {
      owner: {
        select: {
          businessName: true,
          businessPhone: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: [
      { rating: "desc" },
      { reviewCount: "desc" },
    ],
  });

  // Filter out properties with conflicting bookings
  if (filters?.checkIn && filters?.checkOut) {
    const available = await Promise.all(
      properties.map(async (property) => {
        const conflictingBookings = await prisma.propertyBooking.findFirst({
          where: {
            propertyId: property.id,
            status: { in: ["CONFIRMED", "PENDING"] },
            OR: [
              {
                checkIn: { lte: filters.checkOut },
                checkOut: { gte: filters.checkIn },
              },
            ],
          },
        });
        return conflictingBookings ? null : property;
      })
    );
    return available.filter(Boolean);
  }

  return properties;
}

export async function getVehicles(filters?: {
  city?: string;
  country?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkIn?: Date;
  checkOut?: Date;
  seats?: number;
}) {
  const where: any = { available: true, approvalStatus: "APPROVED" };

  if (filters?.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters?.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters?.type)
    where.type = { contains: filters.type, mode: "insensitive" };
  if (filters?.minPrice)
    where.basePrice = { ...where.basePrice, gte: filters.minPrice };
  if (filters?.maxPrice)
    where.basePrice = { ...where.basePrice, lte: filters.maxPrice };
  if (filters?.seats) where.seats = { gte: filters.seats };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      owner: {
        select: {
          businessName: true,
          businessPhone: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: [
      { rating: "desc" },
      { reviewCount: "desc" },
    ],
  });

  // Filter out vehicles with conflicting bookings
  if (filters?.checkIn && filters?.checkOut) {
    const available = await Promise.all(
      vehicles.map(async (vehicle) => {
        const conflictingBookings = await prisma.vehicleBooking.findFirst({
          where: {
            vehicleId: vehicle.id,
            status: { in: ["CONFIRMED", "PENDING"] },
            OR: [
              {
                startDate: { lte: filters.checkOut },
                endDate: { gte: filters.checkIn },
              },
            ],
          },
        });
        return conflictingBookings ? null : vehicle;
      })
    );
    return available.filter(Boolean);
  }

  return vehicles;
}

export async function getTours(filters?: {
  city?: string;
  country?: string;
  language?: string;
  type?: string;
  maxPrice?: number;
  checkIn?: Date;
  participants?: number;
}) {
  const where: any = { available: true, approvalStatus: "APPROVED" };

  if (filters?.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters?.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters?.type) where.type = filters.type;
  if (filters?.language) where.languages = { has: filters.language };
  if (filters?.maxPrice) where.pricePerPerson = { lte: filters.maxPrice };
  if (filters?.participants) where.maxGroupSize = { gte: filters.participants };

  const tours = await prisma.tour.findMany({
    where,
    include: {
      guide: {
        select: {
          firstName: true,
          lastName: true,
          languages: true,
          yearsOfExperience: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: [
      { rating: "desc" },
      { reviewCount: "desc" },
    ],
  });

  return tours;
}

export async function createBooking(data: {
  userId: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  totalPrice: number;
  propertyId?: string;
  vehicleId?: string;
  tourId?: string;
  specialRequests?: string;
}) {
  // Generate unique booking number
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  const bookingNumber = `BK${timestamp}${random}`;

  let booking;

  if (data.propertyId) {
    booking = await prisma.propertyBooking.create({
      data: {
        bookingNumber,
        checkIn: data.checkIn!,
        checkOut: data.checkOut!,
        guests: data.guests!,
        adults: data.guests!,
        children: 0,
        infants: 0,
        basePrice: data.totalPrice,
        totalPrice: data.totalPrice,
        status: "PENDING",
        userId: data.userId,
        propertyId: data.propertyId,
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        specialRequests: data.specialRequests,
      },
    });
  } else if (data.vehicleId) {
    booking = await prisma.vehicleBooking.create({
      data: {
        bookingNumber,
        startDate: data.checkIn!,
        endDate: data.checkOut!,
        pickupTime: "09:00",
        returnTime: "18:00",
        pickupLocation: "TBD",
        returnLocation: "TBD",
        driverRequired: false,
        driverIncluded: false,
        basePrice: data.totalPrice,
        driverFee: 0,
        insuranceFee: 0,
        securityDeposit: 0,
        extraFees: 0,
        totalPrice: data.totalPrice,
        status: "PENDING",
        paymentStatus: "PENDING",
        userId: data.userId,
        vehicleId: data.vehicleId,
        renterName: "",
        renterEmail: "",
        renterPhone: "",
        licenseNumber: "",
        licenseExpiry: new Date(),
        specialRequests: data.specialRequests,
        additionalEquipment: [],
      },
    });
  } else if (data.tourId) {
    const tour = await prisma.tour.findUnique({ where: { id: data.tourId }, select: { guideId: true, meetingPoint: true, timeSlots: true } });
    const defaultSlot = tour?.timeSlots?.[0] || "09:00";
    booking = await prisma.tourBooking.create({
      data: {
        bookingNumber,
        tourDate: data.checkIn!,
        timeSlot: defaultSlot,
        participants: data.guests!,
        adults: data.guests!,
        children: 0,
        pricePerPerson: data.totalPrice / data.guests!,
        childDiscount: 0,
        groupDiscount: 0,
        extraFees: 0,
        totalPrice: data.totalPrice,
        status: "PENDING",
        paymentStatus: "PENDING",
        userId: data.userId,
        tourId: data.tourId,
        guideId: tour?.guideId || data.userId, // fallback
        leadTravelerName: "",
        leadTravelerEmail: "",
        leadTravelerPhone: "",
        participantNames: [],
        participantAges: [],
        dietaryRequirements: [],
        accessibilityNeeds: [],
        meetingPoint: tour?.meetingPoint || "TBD",
        meetingTime: defaultSlot,
        specialRequests: data.specialRequests,
      },
    });
  }

  return booking;
}

export async function getUserBookings(userId: string) {
  const propertyBookings = await prisma.propertyBooking.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          name: true,
          city: true,
          country: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const vehicleBookings = await prisma.vehicleBooking.findMany({
    where: { userId },
    include: {
      vehicle: {
        select: {
          name: true,
          city: true,
          country: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tourBookings = await prisma.tourBooking.findMany({
    where: { userId },
    include: {
      tour: {
        select: {
          title: true,
          city: true,
          country: true,
          images: true,
        },
      },
      guide: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    propertyBookings,
    vehicleBookings,
    tourBookings,
  };
}

export async function getPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          businessName: true,
          businessPhone: true,
          businessEmail: true,
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          businessName: true,
          businessPhone: true,
          businessEmail: true,
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });
}

export async function getTourById(id: string) {
  return prisma.tour.findUnique({
    where: { id },
    include: {
      guide: {
        select: {
          firstName: true,
          lastName: true,
          languages: true,
          yearsOfExperience: true,
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });
}
