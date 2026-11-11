import { OrderFilterOptions } from '@modules/trading/application/ports/out/options/order-filter.options';
import { OrderPageRecord } from '@modules/trading/application/ports/out/records/order-page.record';
import { Order } from '@modules/trading/domain/entities/order';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { PageOptions } from '@shared/application/ports/out/options/page.options';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Puerto de salida: persistencia de órdenes. */
export interface OrderRepository {
  /** Sin transacción lee fuera de ella; con transacción, dentro (con la cuenta ya bloqueada). */
  findById(id: OrderId, tx?: Transaction): Promise<Order | null>;

  /** Las órdenes que cumplen el filtro, de la más reciente a la más antigua, y cuántas son en total. */
  findMany(filter: OrderFilterOptions, page: PageOptions): Promise<OrderPageRecord>;

  /**
   * Inserta la orden si es nueva o actualiza su estado.
   * Si el id ya existe al insertar, lanza DuplicateOrderIdError.
   */
  save(tx: Transaction, order: Order): Promise<void>;
}

