# Weather App (Backend + Frontend)

A pragmatic, production-minded weather app. Backend is Node.js + Express that queries OpenWeatherMap, with input
validation, retries with exponential backoff, rate limiting, caching (LRU and optional Redis), circuit-breaker
behavior, structured logging (pino), health-checks, metrics-friendly headers, and graceful shutdown. Frontend is a
minimal React (Vite) single-page app that calls only the backend.

## Features

- GET `/api/weather?city=<cityName>`
  - Validates input and returns normalized JSON:
    - `city, country, coords, temp_c, feels_like, humidity, wind_speed, weather_main, weather_desc, icon_url,
fetched_at, source`
  - Retries upstream calls with exponential backoff (default 3 retries) with an overall timeout
  - Rate limiting via `express-rate-limit`
  - Caching with TTL (default 5 minutes) using in-memory LRU, and optional Redis if `REDIS_URL` is set
  - Circuit-breaker-like behavior to fast-fail with 503 after repeated upstream failures
  - Structured logging via pino
  - CORS enabled for frontend dev
  - Headers:
    - `X-Cache-Status`: HIT | MISS | BYPASS
    - `Retry-Count`: number of upstream retries attempted
- GET `/health` for simple health status
- Graceful shutdown on SIGINT/SIGTERM, closes server and Redis if used

## Quick Start (Local)

1. Copy `.env.example` to `.env` and fill values (at least `OPENWEATHER_API_KEY`).
2. Backend:
   - `cd backend`
   - `npm install`
   - `npm run dev` (or `npm start` for production)
3. Frontend:
   - `cd frontend`
   - `npm install`
   - Create a `.env` file with `VITE_API_BASE_URL` (defaults to `http://localhost:4000` if omitted)
   - `npm run dev`
4. Open the frontend dev URL (shown in terminal, usually `http://localhost:5173`)

## Docker (with optional Redis)

- Ensure `.env` is present at project root.
- To run backend only (no Redis): update `.env` so `REDIS_URL` is empty. Then:
  - `docker compose up --build backend`
- To run backend with local Redis:
  - `docker compose --profile redis up --build`
  - This starts `redis` and `backend` with `REDIS_URL=redis://redis:6379`.

## Environment Variables

See `.env.example`. Notable:

- `PORT`: backend port (default 4000)
- `OPENWEATHER_API_KEY`: OpenWeatherMap API key (required)
- `CACHE_TTL_SECONDS`: cache TTL in seconds (default 300)
- `REDIS_URL`: optional Redis connection URL (e.g., `redis://localhost:6379`)
- `RATE_LIMIT_WINDOW_MS`: rate limit window (default 60000)
- `RATE_LIMIT_MAX`: requests per window per IP (default 60)
- `FRONTEND_ORIGIN`: optional allowed origin for CORS (defaults to `*`)
- Frontend: `VITE_API_BASE_URL` points to backend (default `http://localhost:4000`)

## Decisions and Defaults

- Retries: 3 attempts with exponential backoff (100ms base, max ~1.5s total). Axios timeout 5s per request.
- Circuit Breaker: Opens after 5 consecutive failures, stays open 30s; then half-open.
- Cache: Key is lowercased `city`. In-memory LRU max 500 entries; TTL configurable via env. Redis used if `REDIS_URL`.
- Rate Limit: 60 req/min/IP by default.
- Logging: pino structured logs; dev pretty-print via `pino-pretty`.

## Build and Run Scripts

- Backend:
  - `npm run dev`: nodemon with pretty logs
  - `npm start`: production start
  - `npm run lint`: placeholder (extend as needed)
- Frontend:
  - `npm run dev`: Vite dev server
  - `npm run build`: Vite production build
  - `npm run preview`: Preview production build

## API Example

Request:

```
GET /api/weather?city=Pune
```

Response:

```json
{
  "city": "Pune",
  "country": "IN",
  "coords": { "lat": 18.5196, "lon": 73.8553 },
  "temp_c": 26.7,
  "feels_like": 27.2,
  "humidity": 68,
  "wind_speed": 3.1,
  "weather_main": "Clouds",
  "weather_desc": "scattered clouds",
  "icon_url": "https://openweathermap.org/img/wn/03d@2x.png",
  "fetched_at": "2025-09-24T12:34:56.789Z",
  "source": "openweathermap"
}
```

Headers:

- `X-Cache-Status: HIT|MISS|BYPASS`
- `Retry-Count: <number>`

## Notes

- Frontend never calls OpenWeatherMap directly.
- If `REDIS_URL` is provided, Redis augments caching. Without Redis, LRU cache still provides TTL-based caching.
- For cloud Redis, set `REDIS_URL` accordingly and avoid starting the local `redis` service in compose (omit `--profile redis`).

Enjoy!
