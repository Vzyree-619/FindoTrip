import { prisma } from "~/lib/db/db.server";
import { generateAuditHash, sanitizeForLogging } from "../chat-security.server";

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  hash: string;
}

export interface ChatAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'message_sent' | 'message_received' | 'message_edited' | 'message_deleted' | 
          'conversation_created' | 'conversation_deleted' | 'file_uploaded' | 'file_downloaded' |
          'user_blocked' | 'user_unblocked' | 'admin_accessed' | 'abuse_reported' | 'rate_limit_exceeded';
  conversationId?: string;
  messageId?: string;
  targetUserId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  hash: string;
}

/**
 * Log a chat-related audit event
 */
export async function logChatAuditEvent(
  userId: string,
  action: ChatAuditLog['action'],
  details: any,
  options: {
    conversationId?: string;
    messageId?: string;
    targetUserId?: string;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } = {}
): Promise<void> {
  const sanitizedDetails = sanitizeForLogging(details);
  const hash = generateAuditHash(JSON.stringify({
    userId,
    action,
    details: sanitizedDetails,
    timestamp: new Date().toISOString()
  }));

  const auditEntry = {
    userId,
    action,
    conversationId: options.conversationId,
    messageId: options.messageId,
    targetUserId: options.targetUserId,
    details: sanitizedDetails,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    severity: options.severity || 'low',
    hash,
    timestamp: new Date(),
  };

  try {
    await prisma.chatAuditLog.create({
      data: auditEntry,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log a general audit event
 */
export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any,
  options: {
    ipAddress?: string;
    userAgent?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } = {}
): Promise<void> {
  const sanitizedDetails = sanitizeForLogging(details);
  const hash = generateAuditHash(JSON.stringify({
    userId,
    action,
    resourceType,
    resourceId,
    details: sanitizedDetails,
    timestamp: new Date().toISOString()
  }));

  const auditEntry = {
    userId,
    action,
    resourceType,
    resourceId,
    details: sanitizedDetails,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    severity: options.severity || 'low',
    hash,
    timestamp: new Date(),
  };

  try {
    await prisma.auditLog.create({
      data: auditEntry,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    severity?: string;
    limit?: number;
  } = {}
) {
  const where: any = { userId };

  if (options.startDate) {
    where.timestamp = { ...where.timestamp, gte: options.startDate };
  }
  if (options.endDate) {
    where.timestamp = { ...where.timestamp, lte: options.endDate };
  }
  if (options.action) {
    where.action = options.action;
  }
  if (options.severity) {
    where.severity = options.severity;
  }

  return await prisma.chatAuditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc',
    },
    take: options.limit || 100,
  });
}

/**
 * Get audit logs for a specific conversation
 */
export async function getConversationAuditLogs(
  conversationId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    limit?: number;
  } = {}
) {
  const where: any = { conversationId };

  if (options.startDate) {
    where.timestamp = { ...where.timestamp, gte: options.startDate };
  }
  if (options.endDate) {
    where.timestamp = { ...where.timestamp, lte: options.endDate };
  }
  if (options.action) {
    where.action = options.action;
  }

  return await prisma.chatAuditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc',
    },
    take: options.limit || 100,
  });
}

/**
 * Get audit logs for admin review
 */
export async function getAdminAuditLogs(
  options: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    action?: string;
    limit?: number;
  } = {}
) {
  const where: any = {};

  if (options.startDate) {
    where.timestamp = { ...where.timestamp, gte: options.startDate };
  }
  if (options.endDate) {
    where.timestamp = { ...where.timestamp, lte: options.endDate };
  }
  if (options.severity) {
    where.severity = options.severity;
  }
  if (options.action) {
    where.action = options.action;
  }

  return await prisma.chatAuditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: options.limit || 1000,
  });
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {};
  if (startDate) {
    where.timestamp = { ...where.timestamp, gte: startDate };
  }
  if (endDate) {
    where.timestamp = { ...where.timestamp, lte: endDate };
  }

  const [
    totalEvents,
    eventsByAction,
    eventsBySeverity,
    eventsByUser,
    recentEvents
  ] = await Promise.all([
    prisma.chatAuditLog.count({ where }),
    prisma.chatAuditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    }),
    prisma.chatAuditLog.groupBy({
      by: ['severity'],
      where,
      _count: { severity: true },
    }),
    prisma.chatAuditLog.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
    }),
    prisma.chatAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totalEvents,
    eventsByAction,
    eventsBySeverity,
    eventsByUser,
    recentEvents,
  };
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(
  query: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    action?: string;
    limit?: number;
  } = {}
) {
  const where: any = {
    OR: [
      { action: { contains: query, mode: 'insensitive' } },
      { details: { path: '$', string_contains: query } },
      { user: { name: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (options.startDate) {
    where.timestamp = { ...where.timestamp, gte: options.startDate };
  }
  if (options.endDate) {
    where.timestamp = { ...where.timestamp, lte: options.endDate };
  }
  if (options.severity) {
    where.severity = options.severity;
  }
  if (options.action) {
    where.action = options.action;
  }

  return await prisma.chatAuditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: options.limit || 100,
  });
}

/**
 * Export audit logs for compliance
 */
export async function exportAuditLogs(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { userId };
  if (startDate) {
    where.timestamp = { ...where.timestamp, gte: startDate };
  }
  if (endDate) {
    where.timestamp = { ...where.timestamp, lte: options.endDate };
  }

  const logs = await prisma.chatAuditLog.findMany({
    where,
    orderBy: {
      timestamp: 'asc',
    },
  });

  return {
    userId,
    exportDate: new Date().toISOString(),
    totalLogs: logs.length,
    dateRange: {
      start: startDate?.toISOString(),
      end: endDate?.toISOString(),
    },
    logs: logs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      conversationId: log.conversationId,
      messageId: log.messageId,
      targetUserId: log.targetUserId,
      details: log.details,
      severity: log.severity,
      hash: log.hash,
    })),
  };
}

/**
 * Clean up old audit logs (data retention)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.chatAuditLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Verify audit log integrity
 */
export async function verifyAuditLogIntegrity() {
  const logs = await prisma.chatAuditLog.findMany({
    take: 1000,
  });

  const invalidLogs = [];

  for (const log of logs) {
    const expectedHash = generateAuditHash(JSON.stringify({
      userId: log.userId,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp.toISOString()
    }));

    if (log.hash !== expectedHash) {
      invalidLogs.push({
        id: log.id,
        expectedHash,
        actualHash: log.hash,
      });
    }
  }

  return {
    totalChecked: logs.length,
    invalidLogs: invalidLogs.length,
    invalidLogDetails: invalidLogs,
  };
}
