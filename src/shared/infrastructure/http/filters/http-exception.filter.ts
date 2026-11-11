import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { toErrorResponse } from '@shared/infrastructure/http/mappers/to-error-response';

/** Todas las respuestas de error tienen la forma { error: { code, message } }. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    void host.switchToHttp().getResponse<FastifyReply>().status(status).send(body);
  }
}
