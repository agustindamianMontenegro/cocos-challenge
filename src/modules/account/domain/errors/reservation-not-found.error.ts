import { DomainError } from '@shared/domain/errors/domain.error';

export class ReservationNotFoundError extends DomainError {
  readonly code = 'RESERVATION_NOT_FOUND';

  constructor(orderId: string) {
    super(`La orden ${orderId} no tiene nada comprometido.`);
  }
}
