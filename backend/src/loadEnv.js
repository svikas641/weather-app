import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from backend/.env first (if present)
dotenv.config();

// Also try loading env from project root ../.env to support monorepo layout
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootEnv = path.resolve(__dirname, '../.env');
  dotenv.config({ path: rootEnv, override: false });
} catch {
  // ignore if resolution fails
}


