import { Redis } from 'ioredis';
import { logSecurityEvent } from '../chat-security.server';

// Rate limit configuration
const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 30,
  CONVERSATIONS_PER_HOUR: 10,
  FILE_UPLOADS_PER_MINUTE: 5,
  API_CALLS_PER_MINUTE: 100,
  FAILED_LOGINS_BEFORE_LOCK: 5,
  LOGIN_ATTEMPTS_WINDOW: 15 * 60 * 1000, // 15 minutes
  MESSAGE_WINDOW: 60 * 1000, // 1 minute
  CONVERSATION_WINDOW: 60 * 60 * 1000, // 1 hour
  FILE_UPLOAD_WINDOW: 60 * 1000, // 1 minute
  API_WINDOW: 60 * 1000, // 1 minute
};

// Redis client (you'll need to configure this)
// Disabled until Redis is properly configured - using in-memory fallback
let redis: Redis | null = null;

// Uncomment below to enable Redis when it's set up:
// try {
//   redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// } catch (error) {
//   console.warn('Redis not available, using in-memory rate limiting');
// }

// In-memory fallback for rate limiting
const memoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a specific action
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `rate_limit:${userId}:${action}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  try {
    if (redis) {
      return await checkRateLimitRedis(key, limit, windowMs, now, resetTime);
    } else {
      return checkRateLimitMemory(key, limit, windowMs, now, resetTime);
    }
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow the request
    return {
      allowed: true,
      remaining: limit,
      resetTime: now + windowMs
    };
  }
}

/**
 * Redis-based rate limiting
 */
async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
  resetTime: number
): Promise<RateLimitResult> {
  if (!redis) throw new Error('Redis not available');

  const pipeline = redis.pipeline();
  
  // Increment counter
  pipeline.incr(key);
  
  // Set expiration on first increment
  pipeline.expire(key, Math.ceil(windowMs / 1000));
  
  // Get current count
  pipeline.get(key);
  
  const results = await pipeline.exec();
  
  if (!results || results.length < 3) {
    throw new Error('Redis pipeline failed');
  }

  const currentCount = parseInt(results[2][1] as string) || 0;
  const remaining = Math.max(0, limit - currentCount);
  const allowed = currentCount <= limit;

  if (!allowed) {
    logSecurityEvent('rate_limit_exceeded', key, {
      limit,
      currentCount,
      action: key.split(':')[2]
    }, 'medium');
  }

  return {
    allowed,
    remaining,
    resetTime,
    retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000)
  };
}

/**
 * Memory-based rate limiting (fallback)
 */
function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
  resetTime: number
): RateLimitResult {
  const stored = memoryStore.get(key);
  
  if (!stored || now > stored.resetTime) {
    // Reset or create new entry
    memoryStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime
    };
  }

  const currentCount = stored.count + 1;
  const remaining = Math.max(0, limit - currentCount);
  const allowed = currentCount <= limit;

  if (allowed) {
    stored.count = currentCount;
  } else {
    logSecurityEvent('rate_limit_exceeded', key, {
      limit,
      currentCount,
      action: key.split(':')[2]
    }, 'medium');
  }

  return {
    allowed,
    remaining,
    resetTime: stored.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((stored.resetTime - now) / 1000)
  };
}

/**
 * Rate limit middleware for messages
 */
export async function rateLimitMessages(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(
    userId,
    'messages',
    RATE_LIMITS.MESSAGES_PER_MINUTE,
    RATE_LIMITS.MESSAGE_WINDOW
  );
}

/**
 * Rate limit middleware for conversations
 */
export async function rateLimitConversations(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(
    userId,
    'conversations',
    RATE_LIMITS.CONVERSATIONS_PER_HOUR,
    RATE_LIMITS.CONVERSATION_WINDOW
  );
}

/**
 * Rate limit middleware for file uploads
 */
export async function rateLimitFileUploads(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(
    userId,
    'file_uploads',
    RATE_LIMITS.FILE_UPLOADS_PER_MINUTE,
    RATE_LIMITS.FILE_UPLOAD_WINDOW
  );
}

/**
 * Rate limit middleware for API calls
 */
export async function rateLimitApiCalls(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(
    userId,
    'api_calls',
    RATE_LIMITS.API_CALLS_PER_MINUTE,
    RATE_LIMITS.API_WINDOW
  );
}

/**
 * Rate limit middleware for login attempts
 */
export async function rateLimitLoginAttempts(
  userId: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const key = `login_attempts:${userId}:${ipAddress}`;
  return checkRateLimit(
    key,
    'login_attempts',
    RATE_LIMITS.FAILED_LOGINS_BEFORE_LOCK,
    RATE_LIMITS.LOGIN_ATTEMPTS_WINDOW
  );
}

/**
 * Clear rate limit for a user (admin function)
 */
export async function clearRateLimit(userId: string, action?: string): Promise<void> {
  try {
    if (redis) {
      if (action) {
        await redis.del(`rate_limit:${userId}:${action}`);
      } else {
        const pattern = `rate_limit:${userId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } else {
      if (action) {
        memoryStore.delete(`rate_limit:${userId}:${action}`);
      } else {
        const pattern = `rate_limit:${userId}:`;
        for (const [key] of memoryStore) {
          if (key.startsWith(pattern)) {
            memoryStore.delete(key);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear rate limit:', error);
  }
}

/**
 * Get rate limit status for a user
 */
export async function getRateLimitStatus(userId: string): Promise<{
  messages: RateLimitResult;
  conversations: RateLimitResult;
  fileUploads: RateLimitResult;
  apiCalls: RateLimitResult;
}> {
  const [messages, conversations, fileUploads, apiCalls] = await Promise.all([
    rateLimitMessages(userId),
    rateLimitConversations(userId),
    rateLimitFileUploads(userId),
    rateLimitApiCalls(userId)
  ]);

  return {
    messages,
    conversations,
    fileUploads,
    apiCalls
  };
}

/**
 * Check if user is temporarily locked due to rate limiting
 */
export async function isUserLocked(userId: string): Promise<boolean> {
  const status = await getRateLimitStatus(userId);
  
  return !status.messages.allowed || 
         !status.conversations.allowed || 
         !status.fileUploads.allowed || 
         !status.apiCalls.allowed;
}

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(
  action: string,
  limit: number,
  windowMs: number
) {
  return async (userId: string): Promise<RateLimitResult> => {
    return checkRateLimit(userId, action, limit, windowMs);
  };
}

/**
 * Express-style rate limit middleware
 */
export function rateLimitMiddleware(
  action: string,
  limit: number,
  windowMs: number = 60000
) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id || req.ip;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await checkRateLimit(userId, action, limit, windowMs);
    
    if (!result.allowed) {
      res.set('Retry-After', result.retryAfter?.toString() || '60');
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        resetTime: result.resetTime
      });
    }

    res.set('X-RateLimit-Limit', limit.toString());
    res.set('X-RateLimit-Remaining', result.remaining.toString());
    res.set('X-RateLimit-Reset', result.resetTime.toString());
    
    next();
  };
}
