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
- Server bind address: set `HOST` (default `0.0.0.0`)
- Port: set `PORT` (default `3000`)

## Container images & CI

- CI workflow: `.github/workflows/build-and-push-images.yml` builds and publishes multi-arch images, **generates a CycloneDX SBOM**, and **attaches a keyless in‑toto provenance attestation** to each pushed image (`ghcr.io/<owner>/rdw-api:tag`).
- Published registries:
  - GitHub Container Registry: `ghcr.io/<owner>/rdw-api`
  - Docker Hub: `docker.io/lucaem/rdw-api`

- Supply-chain guarantees added by CI:
  - **SBOM** (CycloneDX JSON) — produced with `syft` and attached to the image.
  - **Provenance** — keyless in‑toto attestation created with `cosign` (records builder, git ref, materials).

- Required repository permissions for CI workflow:
  - `id-token: write` (OIDC for keyless attestations)
  - `packages: write` (push to GHCR)

- Required repository secrets (for Docker Hub push only):
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`

- Triggering the workflow: push to `main`, create a tag (`v*`) or run the workflow manually from Actions.

- Manual build & push (example):

```bash
docker build -t lucaem/rdw-api:tagname .
docker login --username lucaem
docker push lucaem/rdw-api:tagname
```

- Run the container locally:

```bash
docker run -p 3000:3000 lucaem/rdw-api:tagname
# then visit http://localhost:3000/health
```

## Notes

- RDW Open Data has rate limits; caching reduces outbound requests.
- If you need shared caching across instances, set up Redis and we can add Redis support.

## License

This project currently has no license. Expect one in the future.
