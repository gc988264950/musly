/**
 * In-process rate limiter for server-side API routes.
 *
 * This is a sliding fixed-window implementation backed by a module-level Map.
 * It is effective against burst abuse from a single user within one server
 * instance.
 *
 * LIMITATIONS (understand before deploying):
 * - State is NOT shared across Vercel/Lambda instances. On a multi-instance
 *   deployment a heavy user can hit N×MAX_REQUESTS if routed to N instances.
 * - State resets on cold starts / deployments.
 *
 * UPGRADE PATH:
 * - For true global rate limiting, replace `store` with Upstash Redis:
 *   https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *   One import swap — the interface stays identical.
 *
 * CURRENT LIMITS (per config object):
 * - AI chat: 10 requests / 60 seconds per user
 */

interface Entry {
  count:   number
  resetAt: number  // epoch ms
}

const store = new Map<string, Entry>()

export interface RateLimitConfig {
  /** How many requests are allowed per window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs:    number
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number   // epoch ms — use for Retry-After header
}

/**
 * Check whether `key` is within its rate limit window.
 * Mutates the internal counter — call exactly once per incoming request.
 */
export function checkRateLimit(
  key:    string,
  config: RateLimitConfig,
): RateLimitResult {
  const now   = Date.now()
  let entry   = store.get(key)

  // New window (first request or window expired)
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  entry.count++

  const allowed   = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return { allowed, remaining, resetAt: entry.resetAt }
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

export const AI_CHAT_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs:    60_000,  // 1 minute
}
