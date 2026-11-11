import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AppOptions } from './app.options';
import { validationExceptionFactory } from './shared/infrastructure/http/factories/validation-exception.factory';
import { HttpExceptionFilter } from './shared/infrastructure/http/filters/http-exception.filter';
import { setupSwagger } from './shared/infrastructure/http/swagger/swagger';

/** Arma la aplicación igual para main.ts y para las pruebas. */
export async function createApp(options: AppOptions = {}): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: options.logger === false ? false : undefined,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  if (options.swagger) {
    setupSwagger(app);
  }
  return app;
}
