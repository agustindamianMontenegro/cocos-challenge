import { AccountCommandsPort } from '@modules/account/application/ports/in/interfaces/account-commands.port';
import { toOrderView } from '@modules/trading/application/mappers/order-view.mapper';
import { CancelOrderUseCase } from '@modules/trading/application/ports/in/interfaces/cancel-order.use-case';
import { OrderView } from '@modules/trading/application/ports/in/views/order.view';
import { OrderRepository } from '@modules/trading/application/ports/out/interfaces/order.repository.port';
import { Order } from '@modules/trading/domain/entities/order';
import { OrderNotFoundError } from '@modules/trading/domain/errors/order-not-found.error';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Cancela una orden NEW y libera lo que tenía comprometido, en la misma transacción. */
export class CancelOrderService implements CancelOrderUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly orders: OrderRepository,
    private readonly accountCommands: AccountCommandsPort,
  ) {}

  async execute(orderId: string): Promise<OrderView> {
    const id = OrderId.of(orderId);
    const found = await this.findOrFail(id);
    return this.unitOfWork.run(async (tx) => {
      await this.accountCommands.lock(tx, found.userId.value);
      // Se vuelve a leer con la cuenta bloqueada: así no se puede cancelar dos veces.
      const order = await this.findOrFail(id, tx);
      const now = new Date();
      order.cancel(now);
      const context = { orderId: id.value, occurredAt: now };
      await this.accountCommands.execute(tx, order.userId.value, { type: 'RELEASE', orderId: id.value }, context);
      await this.orders.save(tx, order);
      return toOrderView(order);
    });
  }

  private async findOrFail(id: OrderId, tx?: Transaction): Promise<Order> {
    const order = await this.orders.findById(id, tx);
    if (!order) {
      throw new OrderNotFoundError(id.value);
    }
    return order;
  }
}
