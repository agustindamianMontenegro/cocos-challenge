import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { createApp } from './app.factory';
import { positiveIntEnv } from './shared/infrastructure/config/config';

async function bootstrap(): Promise<void> {
  const app = await createApp({ swagger: true });
  const port = positiveIntEnv('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API escuchando en http://localhost:${port} (documentación en /docs)`, 'Bootstrap');
}

void bootstrap();
