import { AccountCommandsPort } from '@modules/account/application/ports/in/interfaces/account-commands.port';
import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { LegacyOrdersRepository } from '@modules/migration/application/ports/out/interfaces/legacy-orders.repository.port';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';

/** Puertos que usa la migración. */
export interface MigrateLegacyOrdersDependencies {
  unitOfWork: UnitOfWork;
  legacyOrders: LegacyOrdersRepository;
  accountCommands: AccountCommandsPort;
  accountQueries: AccountQueriesPort;
}
