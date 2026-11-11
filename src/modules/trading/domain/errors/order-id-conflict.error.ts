import { ConflictError } from '@shared/domain/errors/conflict.error';

export class OrderIdConflictError extends ConflictError {
  readonly code = 'ORDER_ID_CONFLICT';

  constructor(orderId: string) {
    super(`El orderId ${orderId} ya se usó con otros datos.`);
  }
}
