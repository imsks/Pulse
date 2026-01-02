/**
 * Pulse - Job Validation Utilities
 * 
 * System Design Note:
 * Validation ensures that only valid jobs enter the queue.
 * This prevents:
 * - Invalid data from crashing workers
 * - Queue pollution with bad jobs
 * - Wasted processing resources
 * 
 * Interview Question: "How do you validate jobs?"
 * Answer: "We validate the canonical job schema before enqueueing.
 * We check required fields, types, and formats. Invalid jobs return
 * 400 errors and are never enqueued."
 */

import { PulseJob, JobValidationResult } from '../types/job'

// Validate job schema
export function validateJob(job: unknown): JobValidationResult {
    // Check if job is an object
    if (!job || typeof job !== 'object') {
        return {
            valid: false,
            errors: ['Job must be an object'],
        }
    }

    const pulseJob = job as PulseJob
    const errors: string[] = []

    // Validate tenantId
    // - Required
    // - Must be string
    // - Must be non-empty
    // - Valid format (alphanumeric, hyphens, underscores)
    if (!pulseJob.tenantId) {
        errors.push('tenantId is required')
    } else if (typeof pulseJob.tenantId !== 'string') {
        errors.push('tenantId must be a string')
    } else if (pulseJob.tenantId.trim().length === 0) {
        errors.push('tenantId cannot be empty')
    } else if (!/^[a-zA-Z0-9_-]+$/.test(pulseJob.tenantId)) {
        errors.push('tenantId contains invalid characters')
    }

    // Validate jobType
    // - Required
    // - Must be string
    // - Must be non-empty
    // - Valid format
    if (!pulseJob.jobType) {
        errors.push('jobType is required')
    } else if (typeof pulseJob.jobType !== 'string') {
        errors.push('jobType must be a string')
    } else if (pulseJob.jobType.trim().length === 0) {
        errors.push('jobType cannot be empty')
    }

    // Validate payload
    // - Required (cannot be undefined)
    // - Can be any type (null, object, array, string, number, boolean)
    if (pulseJob.payload === undefined) {
        errors.push('payload is required')
    }

    // Validate priority (if provided)
    // - Must be one of: 'high', 'normal', 'low'
    if (pulseJob.priority !== undefined) {
        const validPriorities = ['high', 'normal', 'low']
        if (!validPriorities.includes(pulseJob.priority)) {
            errors.push(`priority must be one of: ${validPriorities.join(', ')}`)
        }
    }

    // TODO: Validate idempotencyKey (if provided)
    // - Must be string
    // - Must be non-empty
    if (pulseJob.idempotencyKey !== undefined) {
        if (typeof pulseJob.idempotencyKey !== 'string') {
            errors.push('idempotencyKey must be a string')
        } else if (pulseJob.idempotencyKey.trim().length === 0) {
            errors.push('idempotencyKey cannot be empty')
        }
    }

    // Return validation result
    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    }
}

// Sanitize job (trim strings, normalize)
export function sanitizeJob(job: PulseJob): PulseJob {
    // Create sanitized copy
    const sanitizedJob = { ...job }
    // Trim string fields
    sanitizedJob.tenantId = sanitizedJob.tenantId?.trim()
    sanitizedJob.jobType = sanitizedJob.jobType?.trim()
    sanitizedJob.idempotencyKey = sanitizedJob.idempotencyKey?.trim()

    // Return sanitized job
    return sanitizedJob
}