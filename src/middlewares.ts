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

const blockedIps = new Map<string, boolean>()

function getClientIp(c: any): string {
  const header = (name: string) => {
    try {
      return c.req.header?.(name) || c.req.headers?.get?.(name)
    } catch {
      return undefined
    }
  }

  const maybeIp =
    header('x-forwarded-for') ||
    header('x-real-ip') ||
    c.req.ip ||
    c.req.raw?.socket?.remoteAddress ||
    c.req.raw?.connection?.remoteAddress ||
    'unknown'

  if (typeof maybeIp === 'string') {
    return maybeIp.split(',')[0].trim()
  }

  return 'unknown'
}

function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip)
}

function blockIp(ip: string): void {
  if (ip) {
    blockedIps.set(ip, true)
  }
}

export const hackerDetectionMiddleware: MiddlewareHandler = async (c, next) => {
  const path = c.req.path.toLowerCase()
  const ua = (c.req.header('user-agent') || '').toLowerCase()
  const clientIp = getClientIp(c)

  if (isIpBlocked(clientIp)) {
    console.warn(`Blocked request from blocked IP ${clientIp} path=${path} ua=${ua}`)
    return c.text('Forbidden', 403)
  }

  const blacklistedPaths = [
    '/wp-admin',
    '/wp-login.php',
    '/xmlrpc.php',
    '/phpmyadmin',
    '/pma',
    '/adminer',
    '/solr/admin',
    '/hudson',
    '/jenkins',
    '/.env',
    '/.git',
    '/.htaccess',
    '/etc/passwd',
    '/proc/self/environ',
  ]

  const blacklistedTokens = [
    '.env',
    '.git',
    '.htaccess',
    'etc/passwd',
    'proc/self/environ',
  ]

  const blacklistedAgents = [
    'sqlmap',
    'nikto',
    'acunetix',
    'dirbuster',
    'nmap',
    'masscan',
    'python-requests',
    'libwww-perl',
    'curl',
    'wget',
    'scanner',
    'attack',
  ]

  const isProbableProbe =
    blacklistedPaths.some((p) => path === p || path.startsWith(p + '/')) ||
    blacklistedTokens.some((token) => path.includes(token)) ||
    blacklistedAgents.some((item) => ua.includes(item))

  if (isProbableProbe) {
    console.warn(`Blocked probe request from ${clientIp} path=${path} ua=${ua}`)
    blockIp(clientIp)
    return c.text('Not Found', 404)
  }

  await next()
}
