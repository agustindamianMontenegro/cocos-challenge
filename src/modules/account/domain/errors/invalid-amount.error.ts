import { InvalidRequestError } from '@shared/domain/errors/invalid-request.error';

export class InvalidAmountError extends InvalidRequestError {
  readonly code = 'INVALID_AMOUNT';

  constructor(detail: string) {
    super(detail);
  }
}
