import { Queue, QueueOptions } from 'bullmq'
import { getRedisClient } from '../infrastructure/redis'
import { PulseJob, JobPriority } from '../types/job'

const QUEUE_NAME = process.env.QUEUE_NAME || 'pulse-jobs'

const defaultQueueOptions: QueueOptions['defaultJobOptions'] = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // Or 24 hours
    },
    removeOnFail: {
        count: 1000, // Keep last 1000 failed jobs (for debugging)
        age: 7 * 24 * 3600, // Or 7 days
    },
}

// Singleton queue instance
let jobQueue: Queue | null = null

// Get or create BullMQ queue
export const getJobQueue = async (): Promise<Queue> => {
    if (!jobQueue) {
        const redisClient = await getRedisClient()
        jobQueue = new Queue(QUEUE_NAME, {
            connection: redisClient,
            defaultJobOptions: defaultQueueOptions,
        })
    }

    jobQueue.on('error', (error) => {
        console.error('Queue error:', error)
    })

    console.log(`✅ Queue "${QUEUE_NAME}" initialized`)

    return jobQueue
}

// Enqueue a job to the queue
export const enqueueJob = async (job: PulseJob): Promise<string> => {
    const queue = await getJobQueue()

    const priorityMap: Record<JobPriority, number> = {
        high: 1,
        normal: 0,
        low: -1,
    }

    const bullMQJob = await queue.add(
        job.jobType,
        {
            tenantId: job.tenantId,
            jobType: job.jobType,
            payload: job.payload,
            metadata: job.metadata,
            idempotencyKey: job.idempotencyKey,
        },
        {
            jobId: job.jobId,
            priority: job.priority ? priorityMap[job.priority] : 0,
        }
    )

    console.log(`✅ Job "${job.jobId}" enqueued with ID: ${bullMQJob.id}`)

    return bullMQJob.id!
}

// Get job from the queue
export async function getJob(jobId: string) {
    const queue = await getJobQueue()
    return await queue.getJob(jobId)
}

// Get job status from the queue
export async function getJobStatus(jobId: string) {
    const queue = await getJobQueue()
    const job = await queue.getJob(jobId)

    if (!job) {
        return null
    }

    const state = await job.getState()
    const progress = job.progress
    const returnvalue = job.returnvalue
    const failedReason = job.failedReason

    return {
        jobId: job.id,
        state,
        progress,
        returnvalue,
        failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
    }
}

// Gracefully close queue
export async function closeQueue(): Promise<void> {
    if (jobQueue) {
        await jobQueue.close()
        jobQueue = null
        console.log('✅ Queue closed gracefully')
    }
}