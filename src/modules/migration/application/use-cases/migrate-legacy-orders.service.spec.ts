import { AccountCommandsService } from '@modules/account/application/use-cases/account-commands.service';
import { AccountQueriesService } from '@modules/account/application/use-cases/account-queries.service';
import { MigrationError } from '@modules/migration/domain/errors/migration.error';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { InMemoryAccountRepository } from '@test/support/doubles/in-memory-account.repository';
import { InMemoryLegacyOrdersRepository } from '@test/support/doubles/in-memory-legacy-orders.repository';
import { inlineUnitOfWork } from '@test/support/doubles/inline-unit-of-work';
import { datasetOrders } from '@test/support/fixtures/legacy-dataset';
import { MigrateLegacyOrdersService } from './migrate-legacy-orders.service';

function setup(orders: LegacyOrder[] = datasetOrders()) {
  const accounts = new InMemoryAccountRepository();
  const legacyOrders = new InMemoryLegacyOrdersRepository(orders);
  const service = new MigrateLegacyOrdersService({
    unitOfWork: inlineUnitOfWork,
    legacyOrders,
    accountCommands: new AccountCommandsService(accounts),
    accountQueries: new AccountQueriesService({ findById: async (id) => ({ id, accountNumber: '10001' }) }, accounts),
  });
  return { accounts, legacyOrders, service };
}

describe('MigrateLegacyOrdersService', () => {
  it('reproduce el resultado esperado del ADR §8 y el reporte de conciliación', async () => {
    const { service, legacyOrders, accounts } = setup();

    const report = await service.execute();

    expect(report).toMatchObject({ alreadyMigrated: false, importedOrders: 11, corrections: 1 });
    expect(report.accounts).toEqual([
      {
        userId: 1,
        original: { cash: '753000.00', holdings: { 47: 40, 31: -10, 54: 500 } },
        corrected: { cash: '707100.00', reserved: '125500.00', available: '581600.00', holdings: { 31: 20, 47: 40, 54: 500 } },
      },
    ]);
    expect(legacyOrders.migrated).toHaveLength(11);
    expect(accounts.events.get(1)).toHaveLength(8);
    expect(accounts.events.get(1)?.[0].options.occurredAt?.toISOString()).toBe('2023-07-12T12:11:20.000Z');
    expect(accounts.snapshots).toEqual([{ userId: 1, version: 8 }]);
  });

  it('la segunda vez no hace nada', async () => {
    const { service, accounts } = setup();
    await service.execute();

    const second = await service.execute();

    expect(second.alreadyMigrated).toBe(true);
    expect(second.accounts[0].corrected.cash).toBe('707100.00');
    expect(accounts.events.get(1)).toHaveLength(8);
  });

  it('frena si una orden ejecutada no cierra y no es una corrección conocida', async () => {
    const orders = datasetOrders();
    orders[3] = { ...orders[3], size: 1_000 }; // Vende 1.000 de 50.
    await expect(setup(orders).service.execute()).rejects.toThrow(MigrationError);
    await expect(setup(orders).service.execute()).rejects.toThrow('La orden 4');
  });

  it('frena si una LIMIT pendiente no tiene con qué comprometerse', async () => {
    const orders = datasetOrders();
    orders[6] = { ...orders[6], size: 1_000 };
    await expect(setup(orders).service.execute()).rejects.toThrow('La orden 7');
  });
});
