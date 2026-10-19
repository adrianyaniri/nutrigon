import {
  Injectable,
  Inject,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PG_CONNECTION_POOL } from './core/database/database.constants.js';

export interface HealthCheckResponse {
  status: 'ok';
  database: 'connected';
  timestamp: string;
}

@Injectable()
export class AppService {
  constructor(
    @Optional()
    @Inject(PG_CONNECTION_POOL)
    private readonly pool?: { query: (text: string) => Promise<unknown> },
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<HealthCheckResponse> {
    try {
      if (this.pool) {
        await this.pool.query('SELECT 1');
      }
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
