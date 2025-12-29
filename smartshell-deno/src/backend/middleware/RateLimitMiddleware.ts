/**
 * Rate Limiting Middleware
 * Follows Middleware Pattern and SOLID principles
 * Provides rate limiting to prevent abuse
 */
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { RateLimitError } from './ErrorHandlingMiddleware.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => getClientIdentifier(req),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later'
  } = options;

  const store = new Map<string, RateLimitEntry>();

  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(store, now);

    // Get or create rate limit entry
    let entry = store.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      store.set(key, entry);
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    // Increment counter
    entry.count++;

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      
      return ResponseFactory.error(
        `${message}. Try again in ${resetIn} seconds.`,
        429
      );
    }

    // Execute request
    const response = await next();

    // Optionally skip counting based on response
    if ((skipSuccessfulRequests && response.status < 400) ||
        (skipFailedRequests && response.status >= 400)) {
      entry.count--;
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    return response;
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Try to get real IP first
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent');
  
  let ip = 'unknown';
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIP) {
    ip = realIP;
  } else {
    // Fallback to connection info (not available in all environments)
    ip = 'connection';
  }
  
  // Create a unique identifier using IP and user agent
  const identifier = `${ip}:${userAgent || 'unknown'}`;
  
  // Hash the identifier for privacy
  return hashString(identifier);
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(store: Map<string, RateLimitEntry>, now: number): void {
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Pre-configured rate limiting middleware for different use cases
 */
export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Rate limit exceeded. Please try again later.'
});

export const moderateRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Rate limit exceeded. Please try again later.'
});

export const lenientRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
  message: 'Rate limit exceeded. Please try again later.'
});

/**
 * API-specific rate limiting
 */
export const apiRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  keyGenerator: (req) => {
    const url = new URL(req.url);
    return `api:${getClientIdentifier(req)}:${url.pathname}`;
  }
});

/**
 * Authentication-specific rate limiting
 */
export const authRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    const url = new URL(req.url);
    return `auth:${getClientIdentifier(req)}:${url.pathname}`;
  },
  message: 'Too many authentication attempts. Please try again later.'
});

/**
 * Create rate limiting middleware for specific IP addresses
 */
export function createIPRateLimit(ips: string[], options: RateLimitOptions = {}) {
  const ipSet = new Set(ips);
  
  return createRateLimitMiddleware({
    ...options,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
      
      // Only apply rate limiting to specified IPs
      return ipSet.has(ip) ? `ip:${ip}` : `general:${getClientIdentifier(req)}`;
    }
  });
}