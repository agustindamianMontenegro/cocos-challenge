import { OrderStatus } from '@modules/trading/domain/types/order-status.type';
import { ConflictError } from '@shared/domain/errors/conflict.error';

export class InvalidOrderTransitionError extends ConflictError {
  readonly code = 'INVALID_ORDER_TRANSITION';

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Una orden ${from} no puede pasar a ${to}.`);
  }
}
