export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export interface VehicleData {
  Kenteken: string
  Voertuigsoort?: string
  Merk?: string
  Handelsbenaming?: string

  // Enriched related datasets (optional)
  axles?: unknown[]
  fuel?: unknown[]
  body?: unknown[]
  bodySpecifics?: unknown[]
  vehicleClass?: unknown[]

  // RDW-named properties that now return dataset arrays (for compatibility)
  api_gekentekende_voertuigen_assen?: unknown[]
  api_gekentekende_voertuigen_brandstof?: unknown[]
  api_gekentekende_voertuigen_carrosserie?: unknown[]
  api_gekentekende_voertuigen_carrosserie_specifiek?: unknown[]
  api_gekentekende_voertuigen_voertuigklasse?: unknown[]

  [key: string]: unknown
}

export interface RdwClient {
  fetchVehicleByKenteken: (kenteken: string) => Promise<VehicleData | null>
  fetchAxlesByKenteken: (kenteken: string) => Promise<unknown[]>
  fetchFuelByKenteken: (kenteken: string) => Promise<unknown[]>
  fetchBodyByKenteken: (kenteken: string) => Promise<unknown[]>
  fetchBodySpecificsByKenteken: (kenteken: string) => Promise<unknown[]>
  fetchVehicleClassByKenteken: (kenteken: string) => Promise<unknown[]>
  ping: () => Promise<boolean>
}

declare module 'hono' {
  interface ContextVariableMap {
    rdw: RdwClient
  }
}
