import { prisma } from "~/lib/db/db.server";
import { generateAuditHash, sanitizeForLogging } from "~/lib/chat-security.server";

export type AuditAction = 
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_EDITED'
  | 'MESSAGE_DELETED'
  | 'CONVERSATION_CREATED'
  | 'CONVERSATION_DELETED'
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'ADMIN_ACCESSED_CONVERSATION'
  | 'MESSAGE_REPORTED'
  | 'USER_WARNED'
  | 'USER_SUSPENDED'
  | 'USER_BANNED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SECURITY_VIOLATION'
  | 'PRIVACY_SETTINGS_CHANGED';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  userId: string;
  targetUserId?: string;
  conversationId?: string;
  messageId?: string;
  details: Record<string, any>;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  hash: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash'>): Promise<string> {
  const timestamp = new Date();
  const sanitizedDetails = sanitizeForLogging(entry.details);
  const hash = generateAuditHash(JSON.stringify({
    action: entry.action,
    userId: entry.userId,
    details: sanitizedDetails,
    timestamp: timestamp.toISOString()
  }));

  try {
    const auditLog = await prisma.chatAuditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        targetUserId: entry.targetUserId,
        conversationId: entry.conversationId,
        messageId: entry.messageId,
        details: JSON.stringify(sanitizedDetails),
        severity: entry.severity,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        hash,
        createdAt: timestamp
      }
    });

    return auditLog.id;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
    return '';
  }
}

/**
 * Log message sent event
 */
export async function logMessageSent(
  userId: string,
  conversationId: string,
  messageId: string,
  content: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    action: 'MESSAGE_SENT',
    userId,
    conversationId,
    messageId,
    details: {
      contentLength: content.length,
      contentPreview: content.slice(0, 50),
      hasAttachments: false // TODO: check for attachments
    },
    severity: 'low',
    ipAddress
  });
}

/**
 * Log message received event
 */
export async function logMessageReceived(
  userId: string,
  conversationId: string,
  messageId: string,
  senderId: string
): Promise<void> {
  await createAuditLog({
    action: 'MESSAGE_RECEIVED',
    userId,
    targetUserId: senderId,
    conversationId,
    messageId,
    details: {
      receivedAt: new Date().toISOString()
    },
    severity: 'low'
  });
}

/**
 * Log file upload event
 */
export async function logFileUpload(
  userId: string,
  conversationId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    action: 'FILE_UPLOADED',
    userId,
    conversationId,
    details: {
      fileName: fileName.replace(/[^a-zA-Z0-9.-]/g, '_'), // Sanitize filename
      fileSize,
      fileType,
      uploadedAt: new Date().toISOString()
    },
    severity: 'medium',
    ipAddress
  });
}

/**
 * Log user blocking event
 */
export async function logUserBlocked(
  blockerId: string,
  blockedId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    action: 'USER_BLOCKED',
    userId: blockerId,
    targetUserId: blockedId,
    details: {
      reason,
      blockedAt: new Date().toISOString()
    },
    severity: 'medium',
    ipAddress
  });
}

/**
 * Log admin accessing conversation
 */
export async function logAdminAccess(
  adminId: string,
  conversationId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    action: 'ADMIN_ACCESSED_CONVERSATION',
    userId: adminId,
    conversationId,
    details: {
      reason,
      accessedAt: new Date().toISOString()
    },
    severity: 'high',
    ipAddress
  });
}

/**
 * Log message report
 */
export async function logMessageReport(
  reporterId: string,
  messageId: string,
  conversationId: string,
  reason: string,
  details?: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    action: 'MESSAGE_REPORTED',
    userId: reporterId,
    conversationId,
    messageId,
    details: {
      reason,
      reportDetails: details,
      reportedAt: new Date().toISOString()
    },
    severity: 'high',
    ipAddress
  });
}

/**
 * Log security violation
 */
export async function logSecurityViolation(
  userId: string,
  violationType: string,
  details: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    action: 'SECURITY_VIOLATION',
    userId,
    details: {
      violationType,
      ...details,
      detectedAt: new Date().toISOString()
    },
    severity: 'critical',
    ipAddress
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.chatAuditLog.findMany({
      where: {
        OR: [
          { userId },
          { targetUserId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action as AuditAction,
      userId: log.userId,
      targetUserId: log.targetUserId || undefined,
      conversationId: log.conversationId || undefined,
      messageId: log.messageId || undefined,
      details: JSON.parse(log.details || '{}'),
      severity: log.severity as AuditSeverity,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      timestamp: log.createdAt,
      hash: log.hash
    }));
  } catch (error) {
    console.error('Failed to get user audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a conversation
 */
export async function getConversationAuditLogs(
  conversationId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.chatAuditLog.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action as AuditAction,
      userId: log.userId,
      targetUserId: log.targetUserId || undefined,
      conversationId: log.conversationId || undefined,
      messageId: log.messageId || undefined,
      details: JSON.parse(log.details || '{}'),
      severity: log.severity as AuditSeverity,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      timestamp: log.createdAt,
      hash: log.hash
    }));
  } catch (error) {
    console.error('Failed to get conversation audit logs:', error);
    return [];
  }
}

/**
 * Get security violations for admin review
 */
export async function getSecurityViolations(
  severity?: AuditSeverity,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  try {
    const where: any = {
      action: {
        in: ['SECURITY_VIOLATION', 'RATE_LIMIT_EXCEEDED', 'MESSAGE_REPORTED']
      }
    };

    if (severity) {
      where.severity = severity;
    }

    const logs = await prisma.chatAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action as AuditAction,
      userId: log.userId,
      targetUserId: log.targetUserId || undefined,
      conversationId: log.conversationId || undefined,
      messageId: log.messageId || undefined,
      details: {
        ...JSON.parse(log.details || '{}'),
        user: log.user
      },
      severity: log.severity as AuditSeverity,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      timestamp: log.createdAt,
      hash: log.hash
    }));
  } catch (error) {
    console.error('Failed to get security violations:', error);
    return [];
  }
}

/**
 * Verify audit log integrity
 */
export async function verifyAuditLogIntegrity(logId: string): Promise<boolean> {
  try {
    const log = await prisma.chatAuditLog.findUnique({
      where: { id: logId }
    });

    if (!log) return false;

    const expectedHash = generateAuditHash(JSON.stringify({
      action: log.action,
      userId: log.userId,
      details: JSON.parse(log.details || '{}'),
      timestamp: log.createdAt.toISOString()
    }));

    return log.hash === expectedHash;
  } catch (error) {
    console.error('Failed to verify audit log integrity:', error);
    return false;
  }
}

/**
 * Clean up old audit logs (for GDPR compliance)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.chatAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        severity: {
          in: ['low', 'medium'] // Keep high and critical logs longer
        }
      }
    });

    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old audit logs:', error);
    return 0;
  }
}
