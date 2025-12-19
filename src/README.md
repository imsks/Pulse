# Pulse Source Code Architecture

## 🧱 Three-Layer Architecture

### 1️⃣ Control Plane (`api/`, `index.ts`)
**Responsibility**: Receives job requests, validates, rate limits, enqueues.

**Key Principles:**
- Stateless (scales horizontally)
- Fast response (just enqueue, don't process)
- Distributed rate limiting (Redis)
- Idempotency enforcement

### 2️⃣ Data Plane (`workers/`)
**Responsibility**: Consumes jobs, executes handlers, manages retries/failures.

**Key Principles:**
- Stateless (can run multiple instances)
- Graceful failure handling (retry, DLQ)
- Handler routing (via registry)
- Isolation from Control Plane

### 3️⃣ Infrastructure (`queue/`, `rate-limit/`)
**Responsibility**: Redis connections, BullMQ setup, rate limiting logic.

**Key Principles:**
- Shared state (Redis)
- Atomic operations (prevent race conditions)
- Connection pooling
- Health monitoring

---

## 📦 Core Abstractions

### Job Schema (`types/job.ts`)
**Canonical structure** that all jobs must conform to. Pulse never inspects `payload` - it's opaque.

**Why this matters:**
- Multi-tenancy: `tenantId` isolates workloads
- Routing: `jobType` determines which handler executes
- Idempotency: `idempotencyKey` prevents duplicates
- Observability: `metadata.traceId` enables distributed tracing

### Handler Registry (`handlers/registry.ts`)
**Execution model** - users register handlers, Pulse routes jobs to them.

**System Design Note**: In production, you'd want handler versioning, timeout policies, and handler metadata. But for now, keep it simple.

---

## 🔄 Data Flow

```
User App → Control Plane (API) → Rate Limiter → Queue (Redis) → Data Plane (Worker) → Handler
```

1. **User App**: Submits job via HTTP
2. **Control Plane**: Validates job schema, checks rate limit, enqueues
3. **Rate Limiter**: Uses Redis to track requests (distributed)
4. **Queue**: Job stored in Redis, API returns immediately
5. **Data Plane**: Worker picks up job, routes by jobType
6. **Handler**: User-defined function executes

## 🚫 What Goes Where

### ✅ Control Plane (`api/`)
- Job submission endpoint
- Job status endpoint
- Rate limiting middleware
- Idempotency checks
- Handler registration endpoint (for users)

### ✅ Data Plane (`workers/`)
- Job consumption from queue
- Handler routing
- Retry logic
- DLQ routing
- Graceful shutdown

### ✅ Infrastructure (`queue/`, `rate-limit/`)
- Redis connection management
- BullMQ queue setup
- Rate limiting algorithm
- Lock management (for idempotency)

### ❌ NOT in Pulse
- Domain logic (what jobs do)
- Business rules
- Data transformation (beyond validation)
- Frontend/UI
- Authentication (beyond tenant isolation)

---

## 🧠 Future Features (Design Must Allow)

All current code must allow these future features:

- **Dead Letter Queue**: Failed jobs after max retries
- **Exponential Backoff**: Retry delays increase exponentially
- **Job Timeouts**: Kill jobs that run too long
- **Per-Tenant Queues**: Optional isolation per tenant
- **Observability Hooks**: Metrics, logs, traces
- **Graceful Shutdown**: Finish current jobs before exit

If you see code that blocks these, **flag it**.

---

## 📝 Development Notes

- **30-minute sessions**: One concept per session
- **Platform purity**: No domain logic
- **Interview-ready**: Every decision explainable
- **Minimalism**: Smallest working change
