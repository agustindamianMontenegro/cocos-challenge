import { InvalidRequestError } from './invalid-request.error';

/** Un objeto de valor recibió un valor que no cumple su regla (por ejemplo, una cantidad negativa). */
export class InvalidValueError extends InvalidRequestError {
  readonly code = 'INVALID_VALUE';
}
