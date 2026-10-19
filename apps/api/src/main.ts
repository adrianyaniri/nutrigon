import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { env } from './core/config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await app.listen(env.PORT);
}
await bootstrap();
