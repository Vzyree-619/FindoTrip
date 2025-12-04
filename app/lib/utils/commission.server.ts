import { prisma } from "~/lib/db/db.server";
import { CommissionStatus, PaymentStatus } from "@prisma/client";

export interface CommissionCalculation {
  bookingId: string;
  bookingType: "property" | "vehicle" | "tour";
  serviceId: string;
  providerId: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
}

export interface PayoutRequest {
  providerId: string;
  providerRole: "PROPERTY_OWNER" | "VEHICLE_OWNER" | "TOUR_GUIDE";
  amount: number;
  currency: string;
  paymentMethod: "BANK_TRANSFER" | "PAYPAL" | "STRIPE";
  bankDetails?: any;
}

/**
 * Calculate commission for a booking
 */
export async function calculateCommission(
  bookingId: string,
  bookingType: "property" | "vehicle" | "tour",
  serviceId: string,
  providerId: string,
  totalAmount: number,
  customRate?: number
): Promise<CommissionCalculation> {
  // Get default commission rate (10% for all services)
  const defaultRate = 0.1;
  const commissionRate = customRate || defaultRate;
  const commissionAmount = totalAmount * commissionRate;

  return {
    bookingId,
    bookingType,
    serviceId,
    providerId,
    totalAmount,
    commissionRate,
    commissionAmount,
    currency: "PKR", // Default currency
  };
}

/**
 * Create commission record
 */
export async function createCommission(calculation: CommissionCalculation, propertyOwnerId?: string, vehicleOwnerId?: string, tourGuideId?: string): Promise<void> {
  const commissionData: any = {
    amount: calculation.commissionAmount,
    percentage: calculation.commissionRate * 100,
    currency: calculation.currency,
    status: "PENDING",
    bookingId: calculation.bookingId,
    bookingType: calculation.bookingType,
    serviceId: calculation.serviceId,
    serviceType: calculation.bookingType,
    userId: calculation.providerId,
    calculatedAt: new Date(),
  };
  
  // Link to specific provider model
  if (calculation.bookingType === "property" && propertyOwnerId) {
    commissionData.propertyOwnerId = propertyOwnerId;
  } else if (calculation.bookingType === "vehicle" && vehicleOwnerId) {
    commissionData.vehicleOwnerId = vehicleOwnerId;
  } else if (calculation.bookingType === "tour" && tourGuideId) {
    commissionData.tourGuideId = tourGuideId;
  }
  
  await prisma.commission.create({
    data: commissionData,
  });
}

/**
 * Get commissions for a provider
 */
export async function getProviderCommissions(
  providerId: string,
  status?: CommissionStatus,
  limit: number = 50
) {
  const where: any = { userId: providerId };
  if (status) where.status = status;

  return await prisma.commission.findMany({
    where,
    orderBy: {
      calculatedAt: "desc",
    },
    take: limit,
    include: {
      payout: {
        select: {
          id: true,
          status: true,
          processedAt: true,
        },
      },
    },
  });
}

/**
 * Get commission statistics for a provider
 */
export async function getCommissionStats(providerId: string) {
  const stats = await prisma.commission.aggregate({
    where: { userId: providerId },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const byStatus = await prisma.commission.groupBy({
    by: ["status"],
    where: { userId: providerId },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const totalEarnings = stats._sum.amount || 0;
  const totalCommissions = stats._count.id || 0;

  return {
    totalEarnings,
    totalCommissions,
    byStatus: byStatus.map(item => ({
      status: item.status,
      amount: item._sum.amount || 0,
      count: item._count.id || 0,
    })),
  };
}

/**
 * Create payout request
 */
export async function createPayoutRequest(
  providerId: string,
  providerRole: "PROPERTY_OWNER" | "VEHICLE_OWNER" | "TOUR_GUIDE",
  paymentMethod: "BANK_TRANSFER" | "PAYPAL" | "STRIPE",
  bankDetails?: any
): Promise<string> {
  // Get pending commissions for the provider
  const pendingCommissions = await prisma.commission.findMany({
    where: {
      userId: providerId,
      status: "PENDING",
    },
  });

  if (pendingCommissions.length === 0) {
    throw new Error("No pending commissions to payout");
  }

  const totalAmount = pendingCommissions.reduce((sum, commission) => sum + commission.amount, 0);

  // Create payout record
  const payout = await prisma.payout.create({
    data: {
      amount: totalAmount,
      currency: "PKR",
      status: "PENDING",
      userId: providerId,
      paymentMethod,
      bankDetails,
      requestedAt: new Date(),
    },
  });

  // Update commissions to link with payout
  await prisma.commission.updateMany({
    where: {
      userId: providerId,
      status: "PENDING",
    },
    data: {
      payoutId: payout.id,
    },
  });

  return payout.id;
}

/**
 * Process payout
 */
export async function processPayout(
  payoutId: string,
  transactionId: string,
  status: "COMPLETED" | "FAILED"
): Promise<void> {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error("Payout not found");
  }

  // Update payout status
  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status,
      transactionId,
      processedAt: new Date(),
    },
  });

  if (status === "COMPLETED") {
    // Update commission status to paid
    await prisma.commission.updateMany({
      where: {
        payoutId,
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Create notification for provider
    await prisma.notification.create({
      data: {
        type: "PAYMENT_RECEIVED",
        title: "Payout Processed",
        message: `Your payout of ${payout.currency} ${payout.amount.toFixed(2)} has been processed successfully.`,
        userId: payout.userId,
        userRole: "CUSTOMER", // This should be determined by the actual user role
        actionUrl: "/dashboard/payouts",
        data: {
          payoutId,
          amount: payout.amount,
          currency: payout.currency,
          transactionId,
        },
      },
    });
  }
}

/**
 * Get payout history for a provider
 */
export async function getProviderPayouts(
  providerId: string,
  status?: PaymentStatus,
  limit: number = 50
) {
  const where: any = { userId: providerId };
  if (status) where.status = status;

  return await prisma.payout.findMany({
    where,
    orderBy: {
      requestedAt: "desc",
    },
    take: limit,
    include: {
      commissions: {
        select: {
          id: true,
          amount: true,
          bookingId: true,
          bookingType: true,
        },
      },
    },
  });
}

/**
 * Get payout statistics for a provider
 */
export async function getPayoutStats(providerId: string) {
  const stats = await prisma.payout.aggregate({
    where: { userId: providerId },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const byStatus = await prisma.payout.groupBy({
    by: ["status"],
    where: { userId: providerId },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const totalPayouts = stats._sum.amount || 0;
  const totalCount = stats._count.id || 0;

  return {
    totalPayouts,
    totalCount,
    byStatus: byStatus.map(item => ({
      status: item.status,
      amount: item._sum.amount || 0,
      count: item._count.id || 0,
    })),
  };
}

/**
 * Get all pending payouts (for admin)
 */
export async function getPendingPayouts(limit: number = 100) {
  return await prisma.payout.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "asc",
    },
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      commissions: {
        select: {
          id: true,
          amount: true,
          bookingId: true,
          bookingType: true,
        },
      },
    },
  });
}

/**
 * Get commission analytics for admin
 */
export async function getCommissionAnalytics(
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {};
  if (startDate && endDate) {
    where.calculatedAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const totalCommissions = await prisma.commission.aggregate({
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const byStatus = await prisma.commission.groupBy({
    by: ["status"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const byServiceType = await prisma.commission.groupBy({
    by: ["serviceType"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalAmount: totalCommissions._sum.amount || 0,
    totalCount: totalCommissions._count.id || 0,
    byStatus: byStatus.map(item => ({
      status: item.status,
      amount: item._sum.amount || 0,
      count: item._count.id || 0,
    })),
    byServiceType: byServiceType.map(item => ({
      serviceType: item.serviceType,
      amount: item._sum.amount || 0,
      count: item._count.id || 0,
    })),
  };
}

/**
 * Update commission status
 */
export async function updateCommissionStatus(
  commissionId: string,
  status: CommissionStatus,
  reason?: string
): Promise<void> {
  const updateData: any = { status };
  if (reason) updateData.reason = reason;
  if (status === "PAID") updateData.paidAt = new Date();

  await prisma.commission.update({
    where: { id: commissionId },
    data: updateData,
  });
}

/**
 * Dispute commission
 */
export async function disputeCommission(
  commissionId: string,
  reason: string,
  disputedBy: string
): Promise<void> {
  await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: "DISPUTED",
      reason,
      disputedBy,
      disputedAt: new Date(),
    },
  });
}

/**
 * Resolve commission dispute
 */
export async function resolveCommissionDispute(
  commissionId: string,
  resolution: "APPROVED" | "REJECTED",
  resolvedBy: string,
  notes?: string
): Promise<void> {
  const status = resolution === "APPROVED" ? "PENDING" : "DISPUTED";
  
  await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status,
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes: notes,
    },
  });
}
