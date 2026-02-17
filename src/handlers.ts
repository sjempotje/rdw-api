import type { Context } from 'hono'
import type { ApiResponse, VehicleData } from './types.js'
import { normalizeKenteken, isValidKenteken } from './utils.js'

/**
 * Handles the root endpoint
 */
export async function handleRoot(c: Context) {
  return c.json({
    status: 'ok',
    name: 'RDW API',
    version: '1.0.0',
    endpoints: {
      kenteken: '/api/kenteken/:kenteken',
      health: '/health',
    },
  })
}

/**
 * Handles the kenteken lookup endpoint
 */
export async function handleKentekenLookup(c: Context) {
  const rdw = c.get('rdw')
  const kenteken = c.req.param('kenteken')

  // Validate input
  if (!kenteken || !isValidKenteken(kenteken)) {
    return c.json<ApiResponse>(
      {
        success: false,
        message: 'Ongeldig kenteken formaat',
      },
      400
    )
  }

  try {
    const normalizedKenteken = normalizeKenteken(kenteken)

    const vehicle = await rdw.fetchVehicleByKenteken(normalizedKenteken)

    if (vehicle) {
      // Always fetch related RDW datasets and include them in the response.
      // Fetch in parallel but don't fail the whole response if a related dataset fails.
      const [axlesRes, fuelRes, bodyRes, bodySpecRes, vehicleClassRes] = await Promise.allSettled([
        rdw.fetchAxlesByKenteken(normalizedKenteken),
        rdw.fetchFuelByKenteken(normalizedKenteken),
        rdw.fetchBodyByKenteken(normalizedKenteken),
        rdw.fetchBodySpecificsByKenteken(normalizedKenteken),
        rdw.fetchVehicleClassByKenteken(normalizedKenteken),
      ])

      const enriched = {
        ...vehicle,
        axles: axlesRes.status === 'fulfilled' ? axlesRes.value : [],
        fuel: fuelRes.status === 'fulfilled' ? fuelRes.value : [],
        body: bodyRes.status === 'fulfilled' ? bodyRes.value : [],
        bodySpecifics: bodySpecRes.status === 'fulfilled' ? bodySpecRes.value : [],
        vehicleClass: vehicleClassRes.status === 'fulfilled' ? vehicleClassRes.value : [],

        // Also expose the datasets under the original RDW property names
        api_gekentekende_voertuigen_assen: axlesRes.status === 'fulfilled' ? axlesRes.value : [],
        api_gekentekende_voertuigen_brandstof: fuelRes.status === 'fulfilled' ? fuelRes.value : [],
        api_gekentekende_voertuigen_carrosserie:
          bodyRes.status === 'fulfilled' ? bodyRes.value : [],
        api_gekentekende_voertuigen_carrosserie_specifiek:
          bodySpecRes.status === 'fulfilled' ? bodySpecRes.value : [],
        api_gekentekende_voertuigen_voertuigklasse:
          vehicleClassRes.status === 'fulfilled' ? vehicleClassRes.value : [],
      } as VehicleData & {
        axles?: unknown[]
        fuel?: unknown[]
        body?: unknown[]
        bodySpecifics?: unknown[]
        vehicleClass?: unknown[]

        api_gekentekende_voertuigen_assen?: unknown[]
        api_gekentekende_voertuigen_brandstof?: unknown[]
        api_gekentekende_voertuigen_carrosserie?: unknown[]
        api_gekentekende_voertuigen_carrosserie_specifiek?: unknown[]
        api_gekentekende_voertuigen_voertuigklasse?: unknown[]
      }

      return c.json<ApiResponse<typeof enriched>>({
        success: true,
        data: enriched,
      })
    }

    return c.json<ApiResponse>(
      {
        success: false,
        message: 'Kenteken niet gevonden',
      },
      404
    )
  } catch (error) {
    console.error('RDW API error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: 'Fout bij het opvragen van RDW',
      },
      502
    )
  }
}

/**
 * Handles axles for a kenteken
 */
export async function handleKentekenAxles(c: Context) {
  const rdw = c.get('rdw')
  const kenteken = c.req.param('kenteken')

  if (!kenteken || !isValidKenteken(kenteken)) {
    return c.json<ApiResponse>({ success: false, message: 'Ongeldig kenteken formaat' }, 400)
  }

  try {
    const normalized = normalizeKenteken(kenteken)
    const rows = await rdw.fetchAxlesByKenteken(normalized)
    if (rows.length > 0) {
      return c.json<ApiResponse<unknown[]>>({ success: true, data: rows })
    }
    return c.json<ApiResponse>({ success: false, message: 'Niet gevonden' }, 404)
  } catch (err) {
    console.error('RDW API error (axles):', err)
    return c.json<ApiResponse>({ success: false, message: 'Fout bij RDW' }, 502)
  }
}

/**
 * Handles fuel info for a kenteken
 */
export async function handleKentekenFuel(c: Context) {
  const rdw = c.get('rdw')
  const kenteken = c.req.param('kenteken')

  if (!kenteken || !isValidKenteken(kenteken)) {
    return c.json<ApiResponse>({ success: false, message: 'Ongeldig kenteken formaat' }, 400)
  }

  try {
    const normalized = normalizeKenteken(kenteken)
    const rows = await rdw.fetchFuelByKenteken(normalized)
    if (rows.length > 0) {
      return c.json<ApiResponse<unknown[]>>({ success: true, data: rows })
    }
    return c.json<ApiResponse>({ success: false, message: 'Niet gevonden' }, 404)
  } catch (err) {
    console.error('RDW API error (fuel):', err)
    return c.json<ApiResponse>({ success: false, message: 'Fout bij RDW' }, 502)
  }
}

/**
 * Handles body/carrosserie info for a kenteken
 */
export async function handleKentekenBody(c: Context) {
  const rdw = c.get('rdw')
  const kenteken = c.req.param('kenteken')

  if (!kenteken || !isValidKenteken(kenteken)) {
    return c.json<ApiResponse>({ success: false, message: 'Ongeldig kenteken formaat' }, 400)
  }

  try {
    const normalized = normalizeKenteken(kenteken)
    const rows = await rdw.fetchBodyByKenteken(normalized)
    if (rows.length > 0) {
      return c.json<ApiResponse<unknown[]>>({ success: true, data: rows })
    }
    return c.json<ApiResponse>({ success: false, message: 'Niet gevonden' }, 404)
  } catch (err) {
    console.error('RDW API error (body):', err)
    return c.json<ApiResponse>({ success: false, message: 'Fout bij RDW' }, 502)
  }
}

/**
 * Handles vehicle class info for a kenteken
 */
export async function handleKentekenVehicleClass(c: Context) {
  const rdw = c.get('rdw')
  const kenteken = c.req.param('kenteken')

  if (!kenteken || !isValidKenteken(kenteken)) {
    return c.json<ApiResponse>({ success: false, message: 'Ongeldig kenteken formaat' }, 400)
  }

  try {
    const normalized = normalizeKenteken(kenteken)
    const rows = await rdw.fetchVehicleClassByKenteken(normalized)
    if (rows.length > 0) {
      return c.json<ApiResponse<unknown[]>>({ success: true, data: rows })
    }
    return c.json<ApiResponse>({ success: false, message: 'Niet gevonden' }, 404)
  } catch (err) {
    console.error('RDW API error (vehicle-class):', err)
    return c.json<ApiResponse>({ success: false, message: 'Fout bij RDW' }, 502)
  }
}

/**
 * Handles the health check endpoint
 */
export async function handleHealthCheck(c: Context) {
  const rdw = c.get('rdw')

  try {
    const ok = await rdw.ping()
    if (ok) {
      return c.json({
        status: 'healthy',
        rdw: 'reachable',
        timestamp: new Date().toISOString(),
      })
    }

    return c.json(
      {
        status: 'unhealthy',
        rdw: 'unreachable',
        timestamp: new Date().toISOString(),
      },
      503
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return c.json(
      {
        status: 'unhealthy',
        rdw: 'unreachable',
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
}
