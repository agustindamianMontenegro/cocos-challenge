import { HttpException, HttpStatus } from '@nestjs/common';
import { ConflictError } from '@shared/domain/errors/conflict.error';
import { DomainError } from '@shared/domain/errors/domain.error';
import { InvalidRequestError } from '@shared/domain/errors/invalid-request.error';
import { NotFoundError } from '@shared/domain/errors/not-found.error';
import { ErrorResponse } from '@shared/infrastructure/http/types/error-response.interface';

type ErrorCategory = abstract new (...args: never[]) => DomainError;

const DOMAIN_STATUS: ReadonlyArray<[ErrorCategory, number]> = [
  [NotFoundError, HttpStatus.NOT_FOUND],
  [ConflictError, HttpStatus.CONFLICT],
  [InvalidRequestError, HttpStatus.BAD_REQUEST],
];

/** Fastify rechaza el pedido antes de llegar a Nest (JSON mal formado, contenido no soportado). */
const UNREADABLE_REQUEST = 'No se pudo leer el pedido: el cuerpo tiene que ser un JSON válido.';

/** Mensajes para los errores HTTP que genera Nest en inglés (por ejemplo, una ruta inexistente). */
const DEFAULT_MESSAGES: Readonly<Record<number, string>> = {
  [HttpStatus.NOT_FOUND]: 'No existe el recurso pedido.',
};

const HTTP_CODES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'INVALID_REQUEST',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

export const INTERNAL_ERROR: ErrorResponse = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  body: { error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. No se guardó nada.' } },
};

/**
 * Traduce cualquier error a la forma única de la API.
 * Un error que no reconocemos es técnico: 500, sin detalles internos.
 */
export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof DomainError) {
    return fromDomainError(exception);
  }
  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }
  if (isClientError(exception)) {
    return build(exception.statusCode, UNREADABLE_REQUEST);
  }
  return INTERNAL_ERROR;
}

function fromDomainError(error: DomainError): ErrorResponse {
  const match = DOMAIN_STATUS.find(([category]) => error instanceof category);
  const status = match ? match[1] : HttpStatus.CONFLICT;
  return { status, body: { error: { code: error.code, message: error.message } } };
}

function fromHttpException(exception: HttpException): ErrorResponse {
  const status = exception.getStatus();
  if (DEFAULT_MESSAGES[status] && exception.message.startsWith('Cannot ')) {
    return build(status, DEFAULT_MESSAGES[status]);
  }
  // Nest envuelve los errores de Fastify (por ejemplo, un JSON mal formado) y deja el original en `cause`.
  if (isFastifyError(exception.cause)) {
    return build(status, UNREADABLE_REQUEST);
  }
  const response = exception.getResponse();
  const message =
    typeof response === 'object' && response !== null && 'message' in response
      ? (response as { message: unknown }).message
      : exception.message;
  return build(status, Array.isArray(message) ? message.join('; ') : String(message));
}

function build(status: number, message: string): ErrorResponse {
  if (status >= 500) {
    return INTERNAL_ERROR;
  }
  return { status, body: { error: { code: HTTP_CODES[status] ?? `HTTP_${status}`, message } } };
}

/** Errores de Fastify con statusCode 4xx (por ejemplo, un JSON mal formado). */
function isClientError(error: unknown): error is { statusCode: number; message: string } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { statusCode } = error as { statusCode?: unknown };
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500;
}

/** Los errores propios de Fastify tienen códigos FST_ERR_… y mensajes en inglés. */
function isFastifyError(cause: unknown): boolean {
  const code = typeof cause === 'object' && cause !== null ? (cause as { code?: unknown }).code : undefined;
  return typeof code === 'string' && code.startsWith('FST_ERR');
}
