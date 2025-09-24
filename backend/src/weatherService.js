import axios from 'axios';
import axiosRetry from 'axios-retry';
import { config } from './config.js';
import { logger } from './logger.js';

// Simple circuit breaker state in-memory
const breakerState = {
  consecutiveFailures: 0,
  openedAt: 0,
  isOpen() {
    if (this.consecutiveFailures >= config.circuitBreaker.failureThreshold) {
      const sinceOpen = Date.now() - this.openedAt;
      return sinceOpen < config.circuitBreaker.openMs;
    }
    return false;
  },
  recordSuccess() {
    this.consecutiveFailures = 0;
    this.openedAt = 0;
  },
  recordFailure() {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures === config.circuitBreaker.failureThreshold) {
      this.openedAt = Date.now();
      logger.warn(
        { failures: this.consecutiveFailures },
        'Circuit breaker opened due to repeated upstream failures'
      );
    }
  }
};

const http = axios.create({
  timeout: config.http.timeoutMs
});

axiosRetry(http, {
  retries: config.http.maxRetries,
  retryDelay: (retryCount) =>
    Math.min(1000, config.http.retryBaseMs * 2 ** (retryCount - 1)),
  retryCondition: (error) => {
    if (error.response) {
      const status = error.response.status;
      // Retry on 5xx and 429
      return status >= 500 || status === 429;
    }
    // Retry on network/timeouts
    return true;
  },
  onRetry: (retryCount, error, reqConfig) => {
    logger.warn(
      {
        retryCount,
        reason: error.code || (error.response && error.response.status)
      },
      'Retrying upstream request'
    );
    reqConfig.headers = reqConfig.headers || {};
    reqConfig.headers['X-Retry-Count'] = String(retryCount);
  }
});

export async function fetchWeatherByCity(city) {
  if (breakerState.isOpen()) {
    const remainingMs =
      config.circuitBreaker.openMs - (Date.now() - breakerState.openedAt);
    const message =
      'Upstream weather provider temporarily unavailable (circuit open). Please try again later.';
    const err = new Error(message);
    err.status = 503;
    err.meta = { circuitOpenForMs: Math.max(0, remainingMs) };
    throw err;
  }

  const params = {
    q: city,
    appid: config.openWeather.apiKey,
    units: 'metric'
  };

  const start = Date.now();
  try {
    const res = await http.get(config.openWeather.baseUrl, { params });
    breakerState.recordSuccess();

    const retryCountHeader = res.config?.headers?.['X-Retry-Count'] || '0';
    const data = res.data;

    // Normalize response
    const normalized = {
      city: data.name,
      country: data.sys?.country || null,
      coords: {
        lat: data.coord?.lat ?? null,
        lon: data.coord?.lon ?? null
      },
      temp_c: data.main?.temp ?? null,
      feels_like: data.main?.feels_like ?? null,
      humidity: data.main?.humidity ?? null,
      wind_speed: data.wind?.speed ?? null,
      weather_main: data.weather?.[0]?.main || null,
      weather_desc: data.weather?.[0]?.description || null,
      icon_url: data.weather?.[0]?.icon
        ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
        : null,
      fetched_at: new Date().toISOString(),
      source: 'openweathermap'
    };

    logger.info(
      { city, ms: Date.now() - start, retries: Number(retryCountHeader) },
      'Fetched weather from upstream'
    );

    return { data: normalized, retryCount: Number(retryCountHeader) };
  } catch (error) {
    breakerState.recordFailure();

    const status = error.response?.status;
    const msg =
      status === 404
        ? 'City not found at upstream provider.'
        : error.message || 'Upstream call failed';

    const err = new Error(msg);
    err.status = status && status !== 200 ? status : 502;
    err.meta = {
      code: error.code,
      status,
      response: error.response?.data
    };

    logger.error(
      {
        city,
        status: err.status,
        code: error.code,
        meta: err.meta
      },
      'Upstream weather fetch failed'
    );

    throw err;
  }
}


