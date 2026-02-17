export interface Config {
  host: string
  port: number
  rdwCacheTtlMs: number
}

/**
 * Read and validate runtime configuration from environment variables.
 * Throws on invalid values.
 */
export function getConfig(): Config {
  const host = process.env.HOST || '0.0.0.0'
  const port = Number(process.env.PORT ?? 3000)
  const rdwCacheTtlMs = Number(process.env.RDW_CACHE_TTL_MS ?? 5 * 60 * 1000)

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}`)
  }

  if (!Number.isInteger(rdwCacheTtlMs) || rdwCacheTtlMs <= 0) {
    throw new Error(`Invalid RDW_CACHE_TTL_MS value: ${process.env.RDW_CACHE_TTL_MS}`)
  }

  return { host, port, rdwCacheTtlMs }
}
