import { Order } from '@modules/trading/domain/entities/order';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Puerto de salida: persistencia de órdenes. */
export interface OrderRepository {
  /** Sin transacción lee fuera de ella; con transacción, dentro (con la cuenta ya bloqueada). */
  findById(id: OrderId, tx?: Transaction): Promise<Order | null>;

  /**
   * Inserta la orden si es nueva o actualiza su estado, y guarda sus cambios de estado.
   * Si el id ya existe al insertar, lanza DuplicateOrderIdError.
   */
  save(tx: Transaction, order: Order): Promise<void>;
}

