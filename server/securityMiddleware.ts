import type { Request, Response, NextFunction } from 'express';
import {
  hasInvisibleOrMaliciousChars,
  sanitizeInputString,
  evaluateAddressSecurity,
} from '../services/securityValidator.ts';

// In-memory IP rate limiter for critical wallet APIs
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitStore) {
    if (bucket.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 300000);

/**
 * Creates an Express rate-limiting middleware
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum number of requests allowed within windowMs
 */
export function createRateLimiter(windowMs: number = 60000, maxRequests: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || '127.0.0.1';
    const now = Date.now();

    let bucket = rateLimitStore.get(ip);
    if (!bucket || bucket.resetTime < now) {
      bucket = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(ip, bucket);
    } else {
      bucket.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Anti-abuse rate limit triggered.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSec: Math.ceil((bucket.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Security Headers Middleware: Protects against XSS and MIME confusion while allowing camera access
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=*');
  next();
}

/**
 * Sanitizes and validates request bodies to prevent invisible character injection and prototype pollution
 */
export function sanitizeRequestBodyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitizeRecursive = (obj: Record<string, unknown>) => {
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          delete obj[key];
          continue;
        }

        const val = obj[key];
        if (typeof val === 'string') {
          if (hasInvisibleOrMaliciousChars(val)) {
            return {
              hasAttackPayload: true,
              field: key,
            };
          }
          obj[key] = sanitizeInputString(val);
        } else if (val && typeof val === 'object') {
          const res = sanitizeRecursive(val as Record<string, unknown>);
          if (res?.hasAttackPayload) return res;
        }
      }
      return { hasAttackPayload: false };
    };

    const result = sanitizeRecursive(req.body);
    if (result.hasAttackPayload) {
      return res.status(400).json({
        error: `Malicious zero-width or invisible control characters detected in field '${result.field}'. Request blocked for security.`,
        code: 'MALICIOUS_INPUT_BLOCKED',
      });
    }
  }

  next();
}
