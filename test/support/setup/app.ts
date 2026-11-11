import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '@src/app.factory';

/** La misma aplicación que levanta main.ts, lista para Supertest. */
export async function createTestApp(): Promise<NestFastifyApplication> {
  const app = await createApp({ logger: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
