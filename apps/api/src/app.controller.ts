import { Controller, Get } from '@nestjs/common';
import { AppService, type HealthCheckResponse } from './app.service.js';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  async getHealth(): Promise<HealthCheckResponse> {
    return this.appService.getHealth();
  }
}
