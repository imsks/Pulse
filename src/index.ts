/**
 * Pulse - News Aggregation & Processing Backend
 * 
 * Main entry point for the API server.
 * 
 * System Design Note:
 * This is the API layer that receives requests, applies rate limiting,
 * and enqueues jobs. It does NOT process jobs - that's the worker's job.
 * This separation allows horizontal scaling of both API and workers independently.
 */

import express from 'express';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pulse-api' });
});

// TODO: Add rate limiting middleware
// TODO: Add news fetching endpoint that enqueues jobs
// TODO: Add queue status endpoint

app.listen(PORT, () => {
  console.log(`🚀 Pulse API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

