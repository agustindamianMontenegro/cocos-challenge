import { Module } from '@nestjs/common';
import { AccountModule } from '@modules/account/account.module';
import { AccountCommandsPort } from '@modules/account/application/ports/in/interfaces/account-commands.port';
import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { ACCOUNT_COMMANDS, ACCOUNT_QUERIES } from '@modules/account/application/ports/in/tokens';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';
import { UNIT_OF_WORK } from '@shared/application/ports/out/tokens';
import { DatabaseModule } from '@src/database/database.module';
import { DataSource } from 'typeorm';
import { MIGRATE_LEGACY_ORDERS } from './application/ports/in/tokens';
import { LegacyOrdersRepository } from './application/ports/out/interfaces/legacy-orders.repository.port';
import { LEGACY_ORDERS_REPOSITORY } from './application/ports/out/tokens';
import { MigrateLegacyOrdersService } from './application/use-cases/migrate-legacy-orders.service';
import { TypeOrmLegacyOrdersRepository } from './infrastructure/persistence/repositories/typeorm-legacy-orders.repository';

type MigrationInjections = [UnitOfWork, LegacyOrdersRepository, AccountCommandsPort, AccountQueriesPort];

/** Composition root de la migración. No expone HTTP: se usa desde la línea de comandos. */
@Module({
  imports: [DatabaseModule, AccountModule],
  providers: [
    {
      provide: LEGACY_ORDERS_REPOSITORY,
      useFactory: (dataSource: DataSource) => new TypeOrmLegacyOrdersRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: MIGRATE_LEGACY_ORDERS,
      useFactory: (...[unitOfWork, legacyOrders, accountCommands, accountQueries]: MigrationInjections) =>
        new MigrateLegacyOrdersService({ unitOfWork, legacyOrders, accountCommands, accountQueries }),
      inject: [UNIT_OF_WORK, LEGACY_ORDERS_REPOSITORY, ACCOUNT_COMMANDS, ACCOUNT_QUERIES],
    },
  ],
  exports: [MIGRATE_LEGACY_ORDERS],
})
export class MigrationModule {}
