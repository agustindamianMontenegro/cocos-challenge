import { InvalidRequestError } from '@shared/domain/errors/invalid-request.error';

export class InvalidPageError extends InvalidRequestError {
  readonly code = 'INVALID_PAGE';
}
