import { getRedisClient, closeRedisConnection } from '../infrastructure/redis'
import { Worker, Job } from 'bullmq'
import { getJobQueue, closeQueue } from '../queue/queue'
import { handlerRegistry } from '../handlers/registry'
import { PulseJob } from '../types/job'

async function initializeWorker() {
    try {
        const redisClient = await getRedisClient()
        console.log('✅ Worker: Redis connected')

        // Get queue (same queue that API uses)
        const queue = await getJobQueue()
        const queueName = queue.name

        // Create BullMQ worker
        const worker = new Worker(
            queueName,
            async (job: Job) => {
                console.log(`📦 Processing job ${job.id} of type ${job.name}`)

                // Extract Pulse job data
                const pulseJob: PulseJob = {
                    jobId: job.id,
                    tenantId: job.data.tenantId,
                    jobType: job.data.jobType,
                    payload: job.data.payload,
                    metadata: job.data.metadata,
                    idempotencyKey: job.data.idempotencyKey,
                }

                // Route to handler by jobType
                const handler = handlerRegistry.get(pulseJob.jobType)

                if (!handler) {
                    throw new Error(`No handler registered for jobType: ${pulseJob.jobType}`)
                }

                // Execute handler
                const result = await handler(pulseJob.payload)

                // Return result (stored in job.returnvalue)
                return result
            },
            {
                connection: redisClient,
                concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
                // Remove job from queue after completion
                removeOnComplete: {
                    count: 100,
                },
                removeOnFail: {
                    count: 1000,
                },
            }
        )

        // Worker event handlers for observability
        worker.on('completed', (job) => {
            console.log(`✅ Job ${job.id} completed`)
        })

        worker.on('failed', (job, err) => {
            console.error(`❌ Job ${job?.id} failed:`, err.message)
        })

        worker.on('error', (err) => {
            console.error('❌ Worker error:', err.message)
        })

        // Graceful shutdown
        const shutdown = async () => {
            console.log('Worker: Shutting down gracefully...')
            await worker.close()
            await closeRedisConnection()
            process.exit(0)
        }

        process.on('SIGTERM', shutdown)
        process.on('SIGINT', shutdown)

        console.log('🔧 Pulse Data Plane (Worker) ready')
        console.log(`📊 Consuming from queue: ${queueName}`)
        console.log(`⚡ Concurrency: ${process.env.WORKER_CONCURRENCY || '5'}`)
    } catch (error) {
        console.error('❌ Worker: Failed to initialize:', error)
        process.exit(1)
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Worker: SIGTERM received, shutting down gracefully...')
    // TODO: Stop accepting new jobs
    await closeQueue()
    // TODO: Wait for current jobs to finish
    await closeRedisConnection()
    process.exit(0)
})

process.on('SIGINT', async () => {
    console.log('Worker: SIGINT received, shutting down gracefully...')
    await closeRedisConnection()
    process.exit(0)
})

// Start worker
initializeWorker()
