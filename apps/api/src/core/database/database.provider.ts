import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env.js';
import { DRIZZLE_CLIENT, PG_CONNECTION_POOL } from './database.constants.js';

const { Pool } = pg;

export const databaseProviders = [
  {
    provide: PG_CONNECTION_POOL,
    useFactory: () => {
      return new Pool({
        connectionString: env.DATABASE_URL,
      });
    },
  },
  {
    provide: DRIZZLE_CLIENT,
    inject: [PG_CONNECTION_POOL],
    useFactory: (pool: pg.Pool) => {
      return drizzle(pool);
    },
  },
];
