export const LICENCED_VEHICLES = "https://opendata.rdw.nl/resource/m9d7-ebf2.json"
export const LICENCED_VEHICLES_AXLES = "https://opendata.rdw.nl/resource/3huj-srit.json"
export const LICENCED_VEHICLES_FUEL = "https://opendata.rdw.nl/resource/8ys7-d773.json"
export const LICENCED_VEHICLES_BODY = "https://opendata.rdw.nl/resource/vezc-m2t6.json"
export const LICENCED_VEHICLES_BODY_SPECIFICS = "https://opendata.rdw.nl/resource/jhie-znh9.json"
export const LICENCED_VEHICLES_VEHICLE_CLASS = "https://opendata.rdw.nl/resource/kmfi-hrps.json"

import type { VehicleData, RdwClient } from './types.js'
import { InMemoryCache } from './cache.js'
import { getConfig } from './config.js'

const cfg = getConfig()

/**
 * Create an RDW client that fetches RDW Socrata datasets and caches results in-memory.
 */
export function createRdwClient(options: { ttlMs?: number } = {}): RdwClient {
  const ttlMs = options.ttlMs ?? cfg.rdwCacheTtlMs
  const cache = new InMemoryCache<unknown[]>(ttlMs)

  const cachedFetch = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    const hit = cache.get(key) as T | undefined
    if (hit !== undefined) return hit
    const val = await fetcher()
    cache.set(key, val as unknown as unknown[])
    return val
  }

  async function fetchDatasetByKenteken<T = unknown>(datasetUrl: string, kenteken: string, limit = 100): Promise<T[]> {
    const cacheKey = `${datasetUrl}|${kenteken}`
    return cachedFetch(cacheKey, async () => {
      const url = `${datasetUrl}?$where=kenteken='${encodeURIComponent(kenteken)}'&$limit=${limit}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`RDW API error: ${res.status} ${res.statusText}`)
      return (await res.json()) as T[]
    })
  }

  async function fetchVehicleByKenteken(kenteken: string) {
    const cacheKey = `${LICENCED_VEHICLES}|${kenteken}`
    return cachedFetch(cacheKey, async () => {
      const url = `${LICENCED_VEHICLES}?$where=kenteken='${encodeURIComponent(kenteken)}'&$limit=1`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`RDW API error: ${res.status} ${res.statusText}`)
      const data = (await res.json()) as VehicleData[]
      return data[0] ?? null
    })
  }

  async function fetchAxlesByKenteken(kenteken: string) {
    return fetchDatasetByKenteken(LICENCED_VEHICLES_AXLES, kenteken)
  }

  async function fetchFuelByKenteken(kenteken: string) {
    return fetchDatasetByKenteken(LICENCED_VEHICLES_FUEL, kenteken)
  }

  async function fetchBodyByKenteken(kenteken: string) {
    return fetchDatasetByKenteken(LICENCED_VEHICLES_BODY, kenteken)
  }

  async function fetchBodySpecificsByKenteken(kenteken: string) {
    return fetchDatasetByKenteken(LICENCED_VEHICLES_BODY_SPECIFICS, kenteken)
  }

  async function fetchVehicleClassByKenteken(kenteken: string) {
    return fetchDatasetByKenteken(LICENCED_VEHICLES_VEHICLE_CLASS, kenteken)
  }

  async function ping() {
    try {
      const res = await fetch(`${LICENCED_VEHICLES}?$limit=1`)
      return res.ok
    } catch (err) {
      return false
    }
  }

  return {
    fetchVehicleByKenteken,
    fetchAxlesByKenteken,
    fetchFuelByKenteken,
    fetchBodyByKenteken,
    fetchBodySpecificsByKenteken,
    fetchVehicleClassByKenteken,
    ping,
  }
}

export async function testRdwClient(client: RdwClient): Promise<boolean> {
  return client.ping()
}
