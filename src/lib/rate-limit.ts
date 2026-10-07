import { NextResponse } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window cache
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale records every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(now: number, maxWindowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < maxWindowMs);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Extracts client IP from standard proxy and CDN headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export interface RateLimitOptions {
  limit: number;       // Max allowed requests in window
  windowMs: number;    // Window size in milliseconds
  prefix?: string;     // Endpoint or scope prefix
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

/**
 * Evaluates request rate against sliding window.
 */
export function checkRateLimit(req: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs, prefix = 'global' } = options;
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;

  cleanupStaleEntries(now, windowMs);

  let record = rateLimitMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    const retryAfterSeconds = Math.ceil(resetMs / 1000);

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Returns standardized 429 Too Many Requests response with headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please wait ${result.retryAfterSeconds} seconds before trying again.`,
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  );
}
