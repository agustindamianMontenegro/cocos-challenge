import { DomainError } from '@shared/domain/errors/domain.error';

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS';

  constructor() {
    super('No alcanza el saldo disponible para operar.');
  }
}
