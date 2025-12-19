# Pulse – News Aggregation & Processing Backend

> A backend-only learning lab focused on system design fundamentals

## 🎯 Project Goal

Build a backend-only system that:
- Fetches news/events
- Applies rate limiting
- Pushes jobs into Redis-backed queues
- Processes jobs asynchronously
- Uses workers for CPU-heavy tasks
- Focuses on system design fundamentals, not features

## 🧱 Tech Stack

- **Language**: Node.js (TypeScript)
- **Framework**: Express or Fastify
- **Queue**: BullMQ
- **Cache/Store**: Redis
- **Concurrency**: Worker Threads (and/or Child Process for comparison)
- **API Client**: Axios (with interceptors)

**Constraints**: No ORM, no frontend, minimal dependencies.

## 📚 Core Learning Concepts

- Redis-based API rate limiting
- Job queues using BullMQ
- Background workers
- Retry strategies & failure handling
- Worker Threads vs Child Processes
- Idempotency
- Event-driven processing
- Horizontal scalability concepts
- Backpressure
- Separation of concerns (API vs worker)

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start Redis (required)
# Using Docker:
docker run -d -p 6379:6379 redis:7-alpine

# Or using local Redis:
redis-server

# Start the API server
npm run dev

# Start workers (in separate terminal)
npm run worker
```

## 📁 Project Structure

```
pulse/
├── src/
│   ├── api/          # Express/Fastify routes
│   ├── queue/        # BullMQ queue setup
│   ├── workers/      # Background job processors
│   ├── rate-limit/   # Redis-based rate limiting
│   ├── services/     # Business logic
│   └── utils/        # Helpers
├── .env.example
└── package.json
```

## ⏱️ Development Philosophy

- **30-minute sessions**: Keep changes small, one concept per session
- **Learning over features**: Understand why, not just how
- **Interview-ready**: Every decision should be explainable in system design interviews

## 📝 Notes

This project intentionally avoids:
- Frontend
- Auth flows
- Product features
- Premature optimization

Focus is on **pure backend engineering** and **system design fundamentals**.

