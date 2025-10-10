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

// Helper functions for common queries

export async function getAccommodations(filters?: {
  city?: string;
  country?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
}) {
  const where: any = { available: true };

  if (filters?.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters?.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters?.type) where.type = filters.type;
  if (filters?.minPrice)
    where.pricePerNight = { ...where.pricePerNight, gte: filters.minPrice };
  if (filters?.maxPrice)
    where.pricePerNight = { ...where.pricePerNight, lte: filters.maxPrice };
  if (filters?.guests) where.maxGuests = { gte: filters.guests };

  const accommodations = await prisma.accommodation.findMany({
    where,
    include: {
      owner: {
        select: {
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      rating: "desc",
    },
  });

  // Filter out accommodations with conflicting bookings
  if (filters?.checkIn && filters?.checkOut) {
    const available = await Promise.all(
      accommodations.map(async (acc) => {
        const conflictingBookings = await prisma.booking.findFirst({
          where: {
            accommodationId: acc.id,
            status: { in: ["CONFIRMED", "PENDING"] },
            OR: [
              {
                checkIn: { lte: filters.checkOut },
                checkOut: { gte: filters.checkIn },
              },
            ],
          },
        });
        return conflictingBookings ? null : acc;
      })
    );
    return available.filter(Boolean);
  }

  return accommodations;
}

export async function getCars(filters?: {
  city?: string;
  country?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkIn?: Date;
  checkOut?: Date;
  seats?: number;
}) {
  const where: any = { available: true };

  if (filters?.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters?.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters?.type)
    where.type = { contains: filters.type, mode: "insensitive" };
  if (filters?.minPrice)
    where.pricePerDay = { ...where.pricePerDay, gte: filters.minPrice };
  if (filters?.maxPrice)
    where.pricePerDay = { ...where.pricePerDay, lte: filters.maxPrice };
  if (filters?.seats) where.seats = { gte: filters.seats };

  const cars = await prisma.car.findMany({
    where,
    include: {
      provider: {
        select: {
          name: true,
          phone: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      rating: "desc",
    },
  });

  // Filter out cars with conflicting bookings
  if (filters?.checkIn && filters?.checkOut) {
    const available = await Promise.all(
      cars.map(async (car) => {
        const conflictingBookings = await prisma.booking.findFirst({
          where: {
            carId: car.id,
            status: { in: ["CONFIRMED", "PENDING"] },
            OR: [
              {
                checkIn: { lte: filters.checkOut },
                checkOut: { gte: filters.checkIn },
              },
            ],
          },
        });
        return conflictingBookings ? null : car;
      })
    );
    return available.filter(Boolean);
  }

  return cars;
}

export async function getTourGuides(filters?: {
  city?: string;
  country?: string;
  language?: string;
  specialty?: string;
  maxPrice?: number;
}) {
  const where: any = { available: true };

  if (filters?.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters?.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters?.language) where.languages = { has: filters.language };
  if (filters?.specialty) where.specialties = { has: filters.specialty };
  if (filters?.maxPrice) where.pricePerHour = { lte: filters.maxPrice };

  return prisma.tourGuide.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      rating: "desc",
    },
  });
}

export async function createBooking(data: {
  userId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  accommodationId?: string;
  carId?: string;
  tourGuideId?: string;
  specialRequests?: string;
}) {
  const bookingNumber = `BK${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;

  return prisma.booking.create({
    data: {
      ...data,
      bookingNumber,
      status: "PENDING",
    },
    include: {
      accommodation: true,
      car: true,
      tourGuide: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function getUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      accommodation: true,
      car: true,
      tourGuide: {
        include: {
          user: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProviderStats(providerId: string) {
  const cars = await prisma.car.findMany({
    where: { providerId },
    include: {
      bookings: {
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      },
    },
  });

  const totalBookings = cars.reduce((sum, car) => sum + car.bookings.length, 0);
  const totalRevenue = cars.reduce(
    (sum, car) =>
      sum +
      car.bookings.reduce(
        (bookingSum, booking) => bookingSum + booking.totalPrice,
        0
      ),
    0
  );

  return {
    totalCars: cars.length,
    totalBookings,
    totalRevenue,
    activeCars: cars.filter((car) => car.available).length,
    cars,
  };
}

export async function getGuideStats(guideId: string) {
  const guide = await prisma.tourGuide.findUnique({
    where: { id: guideId },
    include: {
      bookings: {
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      reviews: true,
    },
  });

  if (!guide) return null;

  const totalRevenue = guide.bookings.reduce(
    (sum, booking) => sum + booking.totalPrice,
    0
  );

  return {
    totalTours: guide.toursCompleted,
    upcomingTours: guide.bookings.filter(
      (b) => b.status === "CONFIRMED" && b.checkIn > new Date()
    ).length,
    totalRevenue,
    rating: guide.rating,
    reviewCount: guide.reviewCount,
    bookings: guide.bookings,
  };
}

export async function createReview(data: {
  userId: string;
  bookingId: string;
  rating: number;
  comment: string;
  accommodationId?: string;
  carId?: string;
  tourGuideId?: string;
}) {
  const review = await prisma.review.create({
    data,
  });

  // Update average rating
  if (data.accommodationId) {
    const avgRating = await prisma.review.aggregate({
      where: { accommodationId: data.accommodationId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.accommodation.update({
      where: { id: data.accommodationId },
      data: {
        rating: avgRating._avg.rating || 0,
        reviewCount: avgRating._count,
      },
    });
  }

  if (data.carId) {
    const avgRating = await prisma.review.aggregate({
      where: { carId: data.carId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.car.update({
      where: { id: data.carId },
      data: {
        rating: avgRating._avg.rating || 0,
        reviewCount: avgRating._count,
      },
    });
  }

  if (data.tourGuideId) {
    const avgRating = await prisma.review.aggregate({
      where: { tourGuideId: data.tourGuideId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.tourGuide.update({
      where: { id: data.tourGuideId },
      data: {
        rating: avgRating._avg.rating || 0,
        reviewCount: avgRating._count,
      },
    });
  }

  return review;
}
