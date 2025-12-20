import express from 'express'
import { getRedisClient, checkRedisConnection, closeRedisConnection } from './infrastructure/redis'

const app = express()
const PORT = process.env.API_PORT || 3000

app.use(express.json())



// TODO: Add job submission endpoint
// TODO: Add rate limiting middleware
// TODO: Add idempotency check
// TODO: Add job status endpoint
// TODO: Add handler registration endpoint (for users to register handlers)
// TODO: Initialize Redis connection
const initializeInfrastructure = async () => {
  try {
    const client = getRedisClient();
    // Connect to Redis (lazy connect, so this actually connects)
    (await client).connect()
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
