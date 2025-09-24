import express from 'express';
import cors from 'cors';
import { logger } from './logger.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { rateLimiter } from './middlewares/rateLimit.js';
import weatherRouter from './routes/weather.js';
import healthRouter from './routes/health.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// CORS
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: frontendOrigin, credentials: false }));

// Body parsing (not needed for GET but fine)
app.use(express.json());

// Request logging
app.use(requestLogger);

// Rate limiting (global)
app.use(rateLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/api/weather', weatherRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Basic root info
app.get('/', (_req, res) => {
  res.type('text/plain').send('Weather API: see /health and /api/weather?city=CityName');
});

export default app;


