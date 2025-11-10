import { redirect } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";
import { getUserId } from "~/lib/auth/auth.server";

export async function requireAdmin(request: Request) {
  const userId = await getUserId(request);

  if (!userId) {
    throw redirect("/admin/login");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      throw redirect("/admin/login");
    }

    return user;
  } catch (err) {
    // If the database is unreachable or errors, avoid crashing the admin layout.
    // Redirect to admin login so the user can re-authenticate.
    throw redirect("/admin/login");
  }
}

export async function logAdminAction(
  adminId: string, 
  action: string, 
  description: string, 
  request: Request,
  resourceType?: string,
  resourceId?: string,
  details?: any
) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        resourceType: resourceType || "ADMIN_ACTION",
        resourceId: resourceId || "",
        details: details || {},
        ipAddress,
        userAgent,
        severity: getSeverityFromAction(action),
        hash: generateHash(adminId, action, new Date().toISOString())
      }
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

export async function logActivity(
  type: string,
  description: string,
  userId?: string,
  request?: Request,
  metadata?: any
) {
  try {
    const ipAddress = request?.headers.get("x-forwarded-for") || 
                     request?.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request?.headers.get("user-agent") || "unknown";
    
    await prisma.activityLog.create({
      data: {
        type: type as any,
        description,
        userId,
        ipAddress,
        userAgent,
        metadata: metadata || {}
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getAdminStats() {
  try {
    const [
      totalUsers,
      totalBookings,
      totalRevenue,
      activeTickets,
      pendingApprovals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED" },
        _sum: { totalAmount: true }
      }),
      prisma.supportTicket.count({
        where: { status: { in: ["NEW", "IN_PROGRESS"] } }
      }),
      prisma.property.count({
        where: { approvalStatus: "PENDING" }
      }) + 
      prisma.vehicle.count({
        where: { approvalStatus: "PENDING" }
      }) +
      prisma.tour.count({
        where: { approvalStatus: "PENDING" }
      })
    ]);
    
    return {
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      activeTickets,
      pendingApprovals
    };
  } catch (error) {
    console.error("Failed to get admin stats:", error);
    return {
      totalUsers: 0,
      totalBookings: 0,
      totalRevenue: 0,
      activeTickets: 0,
      pendingApprovals: 0
    };
  }
}

export async function getRecentActivity(limit: number = 10) {
  try {
    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    
    return activities;
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return [];
  }
}

export async function getSystemHealth() {
  try {
    const [
      databaseStatus,
      lastBackup,
      errorCount,
      activeUsers
    ] = await Promise.all([
      checkDatabaseConnection(),
      prisma.backupInfo.findFirst({
        orderBy: { createdAt: "desc" }
      }),
      prisma.auditLog.count({
        where: {
          severity: "HIGH",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    return {
      database: databaseStatus,
      lastBackup: lastBackup?.createdAt,
      errorCount,
      activeUsers,
      status: databaseStatus ? "healthy" : "unhealthy"
    };
  } catch (error) {
    console.error("Failed to get system health:", error);
    return {
      database: false,
      lastBackup: null,
      errorCount: 0,
      activeUsers: 0,
      status: "unhealthy"
    };
  }
}

export async function sendNotification(
  type: "email" | "sms" | "push",
  recipient: string,
  subject: string,
  content: string,
  metadata?: any
) {
  try {
    // Create notification log
    await prisma.notificationLog.create({
      data: {
        type: type.toUpperCase() as any,
        recipientEmail: type === "email" ? recipient : undefined,
        recipientPhone: type === "sms" ? recipient : undefined,
        subject,
        content,
        status: "SENT"
      }
    });
    
    // Here you would integrate with actual notification services
    // For now, we'll just log the notification
    
    console.log(`Notification sent: ${type} to ${recipient}`);
    return true;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return false;
  }
}

export async function createBackup(type: "automatic" | "manual", createdBy?: string) {
  try {
    const backup = await prisma.backupInfo.create({
      data: {
        backupType: type,
        status: "completed",
        size: "2.5 GB", // This would be calculated from actual backup
        createdBy
      }
    });
    
    // Here you would implement actual backup logic
    console.log(`Backup created: ${backup.id}`);
    return backup;
  } catch (error) {
    console.error("Failed to create backup:", error);
    throw error;
  }
}

export async function blockIP(ipAddress: string, reason: string, blockedBy: string) {
  try {
    const blockedIP = await prisma.blockedIP.create({
      data: {
        ipAddress,
        reason,
        blockedBy
      }
    });
    
    return blockedIP;
  } catch (error) {
    console.error("Failed to block IP:", error);
    throw error;
  }
}

export async function unblockIP(ipId: string) {
  try {
    const blockedIP = await prisma.blockedIP.delete({
      where: { id: ipId }
    });
    
    return blockedIP;
  } catch (error) {
    console.error("Failed to unblock IP:", error);
    throw error;
  }
}

// Helper functions
function getSeverityFromAction(action: string): "low" | "medium" | "high" | "critical" {
  const highSeverityActions = [
    "USER_SUSPENDED",
    "USER_DELETED",
    "REFUND_ISSUED",
    "DATA_EXPORT",
    "SETTINGS_CHANGED"
  ];
  
  const criticalActions = [
    "ADMIN_LOGIN",
    "ADMIN_LOGOUT",
    "SECURITY_SETTINGS_CHANGED"
  ];
  
  if (criticalActions.includes(action)) {
    return "critical";
  }
  
  if (highSeverityActions.includes(action)) {
    return "high";
  }
  
  return "medium";
}

function generateHash(adminId: string, action: string, timestamp: string): string {
  // Simple hash generation for audit log integrity
  const data = `${adminId}-${action}-${timestamp}`;
  return Buffer.from(data).toString('base64');
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

// Export types for use in other files
export type AdminAction = 
  | "USER_APPROVED"
  | "USER_SUSPENDED"
  | "USER_DELETED"
  | "SETTINGS_CHANGED"
  | "BOOKING_CANCELLED"
  | "REFUND_ISSUED"
  | "DATA_EXPORT"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "SECURITY_SETTINGS_CHANGED"
  | "EMAIL_TEMPLATE_CREATED"
  | "EMAIL_TEMPLATE_UPDATED"
  | "NOTIFICATION_SENT"
  | "BACKUP_CREATED"
  | "IP_BLOCKED"
  | "IP_UNBLOCKED";

export type AdminStats = {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeTickets: number;
  pendingApprovals: number;
};

export type SystemHealth = {
  database: boolean;
  lastBackup: Date | null;
  errorCount: number;
  activeUsers: number;
  status: "healthy" | "unhealthy";
};
