import { DomainError } from '@shared/domain/errors/domain.error';

export class InsufficientSharesError extends DomainError {
  readonly code = 'INSUFFICIENT_SHARES';

  constructor() {
    super('No alcanzan las acciones disponibles.');
  }
}
