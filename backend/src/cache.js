import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

const lru = new LRUCache({
  max: 500,
  ttl: config.cacheTtlSeconds * 1000
});

export const redisClient = config.redisUrl
  ? new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 })
  : null;

if (redisClient) {
  redisClient.on('error', (err) => logger.warn({ err }, 'Redis error'));
  redisClient.on('connect', () => logger.info('Redis connected'));
  // connect lazily (on first use we ensure connect)
}

const redisKey = (cityKey) => `weather:${cityKey}`;

export const cache = {
  async get(cityKey) {
    const key = cityKey.toLowerCase();
    // Check LRU
    const inMemory = lru.get(key);
    if (inMemory) return { value: inMemory, layer: 'LRU' };

    if (redisClient) {
      try {
        if (!redisClient.status || redisClient.status === 'end') {
          await redisClient.connect();
        }
        const v = await redisClient.get(redisKey(key));
        if (v) {
          const parsed = JSON.parse(v);
          // populate LRU to speed up next access
          lru.set(key, parsed);
          return { value: parsed, layer: 'REDIS' };
        }
      } catch (err) {
        logger.warn({ err }, 'Redis get failed');
      }
    }
    return { value: null, layer: 'NONE' };
  },

  async set(cityKey, value, ttlSeconds = config.cacheTtlSeconds) {
    const key = cityKey.toLowerCase();
    lru.set(key, value, { ttl: ttlSeconds * 1000 });

    if (redisClient) {
      try {
        if (!redisClient.status || redisClient.status === 'end') {
          await redisClient.connect();
        }
        await redisClient.set(redisKey(key), JSON.stringify(value), 'EX', ttlSeconds);
      } catch (err) {
        logger.warn({ err }, 'Redis set failed');
      }
    }
  }
};


