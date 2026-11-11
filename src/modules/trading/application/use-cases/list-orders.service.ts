import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { toOrderView } from '@modules/trading/application/mappers/order-view.mapper';
import { ListOrdersCommand } from '@modules/trading/application/ports/in/commands/list-orders.command';
import { ListOrdersUseCase } from '@modules/trading/application/ports/in/interfaces/list-orders.use-case';
import { OrderPageResult } from '@modules/trading/application/ports/in/results/order-page.result';
import { OrderRepository } from '@modules/trading/application/ports/out/interfaces/order.repository.port';
import { resolvePage } from '@shared/application/services/page';

/** Lista las órdenes de un usuario, paginadas. Solo lee: no bloquea la cuenta. */
export class ListOrdersService implements ListOrdersUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly accountQueries: AccountQueriesPort,
  ) {}

  async execute(command: ListOrdersCommand): Promise<OrderPageResult> {
    const page = resolvePage(command.limit, command.offset);
    await this.accountQueries.assertUserExists(command.userId);
    const { orders, total } = await this.orders.findMany({ userId: command.userId, status: command.status }, page);
    return { items: orders.map(toOrderView), total, ...page };
  }
}
