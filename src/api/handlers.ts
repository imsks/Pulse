/**
 * Pulse - Handler Registration API
 * 
 * System Design Note:
 * This API allows users to register handlers for job types.
 * Handlers are stored in memory (handler registry) and executed
 * when jobs of that type are processed.
 * 
 * Interview Question: "How do users register handlers?"
 * Answer: "Users POST to /handlers/register with jobType and
 * handler function. We validate the handler and store it in the
 * registry. When jobs of that type are processed, we route them
 * to the registered handler."
 */

import { Request, Response } from 'express'
import { handlerRegistry } from '../handlers/registry'

/**
 * POST /handlers/register - Register a handler
 * 
 * Note: In production, you'd want:
 * - Handler validation
 * - Handler versioning
 * - Handler metadata (timeout, retry policy)
 * - Security (sandboxing for user code)
 * 
 * For now, we'll accept handler registration via API
 * but handlers must be registered server-side for security.
 */
export async function registerHandler(req: Request, res: Response) {
    // Extract jobType from body
    const { jobType, handler } = req.body
    if (!jobType) {
        return res.status(400).json({ error: 'Job type is required' })
    }
    if (typeof jobType !== 'string' || jobType.trim() === '') {
        return res.status(400).json({ error: 'Job type must be a non-empty string' })
    }
    if (typeof handler !== 'function') {
        return res.status(400).json({ error: 'Handler must be a function' })
    }
    handlerRegistry.register(jobType, handler)
    res.status(200).json({ message: 'Handler registered successfully' })
}

/**
 * GET /handlers - List registered handlers
 * 
 * - Get list of registered job types
 * - Return handler metadata (if stored)
 */
export async function listHandlers(req: Request, res: Response) {
    try {
        const jobTypes = handlerRegistry.listJobTypes()
        res.json({
            handlers: jobTypes.map(jobType => ({
                jobType,
                registered: true,
            })),
            count: jobTypes.length,
        })
    } catch (error) {
        res.status(500).json({
            error: 'Failed to list handlers',
        })
    }
}

/**
 * GET /handlers/:jobType - Get handler info
 * 
 * - Check if handler exists
 * - Return handler metadata
 */
export async function getHandler(req: Request, res: Response) {
    try {
        const { jobType } = req.params
        const exists = handlerRegistry.has(jobType)

        if (!exists) {
            return res.status(404).json({
                error: 'Handler not found',
                jobType,
            })
        }

        res.json({
            jobType,
            registered: true,
        })
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get handler',
        })
    }
}