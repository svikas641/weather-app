export const config = {
  port: Number(process.env.PORT) || 4000,
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    apiKey: process.env.OPENWEATHER_API_KEY
  },
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 300,
  redisUrl: process.env.REDIS_URL || '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 60,
  corsOrigin: process.env.FRONTEND_ORIGIN || '*',
  http: {
    timeoutMs: 5000,
    maxRetries: 3,
    retryBaseMs: 100
  },
  circuitBreaker: {
    failureThreshold: 5, // open after this many consecutive failures
    openMs: 30_000 // stay open 30 seconds then half-open
  }
};


