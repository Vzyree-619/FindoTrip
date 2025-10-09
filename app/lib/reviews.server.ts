import { prisma } from "~/lib/db/db.server";
import { sendEmail } from "~/lib/email/email.server";

export type ServiceKind = "property" | "vehicle" | "tour";
export type BookingKind = "property" | "vehicle" | "tour";

interface CreateReviewInput {
  userId: string;
  bookingId: string;
  bookingType: BookingKind;
  serviceId: string;
  serviceType: ServiceKind;
  rating: number; // 1..5
  title?: string;
  comment: string;
  images?: string[]; // URLs
  // Optional category ratings
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  serviceRating?: number;
  pros?: string[];
  cons?: string[];
}

function nowPk(): Date { return new Date(); }

export async function getBookingsPendingReview(userId: string) {
  // Sanitize any legacy reviews with null reviewerName to avoid schema decode errors
  try {
    await prisma.review.updateMany({ where: { reviewerName: null as any }, data: { reviewerName: "Anonymous" } });
  } catch {}
  const now = nowPk();

  // Property bookings pending review
  const propertyBookings = await prisma.propertyBooking.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "CONFIRMED"] },
      OR: [
        { status: "COMPLETED" },
        { checkOut: { lt: now } },
      ],
    },
    include: {
      property: {
        select: { id: true, name: true, city: true, country: true, images: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Vehicle bookings pending review
  const vehicleBookings = await prisma.vehicleBooking.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "CONFIRMED"] },
      OR: [
        { status: "COMPLETED" },
        { endDate: { lt: now } },
      ],
    },
    include: {
      vehicle: {
        select: { id: true, name: true, city: true, country: true, images: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Tour bookings pending review
  const tourBookings = await prisma.tourBooking.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "CONFIRMED"] },
      OR: [
        { status: "COMPLETED" },
        { tourDate: { lt: now } },
      ],
    },
    include: {
      tour: {
        select: { id: true, title: true, city: true, country: true, images: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Filter out bookings that already have a review by this user
  const bookingIds = [
    ...propertyBookings.map((b) => b.id),
    ...vehicleBookings.map((b) => b.id),
    ...tourBookings.map((b) => b.id),
  ];

  const existingForBookings = await prisma.review.findMany({
    where: { userId, bookingId: { in: bookingIds } },
    select: { bookingId: true },
  });
  const reviewedBookingIdSet = new Set(existingForBookings.map((r) => r.bookingId));

  return {
    property: propertyBookings.filter((b) => !reviewedBookingIdSet.has(b.id)),
    vehicle: vehicleBookings.filter((b) => !reviewedBookingIdSet.has(b.id)),
    tour: tourBookings.filter((b) => !reviewedBookingIdSet.has(b.id)),
  };
}

export async function getUserReviews(userId: string) {
  // Sanitize any legacy reviews with null reviewerName
  try {
    await prisma.review.updateMany({ where: { reviewerName: null as any }, data: { reviewerName: "Anonymous" } });
  } catch {}
  return prisma.review.findMany({
    where: { userId },
    include: {
      property: { select: { id: true, name: true, city: true, country: true, images: true } },
      vehicle: { select: { id: true, name: true, city: true, country: true, images: true } },
      tour: { select: { id: true, title: true, city: true, country: true, images: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getServiceReviews(serviceType: ServiceKind, serviceId: string, take = 10, skip = 0) {
  return prisma.review.findMany({
    where: { serviceType, serviceId },
    include: {
      user: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export async function getServiceRatingSummary(serviceType: ServiceKind, serviceId: string) {
  const [avgAgg, counts] = await Promise.all([
    prisma.review.aggregate({ where: { serviceType, serviceId }, _avg: { rating: true }, _count: { _all: true } } as any),
    prisma.review.groupBy({
      by: ["rating"],
      where: { serviceType, serviceId },
      _count: { _all: true },
    } as any),
  ]);
  const total = (avgAgg as any)._count?._all ?? 0;
  const average = (avgAgg as any)._avg?.rating ?? 0;
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of counts as any[]) {
    breakdown[c.rating] = c._count._all;
  }
  return { total, average, breakdown };
}

async function recalcServiceRating(serviceType: ServiceKind, serviceId: string) {
  // Use Prisma aggregate to compute average and count
  const agg = await prisma.review.aggregate({
    where: { serviceType, serviceId },
    _avg: { rating: true },
    _count: { _all: true },
  } as any);

  const avg = (agg as any)._avg?.rating ?? 0;
  const count = (agg as any)._count?._all ?? 0;

  if (serviceType === "property") {
    await prisma.property.update({ where: { id: serviceId }, data: { rating: avg || 0, reviewCount: count } });
    // Also update property owner average if needed
    const prop = await prisma.property.findUnique({ where: { id: serviceId }, select: { ownerId: true } });
    if (prop?.ownerId) {
      const ownerProps = await prisma.property.findMany({ where: { ownerId: prop.ownerId }, select: { rating: true, reviewCount: true } });
      const totalReviews = ownerProps.reduce((s, p) => s + (p.reviewCount || 0), 0);
      const average = totalReviews > 0 ? ownerProps.reduce((s, p) => s + (p.rating || 0) * (p.reviewCount || 0), 0) / totalReviews : 0;
      await prisma.propertyOwner.update({ where: { id: prop.ownerId }, data: { averageRating: average } });
    }
  } else if (serviceType === "vehicle") {
    await prisma.vehicle.update({ where: { id: serviceId }, data: { rating: avg || 0, reviewCount: count } });
    const veh = await prisma.vehicle.findUnique({ where: { id: serviceId }, select: { ownerId: true } });
    if (veh?.ownerId) {
      const ownerVehs = await prisma.vehicle.findMany({ where: { ownerId: veh.ownerId }, select: { rating: true, reviewCount: true } });
      const totalReviews = ownerVehs.reduce((s, v) => s + (v.reviewCount || 0), 0);
      const average = totalReviews > 0 ? ownerVehs.reduce((s, v) => s + (v.rating || 0) * (v.reviewCount || 0), 0) / totalReviews : 0;
      await prisma.vehicleOwner.update({ where: { id: veh.ownerId }, data: { averageRating: average } });
    }
  } else if (serviceType === "tour") {
    await prisma.tour.update({ where: { id: serviceId }, data: { rating: avg || 0, reviewCount: count } });
    const tour = await prisma.tour.findUnique({ where: { id: serviceId }, select: { guideId: true } });
    if (tour?.guideId) {
      const guideTours = await prisma.tour.findMany({ where: { guideId: tour.guideId }, select: { rating: true, reviewCount: true } });
      const totalReviews = guideTours.reduce((s, t) => s + (t.reviewCount || 0), 0);
      const average = totalReviews > 0 ? guideTours.reduce((s, t) => s + (t.rating || 0) * (t.reviewCount || 0), 0) / totalReviews : 0;
      await prisma.tourGuide.update({ where: { id: tour.guideId }, data: { averageRating: average } });
    }
  }
}

export async function createReview(input: CreateReviewInput) {
  // Validate basic inputs
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Ensure booking belongs to user and exists
  let booking: any = null;
  if (input.bookingType === "property") {
    booking = await prisma.propertyBooking.findFirst({ where: { id: input.bookingId, userId: input.userId }, include: { property: { select: { owner: { select: { userId: true } } } } } });
  } else if (input.bookingType === "vehicle") {
    booking = await prisma.vehicleBooking.findFirst({ where: { id: input.bookingId, userId: input.userId }, include: { vehicle: { select: { owner: { select: { userId: true } } } } } });
  } else if (input.bookingType === "tour") {
    booking = await prisma.tourBooking.findFirst({ where: { id: input.bookingId, userId: input.userId }, include: { tour: { select: { guide: { select: { userId: true } } } } } });
  }

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Prevent duplicate reviews for the same booking by same user
  const existing = await prisma.review.findFirst({ where: { userId: input.userId, bookingId: input.bookingId } });
  if (existing) {
    throw new Error("You have already reviewed this booking");
  }

  // Determine verification: completed OR past date
  const isVerified = (() => {
    if (input.bookingType === "property") return booking.status === "COMPLETED" || booking.checkOut < nowPk();
    if (input.bookingType === "vehicle") return booking.status === "COMPLETED" || booking.endDate < nowPk();
    if (input.bookingType === "tour") return booking.status === "COMPLETED" || booking.tourDate < nowPk();
    return false;
  })();

  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { name: true, avatar: true } });

  const review = await prisma.review.create({
    data: {
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      cleanlinessRating: input.cleanlinessRating,
      accuracyRating: input.accuracyRating,
      communicationRating: input.communicationRating,
      locationRating: input.locationRating,
      valueRating: input.valueRating,
      serviceRating: input.serviceRating,
      pros: input.pros || [],
      cons: input.cons || [],
      images: input.images || [],
      verified: isVerified,
      userId: input.userId,
      reviewerName: user?.name || "Anonymous",
      reviewerAvatar: user?.avatar || null,
      stayDuration: input.bookingType === "property" && booking ? Math.max(1, Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))) : null,
      tripType: undefined,
      bookingId: input.bookingId,
      bookingType: input.bookingType,
      serviceId: input.serviceId,
      serviceType: input.serviceType,
    },
  });

  // Recalculate service rating + count
  await recalcServiceRating(input.serviceType, input.serviceId);

  // Create analytics event
  await prisma.analytics.create({
    data: {
      type: "review",
      entity: input.serviceType,
      entityId: input.serviceId,
      value: input.rating,
      metadata: { bookingId: input.bookingId, bookingType: input.bookingType },
      date: nowPk(),
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  // Notify provider
  let providerUserId: string | null = null;
  if (input.serviceType === "property") {
    const prop = await prisma.property.findUnique({ where: { id: input.serviceId }, select: { owner: { select: { userId: true } }, name: true } });
    providerUserId = prop?.owner?.userId || null;
    if (providerUserId) {
      await prisma.notification.create({
        data: {
          userId: providerUserId,
          userRole: "PROPERTY_OWNER" as any,
          type: "REVIEW_RECEIVED" as any,
          title: "New review received",
          message: `Your property ${prop?.name || ""} received a new review (${input.rating}/5)` ,
          data: { serviceType: input.serviceType, serviceId: input.serviceId, reviewId: review.id },
        },
      });
    }
  } else if (input.serviceType === "vehicle") {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.serviceId }, select: { owner: { select: { userId: true } }, name: true } });
    providerUserId = vehicle?.owner?.userId || null;
    if (providerUserId) {
      await prisma.notification.create({
        data: {
          userId: providerUserId,
          userRole: "VEHICLE_OWNER" as any,
          type: "REVIEW_RECEIVED" as any,
          title: "New review received",
          message: `Your vehicle ${vehicle?.name || ""} received a new review (${input.rating}/5)` ,
          data: { serviceType: input.serviceType, serviceId: input.serviceId, reviewId: review.id },
        },
      });
    }
  } else if (input.serviceType === "tour") {
    const tour = await prisma.tour.findUnique({ where: { id: input.serviceId }, select: { guide: { select: { userId: true } }, title: true } });
    providerUserId = tour?.guide?.userId || null;
    if (providerUserId) {
      await prisma.notification.create({
        data: {
          userId: providerUserId,
          userRole: "TOUR_GUIDE" as any,
          type: "REVIEW_RECEIVED" as any,
          title: "New review received",
          message: `Your tour ${tour?.title || ""} received a new review (${input.rating}/5)` ,
          data: { serviceType: input.serviceType, serviceId: input.serviceId, reviewId: review.id },
        },
      });
    }
  }

  // Send email notification (provider)
  try {
    if (providerUserId) {
      await sendEmail({
        to: "provider@example.com", // Replace with provider's email if available
        subject: "You received a new review on FindoTrip",
        html: `<p>You received a new review (${input.rating}/5). Visit your dashboard to view details.</p>`,
      });
    }
  } catch (e) {
    console.warn("Email send failed (provider new review)", e);
  }

  return review;
}

export async function replyToReview(reviewId: string, providerUserId: string, ownerResponse: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { ownerResponse, ownerResponseAt: nowPk() },
  });
  return review;
}

export async function flagReview(reviewId: string, flagReason: string) {
  return prisma.review.update({ where: { id: reviewId }, data: { flagged: true, flagReason } });
}

export async function moderateReview(reviewId: string, moderatedBy: string, remove: boolean) {
  if (remove) {
    // Soft approach: mark as moderated/flagged and hide (could also delete)
    return prisma.review.update({ where: { id: reviewId }, data: { flagged: true, moderatedBy, moderatedAt: nowPk() } });
  }
  return prisma.review.update({ where: { id: reviewId }, data: { flagged: false, flagReason: null, moderatedBy, moderatedAt: nowPk() } });
}

export async function deleteUserReview(reviewId: string, userId: string) {
  // Ensure the review belongs to the user
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!review) {
    throw new Error("Review not found");
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // Recalculate the service rating after deletion
  await recalcServiceRating(review.serviceType as ServiceKind, review.serviceId);

  return { success: true };
}

export async function sendReviewInviteForBooking(bookingType: BookingKind, bookingId: string, appUrl: string) {
  // Load booking + user + service name for email
  if (bookingType === "property") {
    const b = await prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: { user: true, property: true },
    });
    if (!b || !b.user || !b.property) return;
    const url = `${appUrl}/reviews/new?bookingId=${b.id}&type=property`;
    await sendEmail({
      to: b.user.email,
      subject: `How was your stay at ${b.property.name}?`,
      html: `<p>Hi ${b.user.name}, please review your recent stay at <strong>${b.property.name}</strong>.</p><p><a href="${url}">Write a review</a></p>`
    });
  } else if (bookingType === "vehicle") {
    const b = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
      include: { user: true, vehicle: true },
    });
    if (!b || !b.user || !b.vehicle) return;
    const url = `${appUrl}/reviews/new?bookingId=${b.id}&type=vehicle`;
    await sendEmail({
      to: b.user.email,
      subject: `How was your rental ${b.vehicle.name}?`,
      html: `<p>Hi ${b.user.name}, please review your recent rental <strong>${b.vehicle.name}</strong>.</p><p><a href="${url}">Write a review</a></p>`
    });
  } else if (bookingType === "tour") {
    const b = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: { user: true, tour: true },
    });
    if (!b || !b.user || !b.tour) return;
    const url = `${appUrl}/reviews/new?bookingId=${b.id}&type=tour`;
    await sendEmail({
      to: b.user.email,
      subject: `How was your tour ${b.tour.title}?`,
      html: `<p>Hi ${b.user.name}, please review your recent tour <strong>${b.tour.title}</strong>.</p><p><a href="${url}">Write a review</a></p>`
    });
  }
}
