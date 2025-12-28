/**
 * Pulse - Distributed Rate Limiter
 * 
 * System Design Note:
 * This implements token bucket rate limiting using Redis.
 * 
 * Why Redis?
 * - Atomic operations (INCR) prevent race conditions
 * - Shared state across multiple API instances
 * - TTL (expiration) for automatic cleanup
 * 
 * Interview Question: "How do you prevent race conditions?"
 * Answer: "Redis INCR is atomic. Even if 100 requests hit Redis
 * simultaneously, the counter increments correctly without locks."
 */

import { getRedisClient } from '../infrastructure/redis'

export interface RateLimitConfig {
    maxRequests: number      // Max requests allowed
    windowMs: number          // Time window in milliseconds
    identifier: string        // What to rate limit (tenantId, IP, etc.)
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number        // Requests remaining in window
    resetAt: number          // Unix timestamp when limit resets
    retryAfter?: number      // Seconds to wait before retry (if limited)
}

// Check if request should be rate limited
export async function checkRateLimit(
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const redis = await getRedisClient()
    const { maxRequests, windowMs, identifier } = config

    // Create Redis key
    const key = `rate-limit:${identifier}:${windowMs}`

    // Get current count
    const count = await redis.incr(key)

    // Check if this is first request (count === 1)
    // If yes, set expiration on key
    if (count === 1) {
        await redis.expire(key, windowMs / 1000)
    }

    // Calculate remaining requests
    const remaining = maxRequests - count

    // Determine if request is allowed
    const allowed = count <= maxRequests

    // Calculate resetAt timestamp
    const resetAt = Date.now() + windowMs

    // Return RateLimitResult
    return {
        allowed,
        remaining,
        resetAt,
    }
}

// Get rate limit status without consuming a request
export async function getRateLimitStatus(
    config: RateLimitConfig
): Promise<Omit<RateLimitResult, 'allowed'>> {
    const redis = await getRedisClient()
    const { maxRequests, windowMs, identifier } = config
    const key = `rate-limit:${identifier}:${windowMs}`
    const count = await redis.get(key)
    if (!count) {
        return {
            remaining: maxRequests,
            resetAt: Date.now() + windowMs,
        }
    }
    const remaining = maxRequests - parseInt(count, 10)
    const resetAt = Date.now() + windowMs
    return {
        remaining,
        resetAt,
    }
}