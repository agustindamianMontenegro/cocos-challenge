import { AccountCommandsPort } from '@modules/account/application/ports/in/interfaces/account-commands.port';
import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { MarketQueriesPort } from '@modules/market/application/ports/in/interfaces/market-queries.port';
import { OrderRepository } from '@modules/trading/application/ports/out/interfaces/order.repository.port';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';

/** Puertos que usa el envío de órdenes. */
export interface PlaceOrderDependencies {
  unitOfWork: UnitOfWork;
  orders: OrderRepository;
  accountCommands: AccountCommandsPort;
  accountQueries: AccountQueriesPort;
  market: MarketQueriesPort;
}
