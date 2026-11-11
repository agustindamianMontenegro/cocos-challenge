import { ErrorBody } from './error-body.interface';

/** Código HTTP y cuerpo de una respuesta de error. */
export interface ErrorResponse {
  status: number;
  body: ErrorBody;
}
