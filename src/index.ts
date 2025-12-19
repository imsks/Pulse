/**
 * Pulse - Control Plane (API Server)
 * 
 * System Design Note:
 * This is the Control Plane that receives job requests, validates them,
 * applies rate limiting, enforces idempotency, and enqueues jobs.
 * 
 * In a distributed backend system, the Control Plane:
 * - Must be stateless (scales horizontally)
 * - Must respond quickly (just enqueue, don't process)
 * - Must handle rate limiting across multiple instances (Redis)
 * - Must support idempotency (prevent duplicate jobs)
 * 
 * Separation from Data Plane (workers) allows:
 * - Independent scaling
 * - Fault isolation
 * - Different resource allocation
 */

import express from 'express';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'pulse-control-plane',
    version: '0.1.0'
  });
});

// TODO: Add job submission endpoint
// TODO: Add rate limiting middleware
// TODO: Add idempotency check
// TODO: Add job status endpoint
// TODO: Add handler registration endpoint (for users to register handlers)

app.listen(PORT, () => {
  console.log(`🚀 Pulse Control Plane running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
