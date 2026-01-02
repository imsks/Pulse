/**
 * Pulse - Idempotency Utilities
 * 
 * System Design Note:
 * Idempotency ensures that processing the same request multiple times
 * produces the same result. This is critical in distributed systems
 * where network retries can cause duplicate requests.
 * 
 * Interview Question: "What is idempotency?"
 * Answer: "Idempotency means that performing an operation multiple times
 * has the same effect as performing it once. For example, if you submit
 * the same job twice with the same idempotency key, you get the same
 * job ID back, and the job is only processed once."
 */

import { getRedisClient } from '../infrastructure/redis'

export interface IdempotencyRecord {
    jobId: string
    timestamp: number
    tenantId: string
}

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60 // 24 hours

// Check if idempotency key exists and return existing job ID
export async function getIdempotencyRecord(
    key: string
): Promise<IdempotencyRecord | null> {
    const redis = await getRedisClient()

    // Create Redis key
    const redisKey = `idempotency:${key}`

    // Get value from Redis
    const value = await redis.get(redisKey)

    // If value exists, parse JSON
    const record = value ? JSON.parse(value) as IdempotencyRecord : null

    // Return IdempotencyRecord or null
    return record
}

// Store idempotency key with job ID
export async function storeIdempotencyKey(
    key: string,
    jobId: string,
    tenantId: string
): Promise<boolean> {
    const redis = await getRedisClient()

    // Create Redis key
    const redisKey = `idempotency:${key}`

    // Create value (JSON string)
    const record: IdempotencyRecord = {
        jobId,
        timestamp: Date.now(),
        tenantId,
    }
    const value = JSON.stringify(record)

    // Store with SET NX EX
    // Hint: redis.set(redisKey, value, 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX')
    // Returns 'OK' if set, null if key already exists
    const result = await redis.set(redisKey, value, 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX')

    // Return true if stored, false if exists
    return result === 'OK'
}

// Delete idempotency key (for testing/cleanup)
export async function deleteIdempotencyKey(key: string): Promise<void> {
    const redis = await getRedisClient()
    const redisKey = `idempotency:${key}`
    await redis.del(redisKey)
}