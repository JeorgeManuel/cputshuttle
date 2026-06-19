# Shuttle Tracker 2 (Bellville <-> D6 Beta)

This project is a web-first prototype for a crowdsourced shuttle tracker.
Approved reporters share live location through phones, and pings only count if
they match a preprogrammed route corridor.

## What is included

- Next.js web scaffold with route pages and API namespace
- Bellville <-> D6 route seed with main and alternate path
- Live map prototype using Leaflet and OpenStreetMap tiles
- Reliability scoring utility and corridor validation utility
- Initial API stubs for auth, reporter approval, sessions, and live estimates
- PostgreSQL schema for beta data model and moderation audit logs
- Sprint ticket backlog with acceptance criteria

## Quick start

1. Install dependencies.
2. Run development server.
3. Open the app in a browser.

```bash
npm install
npm run dev
```

Then open http://localhost:3000 and navigate to /map.

For mobile geolocation tests, run HTTPS dev mode:

```bash
npm run dev:https
```

If Windows shows mkcert/keytool access errors, use:

```bash
npm run dev:https:win
```

This skips Java trust-store updates and uses the system trust store only.

If HTTPS is not available, you can still test end-to-end reporting from the
Reporter page using "Send test ping (no GPS)".

## Mobile Testing Without Deployment (Tunnel)

You can test real mobile GPS without deploying by tunneling your local app.

In terminal 1, start the app:

```bash
npm run dev
```

In terminal 2, start tunnel:

```bash
npm run tunnel
```

If your app starts on port 3001, run:

```bash
npm run tunnel:3001
```

Then:
1. Copy the HTTPS URL shown by localtunnel.
2. Open it on your phone.
3. Login, start reporter session, and send live GPS ping.

## Key files

- app/map/page.tsx: map page entry point
- components/MapPrototype.tsx: route rendering and live estimates
- app/api/v1/routes/route.ts: route metadata endpoint
- app/api/v1/routes/[id]/live/route.ts: live estimate endpoint (mocked)
- app/api/v1/location-pings/route.ts: route-corridor ping validation endpoint
- data/routes/bellville-d6.json: route and stop seed
- db/schema.sql: PostgreSQL schema
- docs/SPRINT_BACKLOG.md: implementation tickets

## Notes

- The map data is seeded and estimate updates are currently mocked.
- Auth now persists to local runtime JSON files for beta testing.
- Ping events are recorded to NDJSON for analysis.

## Runtime data outputs

Local runtime data is written under `data/runtime`:
- `users.json`
- `sessions.json`
- `reporter-requests.json`
- `reporter-sessions.json`
- `ping-events.ndjson`

Admin users can query recent ping events via:
- `GET /api/v1/analysis/pings?limit=200`

## Real route tracing (recommended)

Yes, you should trace the real route and replace the seeded coordinates.

Important format note:
- In [data/routes/bellville-d6.json](data/routes/bellville-d6.json), `mainPath` and `alternatePath` currently use arrays of `[lat, lng]` pairs.
- Standard GeoJSON `LineString` coordinates are `[lng, lat]`.

So if you copy from GeoJSON, convert each point from `[lng, lat]` to `[lat, lng]` before pasting.

Suggested workflow:
1. Export two `LineString` traces from your map tool (main and alternate).
2. Convert coordinate order into `[lat, lng]` arrays.
3. Paste into `mainPath` and `alternatePath`.
4. Keep `stops` as two endpoints only for this non-stop service.

Example conversion:

GeoJSON:
```json
"coordinates": [[18.6295, -33.9040], [18.6180, -33.9030]]
```

Seed format used here:
```json
"mainPath": [[-33.9040, 18.6295], [-33.9030, 18.6180]]
```
