import DOMPurify from 'isomorphic-dompurify';
import { createHash, randomBytes } from 'crypto';

// Security configuration
const SECURITY_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  RATE_LIMITS: {
    MESSAGES_PER_MINUTE: 30,
    CONVERSATIONS_PER_HOUR: 10,
    FILE_UPLOADS_PER_MINUTE: 5,
    API_CALLS_PER_MINUTE: 100,
    FAILED_LOGINS_BEFORE_LOCK: 5
  }
};

// Profanity filter (basic implementation)
const PROFANITY_WORDS = [
  'spam', 'scam', 'hack', 'phishing', 'malware', 'virus'
  // Add more as needed
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b.*\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Multiple emails
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g, // URLs
  /(?:bitcoin|btc|crypto|wallet|send money|wire transfer)/i, // Financial scams
  /(?:click here|urgent|act now|limited time|free money)/i // Phishing attempts
];

/**
 * Sanitize message content to prevent XSS and other attacks
 */
export function sanitizeMessage(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Check message length
  if (content.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
    throw new Error(`Message too long. Maximum ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} characters allowed.`);
  }

  // Remove HTML tags and sanitize
  let sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Validate and clean URLs
  sanitized = sanitizeUrls(sanitized);

  // Check for suspicious patterns
  const warnings = detectSuspiciousPatterns(sanitized);
  if (warnings.length > 0) {
    console.warn('Suspicious patterns detected:', warnings);
  }

  // Check for profanity
  const profanityDetected = detectProfanity(sanitized);
  if (profanityDetected.length > 0) {
    console.warn('Profanity detected:', profanityDetected);
  }

  return sanitized.trim();
}

/**
 * Sanitize URLs in message content
 */
function sanitizeUrls(content: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(urlRegex, (url) => {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return '[BLOCKED URL]';
      }
      // Block suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link'];
      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        return '[BLOCKED URL]';
      }
      return url;
    } catch {
      return '[INVALID URL]';
    }
  });
}

/**
 * Detect suspicious patterns in message content
 */
function detectSuspiciousPatterns(content: string): string[] {
  const warnings: string[] = [];
  
  SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      warnings.push(`Suspicious pattern ${index + 1} detected`);
    }
  });

  return warnings;
}

/**
 * Detect profanity in message content
 */
function detectProfanity(content: string): string[] {
  const detected: string[] = [];
  const lowerContent = content.toLowerCase();
  
  PROFANITY_WORDS.forEach(word => {
    if (lowerContent.includes(word.toLowerCase())) {
      detected.push(word);
    }
  });

  return detected;
}

/**
 * Validate file upload security
 */
export async function validateAndUploadFile(
  file: File, 
  userId: string,
  conversationId: string
): Promise<{ url: string; filename: string; size: number }> {
  // Check file type
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }

  // Check file size
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB allowed`);
  }

  // Generate unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${userId}_${conversationId}_${Date.now()}_${randomBytes(8).toString('hex')}.${fileExtension}`;

  // TODO: Implement actual file upload to secure storage
  // For now, return a mock secure URL
  const secureUrl = `/api/secure-files/${uniqueFilename}`;

  // TODO: Implement malware scanning
  // await scanFileForMalware(file);

  // TODO: Strip EXIF data from images
  // if (file.type.startsWith('image/')) {
  //   await stripExifData(file);
  // }

  return {
    url: secureUrl,
    filename: uniqueFilename,
    size: file.size
  };
}

/**
 * Check for spam patterns
 */
export function detectSpam(messages: string[], userId: string): boolean {
  // Check for repeated messages
  if (messages.length >= 3) {
    const lastThree = messages.slice(-3);
    if (lastThree.every(msg => msg === lastThree[0])) {
      return true;
    }
  }

  // Check for excessive identical content
  const messageCounts = new Map<string, number>();
  messages.forEach(msg => {
    const count = messageCounts.get(msg) || 0;
    messageCounts.set(msg, count + 1);
  });

  for (const [msg, count] of messageCounts) {
    if (count > 5) {
      return true;
    }
  }

  return false;
}

/**
 * Generate secure hash for audit logging
 */
export function generateAuditHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt sensitive data
 */
export function encryptSensitiveData(data: string): string {
  // TODO: Implement proper encryption
  // For now, return base64 encoded data
  return Buffer.from(data).toString('base64');
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(encryptedData: string): string {
  // TODO: Implement proper decryption
  // For now, decode base64
  return Buffer.from(encryptedData, 'base64').toString();
}

/**
 * Validate user input for security
 */
export function validateUserInput(input: any): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  // TODO: Implement database check for blocked users
  // This would check a UserBlock table
  return false;
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  userId: string,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId,
    details,
    severity,
    hash: generateAuditHash(JSON.stringify({ event, userId, details }))
  };

  // TODO: Implement proper logging to database
  console.log('Security Event:', logEntry);
}

/**
 * Check rate limits
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // TODO: Implement Redis-based rate limiting
  // For now, return allowed
  return {
    allowed: true,
    remaining: limit,
    resetTime: Date.now() + windowMs
  };
}

/**
 * Sanitize user data for logging
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data === 'string') {
    // Remove sensitive patterns
    return data
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForLogging(value);
    }
    return sanitized;
  }

  return data;
}
