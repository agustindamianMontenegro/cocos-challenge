import { NotFoundError } from '@shared/domain/errors/not-found.error';

export class OrderNotFoundError extends NotFoundError {
  readonly code = 'ORDER_NOT_FOUND';

  constructor(orderId: string) {
    super(`No existe la orden ${orderId}.`);
  }
}
