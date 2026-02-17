import type { MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import type { RdwClient } from './types.js'

/**
 * Rate limiter middleware configuration
 * Limits requests to 100 per minute per IP
 */
export const rateLimiterMiddleware = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'anonymous',
})

/**
 * Logger middleware - logs incoming requests
 */
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path

  await next()

  const duration = Date.now() - start
  const status = c.res.status

  console.log(`${method} ${path} - ${status} - ${duration}ms`)
}

/**
 * RDW client middleware - injects rdw client into context
 */
export function rdwMiddleware(rdw: RdwClient): MiddlewareHandler {
  return async (c, next) => {
    c.set('rdw', rdw)
    await next()
  }
}

/**
 * CORS middleware for development
 */
export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}
