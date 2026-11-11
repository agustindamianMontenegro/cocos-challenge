import { InvalidRequestError } from '@shared/domain/errors/invalid-request.error';

export class InvalidSearchError extends InvalidRequestError {
  readonly code = 'INVALID_SEARCH';

  constructor() {
    super('Indicá qué buscar: un ticker o parte del nombre.');
  }
}
