import { ConflictError } from '@shared/domain/errors/conflict.error';

export class OrderNotCancellableError extends ConflictError {
  readonly code = 'ORDER_NOT_CANCELLABLE';

  constructor() {
    super('Solo se pueden cancelar órdenes en estado NEW.');
  }
}
