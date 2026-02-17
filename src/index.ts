import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createRdwClient, testRdwClient } from './rdw.js'
import {
  rateLimiterMiddleware,
  loggerMiddleware,
  rdwMiddleware,
  corsMiddleware,
} from './middlewares.js'
import { handleRoot, handleKentekenLookup, handleHealthCheck, handleKentekenAxles, handleKentekenFuel, handleKentekenBody, handleKentekenVehicleClass } from './handlers.js'

const app = new Hono()
const rdw = createRdwClient()

// Global middlewares
app.use('*', loggerMiddleware)
app.use('*', corsMiddleware)
app.use('*', rdwMiddleware(rdw))
app.use('*', rateLimiterMiddleware)

// Routes
app.get('/', handleRoot)
app.get('/api/kenteken/:kenteken', handleKentekenLookup)
app.get('/api/kenteken/:kenteken/axles', handleKentekenAxles)
app.get('/api/kenteken/:kenteken/fuel', handleKentekenFuel)
app.get('/api/kenteken/:kenteken/body', handleKentekenBody)
app.get('/api/kenteken/:kenteken/vehicle-class', handleKentekenVehicleClass)
app.get('/health', handleHealthCheck)

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Endpoint niet gevonden',
    },
    404
  )
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(
    {
      success: false,
      message: 'Er is een onverwachte fout opgetreden',
    },
    500
  )
})

// Start server
const port = Number(process.env.PORT) || 3000

// Test RDW API availability before starting
testRdwClient(rdw).then((isConnected: boolean) => {
  if (!isConnected) {
    console.warn('Warning: Could not reach RDW API. Server will start anyway.')
  }

  serve(
    {
      fetch: app.fetch,
      hostname: process.env.HOST || '0.0.0.0',
      port,
    },
    (info) => {
      const hostname = process.env.HOST || '0.0.0.0'
      console.log(`RDW API server is running on http://${hostname}:${info.port}`)
      console.log(`Health check: http://${hostname}:${info.port}/health`)
    }
  )
})
