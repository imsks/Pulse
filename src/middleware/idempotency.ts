/**
 * Pulse - Idempotency Middleware
 * 
 * System Design Note:
 * This middleware checks for idempotency keys before processing.
 * If a key exists, it returns the existing job ID without enqueueing.
 * 
 * Interview Question: "How do you handle duplicate requests?"
 * Answer: "We use idempotency middleware. If a request has an
 * idempotency key that we've seen before, we return the existing
 * job ID. This prevents duplicate processing even if the client
 * retries due to network timeouts."
 */

import { Request, Response, NextFunction } from 'express'
import { getIdempotencyRecord, storeIdempotencyKey } from '../utils/idempotency'
import { PulseJob } from '../types/job'

// Idempotency middleware
export async function idempotencyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Only apply to POST /jobs
    if (req.method !== 'POST' || req.path !== '/jobs') {
        return next()
    }

    const job = req.body as PulseJob

    // Extract idempotencyKey from job
    const idempotencyKey = job.idempotencyKey

    // If no idempotencyKey, continue (no check needed)
    if (!idempotencyKey) {
        return next()
    }

    // Check if key exists in Redis
    const record = await getIdempotencyRecord(idempotencyKey)

    // If record exists, return existing jobId
    if (record) {
        return res.status(200).json({ jobId: record.jobId, status: 'duplicate' })
    }

    // If not exists, attach key to request for later storage
    // Then call next()
    else {
        next()
    }
}

// Store idempotency key after successful job enqueue
export async function storeIdempotencyAfterEnqueue(
    idempotencyKey: string,
    jobId: string,
    tenantId: string
): Promise<void> {
    await storeIdempotencyKey(idempotencyKey, jobId, tenantId)
}