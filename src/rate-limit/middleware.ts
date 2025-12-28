/**
 * Pulse - Rate Limiting Middleware
 * 
 * System Design Note:
 * Express middleware that applies rate limiting to routes.
 * 
 * Interview Question: "Where do you apply rate limiting?"
 * Answer: "As middleware before route handlers. This allows
 * us to reject requests early, before expensive operations."
 */

import { Request, Response, NextFunction } from 'express'
import { checkRateLimit, RateLimitConfig } from './rate-limiter'
import { PulseJob } from '../types/job'

// Rate limit configuration per route
const RATE_LIMIT_CONFIG = {
    // Job submission: 100 requests per minute per tenant
    '/jobs': {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },
    // Add more routes as needed
}

// Extract identifier for rate limiting
function getRateLimitIdentifier(req: Request): string {
    // Extract tenantId from request - For POST /jobs, it's in req.body.tenantId, For other routes, you might use req.ip
    const tenantId = req.body.tenantId || req.query.tenantId || req.headers['x-tenant-id']
    if (tenantId) {
        return tenantId
    }

    if (req.path === '/jobs' && req.method === 'POST') {
        const job = req.body as PulseJob
        return job.tenantId || 'anonymous'
    }

    // Fallback to IP address for other routes
    return req.ip || 'unknown'
}

/**
 * Rate limiting middleware
 * 
 * TODO: Complete this middleware
 * 1. Get rate limit config for this route
 * 2. Get identifier (tenantId, IP, etc.)
 * 3. Check rate limit
 * 4. If allowed: call next()
 * 5. If not allowed: return 429 with Retry-After header
 */
export async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    // TODO: Get config for this route
    const routeConfig = RATE_LIMIT_CONFIG[req.path as keyof typeof RATE_LIMIT_CONFIG]

    if (!routeConfig) {
        // No rate limit for this route
        return next()
    }

    // Get identifier
    const identifier = getRateLimitIdentifier(req)

    // Create rate limit config
    const config: RateLimitConfig = {
        maxRequests: routeConfig.maxRequests,
        windowMs: routeConfig.windowMs,
        identifier,
    }

    const result = await checkRateLimit(config)
    if (result.allowed) {
        next()
        return
    }
    res.setHeader('Retry-After', result.retryAfter?.toString() || '0')
    res.status(429).json({ error: 'Rate limit exceeded' })
}