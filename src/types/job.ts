/**
 * Pulse - Canonical Job Schema
 * 
 * System Design Note:
 * This schema is the contract between Pulse and its users.
 * Pulse MUST NOT inspect payload contents - it's opaque.
 * 
 * In a distributed backend system, this schema enables:
 * - Multi-tenancy (tenantId isolation)
 * - Job routing (jobType → handler)
 * - Idempotency (idempotencyKey)
 * - Observability (metadata.traceId)
 * - Priority handling (priority field)
 */

export type JobPriority = "high" | "normal" | "low";

export interface JobMetadata {
  source?: string;
  traceId?: string;
  createdAt?: string;
  [key: string]: unknown; // Allow extensibility
}

export interface PulseJob {
  jobId?: string;
  tenantId: string;
  jobType: string;
  payload: unknown; // Opaque to Pulse
  priority?: JobPriority;
  idempotencyKey?: string;
  metadata?: JobMetadata;
}

/**
 * Job validation result
 */
export interface JobValidationResult {
  valid: boolean;
  errors?: string[];
}

