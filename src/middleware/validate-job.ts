/**
 * Pulse - Job Validation Middleware
 * 
 * System Design Note:
 * This middleware validates jobs before they reach the route handler.
 * Invalid jobs are rejected early with 400 errors.
 */

import { Request, Response, NextFunction } from 'express'
import { validateJob, sanitizeJob } from '../utils/validation'
import { PulseJob } from '../types/job'

export function validateJobMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Only apply to POST /jobs
    if (req.method !== 'POST' || req.path !== '/jobs') {
        return next()
    }

    const job = req.body as PulseJob

    // Validate job
    const result = validateJob(job)

    // If invalid, return 400 with errors
    if (!result.valid) {
        res.status(400).json({
            error: 'Validation failed',
            errors: result.errors,
        })
        return
    }

    // If valid, sanitize job
    const sanitizedJob = sanitizeJob(job)

        // Attach sanitized job to request
        ; (req as any).validatedJob = sanitizedJob

    // Call next()
    next()
}