/**
 * Pulse - Handler Registry
 * 
 * System Design Note:
 * This is the execution model for Pulse. Users register handlers
 * for specific job types. Pulse routes jobs to handlers but doesn't
 * know what they do.
 * 
 * In a distributed backend system, this pattern enables:
 * - Decoupling: Pulse doesn't need domain knowledge
 * - Extensibility: Users can add new job types without changing Pulse
 * - Testability: Handlers can be tested independently
 * - Reusability: Same Pulse instance can serve multiple apps
 */

export type JobHandler = (payload: unknown) => Promise<unknown> | unknown;

class HandlerRegistry {
  private handlers: Map<string, JobHandler> = new Map();

  /**
   * Register a handler for a job type
   * 
   * System Design Note:
   * In production, you'd want:
   * - Handler validation
   * - Handler versioning
   * - Handler metadata (timeout, retry policy, etc.)
   */
  register(jobType: string, handler: JobHandler): void {
    if (this.handlers.has(jobType)) {
      throw new Error(`Handler for jobType "${jobType}" already registered`);
    }
    this.handlers.set(jobType, handler);
  }

  /**
   * Get handler for a job type
   */
  get(jobType: string): JobHandler | undefined {
    return this.handlers.get(jobType);
  }

  /**
   * Check if a handler exists
   */
  has(jobType: string): boolean {
    return this.handlers.has(jobType);
  }

  /**
   * List all registered job types
   */
  listJobTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance
export const handlerRegistry = new HandlerRegistry();

