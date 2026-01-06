/**
 * Pulse - Dead Letter Queue (DLQ)
 * 
 * System Design Note:
 * DLQ stores jobs that failed after all retry attempts.
 * This allows:
 * - Manual inspection of failed jobs
 * - Debugging failure reasons
 * - Manual retry after fixing issues
 * 
 * Interview Question: "What is a Dead Letter Queue?"
 * Answer: "DLQ is a queue for jobs that failed permanently after
 * all retries. It allows operators to inspect failures, debug issues,
 * and manually retry jobs after fixing root causes."
 */

import { Queue } from 'bullmq'
import { getRedisClient } from '../infrastructure/redis'

const DLQ_NAME = process.env.DLQ_NAME || 'pulse-dlq'

// Singleton DLQ instance
let dlq: Queue | null = null

/**
 * Get or create DLQ
 * 
 * - Create Queue with DLQ_NAME
 * - Use same Redis connection
 */
export async function getDLQ(): Promise<Queue> {
    if (!dlq) {
        const redisClient = await getRedisClient()
        dlq = new Queue(DLQ_NAME, {
            connection: redisClient,
        })
    }
    return dlq
}

/**
 * Move job to DLQ
 * 
 * 1. Get DLQ instance
 * 2. Add job to DLQ with:
 *    - Original job data
 *    - Failure reason
 *    - Attempt count
 *    - Timestamp
 * 3. Return DLQ job ID
 */
export async function moveToDLQ(
    jobId: string,
    originalJobData: unknown,
    failureReason: string,
    attemptsMade: number
): Promise<string> {
    const dlq = await getDLQ()
    await dlq.add(jobId, originalJobData, {
        delay: 0,
        attempts: attemptsMade,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    })
    return jobId
}

/**
 * Get DLQ jobs
 * 
 * - Get failed jobs from DLQ
 * - Return array of DLQ jobs with metadata
 */
export async function getDLQJobs(limit: number = 100) {
    const dlq = await getDLQ()
    const jobs = await dlq.getJobs(['failed'])
    return jobs
}

/**
 * Retry job from DLQ
 * 
 * 1. Get job from DLQ
 * 2. Extract original job data
 * 3. Re-enqueue to main queue
 * 4. Remove from DLQ (optional)
 */
export async function retryFromDLQ(dlqJobId: string): Promise<string> {
    const dlq = await getDLQ()
    const job = await dlq.getJob(dlqJobId)
    if (!job) {
        throw new Error(`Job ${dlqJobId} not found in DLQ`)
    }
    await job.moveToWaitingChildren(
        job.token!,
    )
    return job.id!
}