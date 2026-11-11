import { DuplicateOrderIdError } from '@modules/trading/application/errors/duplicate-order-id.error';
import { OrderRepository } from '@modules/trading/application/ports/out/interfaces/order.repository.port';
import { OrderFilterOptions } from '@modules/trading/application/ports/out/options/order-filter.options';
import { OrderPageRecord } from '@modules/trading/application/ports/out/records/order-page.record';
import { Order } from '@modules/trading/domain/entities/order';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { PageOptions } from '@shared/application/ports/out/options/page.options';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

export class InMemoryOrderRepository implements OrderRepository {
  readonly orders = new Map<string, Order>();
  /** Simula que otra transacción insertó el mismo id justo antes. */
  failNextInsertWith: Order | null = null;

  async findById(id: OrderId): Promise<Order | null> {
    const order = this.orders.get(id.value);
    return order ? Order.restore(order.toProps()) : null;
  }

  async findMany(filter: OrderFilterOptions, page: PageOptions): Promise<OrderPageRecord> {
    const matches = [...this.orders.values()]
      .map((order) => order.toProps())
      .filter((o) => o.userId.value === filter.userId && (!filter.status || o.status === filter.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.value.localeCompare(a.id.value));
    const orders = matches.slice(page.offset, page.offset + page.limit).map((props) => Order.restore(props));
    return { orders, total: matches.length };
  }

  async save(_tx: Transaction, order: Order): Promise<void> {
    if (order.isNew && this.failNextInsertWith) {
      this.orders.set(order.id.value, this.failNextInsertWith);
      this.failNextInsertWith = null;
      throw new DuplicateOrderIdError(order.id.value);
    }
    this.orders.set(order.id.value, order);
  }
}
