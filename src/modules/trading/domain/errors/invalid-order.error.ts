import { InvalidRequestError } from '@shared/domain/errors/invalid-request.error';

export class InvalidOrderError extends InvalidRequestError {
  readonly code = 'INVALID_ORDER';
}
