# Source Code Structure

## Directory Responsibilities

### `api/`
Express/Fastify route handlers. These receive HTTP requests, validate input, apply rate limiting, and enqueue jobs.

**System Design Note**: API layer should be stateless and fast. It should NOT do heavy processing - that's what workers are for.

### `queue/`
BullMQ queue configuration and setup. Defines job types, queue names, and connection to Redis.

**System Design Note**: Queues decouple API from processing. This allows:
- API to respond quickly (just enqueue)
- Workers to process at their own pace
- Independent scaling of API vs workers

### `workers/`
Background job processors. These consume jobs from the queue and do the actual work.

**System Design Note**: Workers can be:
- Worker Threads (shared memory, good for CPU-bound tasks)
- Child Processes (isolated, good for heavy computation)
- Both (depending on the job type)

### `rate-limit/`
Redis-based rate limiting middleware. Uses Redis to track request counts across multiple API instances.

**System Design Note**: Redis enables distributed rate limiting. Without it, each API instance would have its own counter, allowing more requests than intended.

### `services/`
Business logic layer. Contains the actual news fetching, processing, and transformation logic.

**System Design Note**: Services should be pure functions when possible. This makes them:
- Testable
- Reusable
- Easy to reason about

### `utils/`
Helper functions, constants, and shared utilities.

---

## Data Flow

```
HTTP Request → API Route → Rate Limiter → Queue (Redis) → Worker → Processing
```

1. **API Route**: Receives request, validates input
2. **Rate Limiter**: Checks Redis for request count, allows/denies
3. **Queue**: Job is enqueued in Redis, API returns immediately
4. **Worker**: Picks up job, processes it (fetch news, transform, etc.)
5. **Processing**: Actual work happens here (CPU-heavy tasks)

---

## Key Design Decisions

### Why separate API and Workers?
- **Scalability**: Scale API and workers independently
- **Fault Tolerance**: Worker crash doesn't affect API
- **Resource Optimization**: API can be memory-optimized, workers CPU-optimized

### Why Redis for rate limiting?
- **Distributed**: Works across multiple API instances
- **Fast**: In-memory, sub-millisecond latency
- **Atomic**: Built-in atomic operations prevent race conditions

### Why BullMQ over raw Redis?
- **Job Management**: Built-in retry, delay, priority
- **Monitoring**: Job status, progress tracking
- **Reliability**: Dead-letter queues, job persistence

