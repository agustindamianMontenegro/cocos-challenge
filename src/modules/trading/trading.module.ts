import { Module } from '@nestjs/common';
import { AccountModule } from '@modules/account/account.module';
import { AccountCommandsPort } from '@modules/account/application/ports/in/interfaces/account-commands.port';
import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { ACCOUNT_COMMANDS, ACCOUNT_QUERIES } from '@modules/account/application/ports/in/tokens';
import { MarketQueriesPort } from '@modules/market/application/ports/in/interfaces/market-queries.port';
import { MARKET_QUERIES } from '@modules/market/application/ports/in/tokens';
import { MarketModule } from '@modules/market/market.module';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';
import { UNIT_OF_WORK } from '@shared/application/ports/out/tokens';
import { DataSource } from 'typeorm';
import { CANCEL_ORDER, PLACE_ORDER } from './application/ports/in/tokens';
import { OrderRepository } from './application/ports/out/interfaces/order.repository.port';
import { ORDER_REPOSITORY } from './application/ports/out/tokens';
import { CancelOrderService } from './application/use-cases/cancel-order.service';
import { PlaceOrderService } from './application/use-cases/place-order.service';
import { OrdersController } from './infrastructure/http/controllers/orders.controller';
import { TypeOrmOrderRepository } from '@modules/trading/infrastructure/persistence/repositories/typeorm-order.repository';

/** Lo que Nest inyecta para armar PlaceOrderService, en el orden de `inject`. */
type PlaceOrderInjections = [UnitOfWork, OrderRepository, AccountCommandsPort, AccountQueriesPort, MarketQueriesPort];

/** Composition root del módulo Trading. Usa Account y Market solo a través de sus puertos de entrada. */
@Module({
  imports: [AccountModule, MarketModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useFactory: (dataSource: DataSource) => new TypeOrmOrderRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: PLACE_ORDER,
      useFactory: (...[unitOfWork, orders, accountCommands, accountQueries, market]: PlaceOrderInjections) =>
        new PlaceOrderService({ unitOfWork, orders, accountCommands, accountQueries, market }),
      inject: [UNIT_OF_WORK, ORDER_REPOSITORY, ACCOUNT_COMMANDS, ACCOUNT_QUERIES, MARKET_QUERIES],
    },
    {
      provide: CANCEL_ORDER,
      useFactory: (unitOfWork: UnitOfWork, orders: OrderRepository, accountCommands: AccountCommandsPort) =>
        new CancelOrderService(unitOfWork, orders, accountCommands),
      inject: [UNIT_OF_WORK, ORDER_REPOSITORY, ACCOUNT_COMMANDS],
    },
  ],
})
export class TradingModule {}
