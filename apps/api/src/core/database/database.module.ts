import { Global, Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import pg from 'pg';
import { databaseProviders } from './database.provider.js';
import { DRIZZLE_CLIENT, PG_CONNECTION_POOL } from './database.constants.js';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [DRIZZLE_CLIENT, PG_CONNECTION_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject(PG_CONNECTION_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
