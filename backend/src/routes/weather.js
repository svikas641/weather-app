import { Router } from 'express';
import { cache } from '../cache.js';
import { fetchWeatherByCity } from '../weatherService.js';
import { logger } from '../logger.js';

const router = Router();

// Validate city param
function validateCity(query) {
  const cityRaw = (query.city || '').trim();
  if (!cityRaw) {
    const err = new Error('Missing required query parameter: city');
    err.status = 400;
    throw err;
  }
  if (cityRaw.length > 80) {
    const err = new Error('City name is too long (max 80 characters).');
    err.status = 400;
    throw err;
  }
  // basic allowed chars: letters, spaces, commas, hyphens, periods
  if (!/^[a-zA-Z\s,.\-]+$/.test(cityRaw)) {
    const err = new Error(
      'City name contains invalid characters. Allowed: letters, spaces, , . -'
    );
    err.status = 400;
    throw err;
  }
  return cityRaw;
}

router.get('/', async (req, res, next) => {
  let retryCount = 0;
  let cacheStatus = 'MISS';

  try {
    const city = validateCity(req.query);
    const key = city.toLowerCase();

    // Check cache
    const cached = await cache.get(key);
    if (cached.value) {
      cacheStatus = 'HIT';
      res.setHeader('X-Cache-Status', cacheStatus);
      res.setHeader('Retry-Count', String(0));
      return res.json(cached.value);
    }

    // No cache, fetch upstream
    const { data, retryCount: rc } = await fetchWeatherByCity(city);
    retryCount = rc || 0;

    // Store in cache
    await cache.set(key, data);

    res.setHeader('X-Cache-Status', cacheStatus);
    res.setHeader('Retry-Count', String(retryCount));
    return res.json(data);
  } catch (err) {
    // If circuit open, we bypass cache but mark BYPASS
    if (err.status === 503) {
      cacheStatus = 'BYPASS';
    }
    res.setHeader('X-Cache-Status', cacheStatus);
    res.setHeader('Retry-Count', String(retryCount));
    next(err);
  } finally {
    logger.info(
      {
        path: req.path,
        city: req.query.city,
        cache: cacheStatus,
        retries: retryCount
      },
      'Handled /api/weather request'
    );
  }
});

export default router;


