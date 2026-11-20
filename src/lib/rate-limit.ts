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

/**
 * Derives a rate limit identifier that combines IP with session/token context
 * to prevent students sharing a classroom or university NAT from blocking each other.
 */
export function getRateLimitIdentifier(req: Request, prefix = 'global'): string {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.length > 15) {
    // Key by the cryptographic token suffix
    const tokenPart = authHeader.trim().slice(-16);
    return `${prefix}:auth:${tokenPart}`;
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const cookieToken =
    cookieHeader.match(/ielts_session_token=([^;]+)/)?.[1] ||
    cookieHeader.match(/ielts_admin_token=([^;]+)/)?.[1];
  if (cookieToken && cookieToken.length > 15) {
    return `${prefix}:auth:${cookieToken.trim().slice(-16)}`;
  }

  const clientSession = req.headers.get('x-client-session');
  if (clientSession && clientSession.length >= 8) {
    return `${prefix}:sess:${clientSession.slice(0, 32)}`;
  }

  const ip = getClientIp(req);
  return `${prefix}:ip:${ip}`;
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
  const key = getRateLimitIdentifier(req, prefix);

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
 * Distributed rate limiter using Upstash Redis REST when configured, with sliding-window memory fallback.
 */
export async function checkRateLimitAsync(
  req: Request,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    return checkRateLimit(req, options);
  }

  const { limit, windowMs, prefix = 'global' } = options;
  const key = `rl:${getRateLimitIdentifier(req, prefix)}`;
  const windowSecs = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const res = await fetch(`${redisUrl.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSecs, 'NX'],
        ['TTL', key],
      ]),
    });

    if (res.ok) {
      const data = await res.json();
      const count = Number(data?.[0]?.result ?? 1);
      const ttl = Math.max(1, Number(data?.[2]?.result ?? windowSecs));
      if (count > limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetMs: ttl * 1000,
          retryAfterSeconds: ttl,
        };
      }
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - count),
        resetMs: ttl * 1000,
        retryAfterSeconds: 0,
      };
    }
  } catch (err) {
    console.warn('Upstash Redis rate-limit fallback triggered:', err);
  }

  return checkRateLimit(req, options);
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
