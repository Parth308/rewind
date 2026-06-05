import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/rewind';

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool);
