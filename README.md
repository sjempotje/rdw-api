# RDW API

Lightweight REST API that proxies RDW Open Data (Socrata) vehicle datasets.

## Features

- Fetch vehicle data directly from RDW Open Data by `kenteken` (license plate)
- Additional endpoints for axles, fuel, body (carrosserie) and vehicle class
- In-memory caching (default TTL 5 minutes)
- Rate limiting and CORS enabled

## Prerequisites

- Node.js (v14+)
- npm or pnpm

## Installation

1. Clone the repository:

```bash
git clone https://github.com/sjempotje/rdw-api.git
```

2. Install dependencies:

```bash
pnpm install
```

## Usage (development)

- Start in dev mode: `pnpm dev`
- Build: `pnpm build`
- Start production: `pnpm start`

## API Endpoints

- `GET /api/kenteken/:kenteken` — vehicle basic details (includes related RDW datasets: axles, fuel, body, body-specifics, vehicle-class). The original RDW dataset properties (`api_gekentekende_voertuigen_assen`, `api_gekentekende_voertuigen_brandstof`, `api_gekentekende_voertuigen_carrosserie`, `api_gekentekende_voertuigen_carrosserie_specifiek`, `api_gekentekende_voertuigen_voertuigklasse`) now contain the dataset arrays as well.
- `GET /api/kenteken/:kenteken/axles` — axle records
- `GET /api/kenteken/:kenteken/fuel` — fuel/brandstof records
- `GET /api/kenteken/:kenteken/body` — carrosserie records
- `GET /api/kenteken/:kenteken/vehicle-class` — voertuigklasse records
- `GET /health` — service + RDW reachability

## Configuration

- RDW cache TTL (milliseconds): set `RDW_CACHE_TTL_MS` environment variable (default 300000 = 5 minutes)

## Notes

- RDW Open Data has rate limits; caching reduces outbound requests.
- If you need shared caching across instances, set up Redis and we can add Redis support.

## License
This project currently has no license. Expect one in the future.
