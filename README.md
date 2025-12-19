# Pulse – General-Purpose Job Queue & Worker Platform

> A domain-agnostic infrastructure platform for event ingestion, job queuing, and worker execution

## 🎯 Project Identity

**Pulse is NOT:**
- A news app
- A crawler
- A business service
- A product backend

**Pulse IS:**
A general-purpose event ingestion + job queue + worker execution platform that any app can use.

Pulse must remain reusable across multiple projects (Saransh, Rajniti, Fuck Paid Courses, DSA Yatra V2, etc.) and any external user's app.

## 🧱 Architecture

Pulse consists of three layers:

### 1️⃣ Control Plane (API)
- Receives job requests
- Applies rate limits
- Enforces idempotency
- Pushes jobs to queues
- Exposes job status

### 2️⃣ Data Plane (Workers)
- Consumes jobs from queues
- Executes handler functions (via registry)
- Applies retries & backoff
- Routes failures to DLQ

### 3️⃣ Infrastructure
- Redis (queues, locks, rate limits)
- BullMQ
- Worker Threads / Child Processes

## 📦 Canonical Job Schema

All jobs MUST conform to this structure:

```typescript
{
  jobId?: string,
  tenantId: string,
  jobType: string,
  payload: unknown,  // Opaque to Pulse
  priority?: "high" | "normal" | "low",
  idempotencyKey?: string,
  metadata?: {
    source?: string,
    traceId?: string,
    createdAt?: string
  }
}
```

**Key Principles:**
- `tenantId` → isolates multiple apps
- `jobType` → routes execution to registered handlers
- `payload` → opaque to Pulse (no inspection)
- `idempotencyKey` → prevents duplicates

## 🔌 Execution Model

Pulse uses a **handler registry model**. Users register handlers for job types:

```typescript
handlers.register("FETCH_URL", async (payload) => { /* ... */ })
handlers.register("PROCESS_TEXT", async (payload) => { /* ... */ })
```

Pulse routes jobs by `jobType` but does not know what handlers do. This keeps Pulse domain-agnostic.

## 🧱 Tech Stack

- **Language**: Node.js (TypeScript)
- **Framework**: Express
- **Queue**: BullMQ
- **Cache/Store**: Redis (ioredis)
- **Concurrency**: Worker Threads / Child Processes

**Constraints**: No ORM, no frontend, minimal dependencies, no domain logic.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Start the Control Plane (API)
npm run dev

# Start the Data Plane (Workers) - in separate terminal
npm run worker
```

## 📁 Project Structure

```
pulse/
├── src/
│   ├── api/          # Control Plane - Express routes
│   ├── queue/        # BullMQ queue setup
│   ├── workers/      # Data Plane - Job processors
│   ├── handlers/     # Handler registry system
│   ├── rate-limit/   # Redis-based rate limiting
│   ├── types/        # TypeScript types (Job schema, etc.)
│   └── utils/        # Helpers
├── env.example
└── package.json
```

## 🧠 Future Features (Design Must Allow)

- Dead Letter Queue (DLQ)
- Retry with exponential backoff
- Idempotency support
- Per-tenant rate limits
- Job lifecycle observability
- Graceful worker shutdown
- Job timeout handling

## ⏱️ Development Philosophy

- **30-minute sessions**: Keep changes small, one concept per session
- **Platform purity**: No domain logic, no business rules
- **Interview-ready**: Every decision explainable in system design interviews
- **Extensibility**: All design decisions must allow future features

## 🚫 What Pulse Does NOT Do

- Frontend/UI
- Domain-specific logic
- Business rules
- Data transformation (beyond validation)
- Authentication (beyond tenant isolation)

Pulse is **infrastructure**, not an app.
