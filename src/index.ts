import express from 'express'
import { getRedisClient, checkRedisConnection, closeRedisConnection } from './infrastructure/redis'
import { enqueueJob, getJobStatus } from './queue/queue'
import { PulseJob } from './types/job'
import { rateLimitMiddleware } from './rate-limit/middleware'
import { validateJobMiddleware } from './middleware/validate-job'
import { idempotencyMiddleware, storeIdempotencyAfterEnqueue } from './middleware/idempotency'

const app = express()
const PORT = process.env.API_PORT || 3000

app.use(express.json())

// TODO: Add job submission endpoint
// TODO: Add rate limiting middleware
// TODO: Add idempotency check
// TODO: Add job status endpoint
// TODO: Add handler registration endpoint (for users to register handlers)

const initializeInfrastructure = async () => {
  try {
    const client = await getRedisClient()
    await client.ping()
    console.log('✅ Redis initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error)
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const isRedisHealthy = await checkRedisConnection()
  res.json({
    status: 'ok',
    service: 'pulse-control-plane',
    version: '0.1.0',
    cache_healthy: isRedisHealthy
  })
})

// API Routes
app.post('/jobs', rateLimitMiddleware, validateJobMiddleware, idempotencyMiddleware, async (req, res) => {
  try {
    // TODO: Add job validation middleware
    const job: PulseJob = req.body

    // Validate required fields
    if (!job.tenantId || !job.jobType || job.payload === undefined) {
      return res.status(400).json({
        error: 'Invalid job schema',
        required: ['tenantId', 'jobType', 'payload'],
      })
    }

    // Enqueue job
    const jobId = await enqueueJob(job)

    res.status(202).json({
      jobId,
      status: 'queued',
      message: 'Job enqueued successfully',
    })
  } catch (error) {
    console.error('Error enqueuing job:', error)
    res.status(500).json({
      error: 'Failed to enqueue job',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /jobs/:jobId - Get job status
app.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const status = await getJobStatus(jobId)

    if (!status) {
      return res.status(404).json({
        error: 'Job not found',
        jobId,
      })
    }

    res.json(status)
  } catch (error) {
    console.error('Error getting job status:', error)
    res.status(500).json({
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await closeRedisConnection()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await closeRedisConnection()
  process.exit(0)
})

// Initialize infrastructure before starting server
initializeInfrastructure().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Pulse Control Plane running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
})
