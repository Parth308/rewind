import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@rewind/shared';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/rewind';

// Singleton pool to avoid too many connections in dev
const globalForPg = global as unknown as { pool: Pool };

export const pool = globalForPg.pool || new Pool({ connectionString: DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export const db = drizzle(pool, { schema });
