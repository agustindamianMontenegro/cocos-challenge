import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, EntityManager } from 'typeorm';
import { MigrateLegacyOrdersUseCase } from '@modules/migration/application/ports/in/interfaces/migrate-legacy-orders.use-case';
import { MIGRATE_LEGACY_ORDERS } from '@modules/migration/application/ports/in/tokens';
import { legacyOrderUuid } from '@modules/migration/domain/services/legacy-order-id';
import { MigrationModule } from '@modules/migration/migration.module';
import { MigrationCorrectionSchema } from '@modules/migration/infrastructure/persistence/schemas/migration-correction.schema';
import { AccountEventSchema } from '@modules/account/infrastructure/persistence/schemas/account-event.schema';
import { AccountSnapshotSchema } from '@modules/account/infrastructure/persistence/schemas/account-snapshot.schema';
import { OrderSchema } from '@modules/trading/infrastructure/persistence/schemas/order.schema';
import { AccountsFixture } from './support/fixtures/accounts';
import { createTestApp } from './support/setup/app';
import { clearMutableTables } from './support/setup/database';

describe('Migración de orders_legacy', () => {
  let app: NestFastifyApplication;
  let db: EntityManager;
  let migrationContext: TestingModule;
  let migration: MigrateLegacyOrdersUseCase;
  let accounts: AccountsFixture;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DataSource).manager;
    accounts = new AccountsFixture(app);
    // La migración tiene su propio composition root, como cuando se corre por línea de comandos.
    migrationContext = await Test.createTestingModule({ imports: [MigrationModule] }).compile();
    await migrationContext.init();
    migration = migrationContext.get(MIGRATE_LEGACY_ORDERS);
  });
  beforeEach(() => clearMutableTables());
  afterAll(async () => {
    await migrationContext.close();
    await app.close();
  });

  it('importa las 11 órdenes con UUID fijo, corrige la 11 y deja la cuenta del ADR §8', async () => {
    const report = await migration.execute();

    expect(report).toMatchObject({ alreadyMigrated: false, importedOrders: 11, corrections: 1 });
    expect(report.accounts).toEqual([
      {
        userId: 1,
        original: { cash: '753000.00', holdings: { 47: 40, 31: -10, 54: 500 } },
        corrected: { cash: '707100.00', reserved: '125500.00', available: '581600.00', holdings: { 47: 40, 54: 500, 31: 20 } },
      },
    ]);
    const order11 = await db.findOneBy(OrderSchema, { legacyOrderId: 11 });
    expect(order11).toMatchObject({ id: legacyOrderUuid(11), status: 'REJECTED', rejectionReason: 'INSUFFICIENT_SHARES' });
    expect(order11?.createdAt.toISOString()).toBe('2023-07-13T15:13:20.000Z');
    expect(order11?.updatedAt).toEqual(order11?.createdAt);
    expect(await db.find(MigrationCorrectionSchema, { select: { legacyOrderId: true, originalValue: true, correctedValue: true } }))
      .toEqual([{ legacyOrderId: 11, originalValue: 'FILLED', correctedValue: 'REJECTED' }]);
  });

  it('guarda 8 hechos con la fecha original y una foto inicial', async () => {
    await migration.execute();

    const events = await db.find(AccountEventSchema, { where: { userId: 1 }, order: { version: 'ASC' } });
    expect(events).toHaveLength(8);
    expect(events[0]).toMatchObject({ type: 'CashDeposited', orderId: legacyOrderUuid(1) });
    expect(events[0].occurredAt.toISOString()).toBe('2023-07-12T12:11:20.000Z');
    expect(await db.find(AccountSnapshotSchema, { select: { userId: true, version: true } })).toEqual([
      { userId: 1, version: 8 },
    ]);
  });

  it('se puede correr varias veces sin duplicar nada', async () => {
    await migration.execute();
    const second = await migration.execute();

    expect(second.alreadyMigrated).toBe(true);
    expect(second.accounts[0].corrected.cash).toBe('707100.00');
    expect(await db.count(OrderSchema)).toBe(11);
    expect(await db.count(AccountEventSchema)).toBe(8);
    expect(await db.count(MigrationCorrectionSchema)).toBe(1);
  });

  it('el portfolio del usuario 1 queda valuado con los últimos cierres', async () => {
    await migration.execute();

    const response = await request(app.getHttpServer()).get('/portfolio/1').expect(200);

    expect(response.body).toMatchObject({
      userId: 1,
      accountNumber: '10001',
      totalValue: '888940.00',
      valuationComplete: true,
      balance: { total: '707100.00', reserved: '125500.00', available: '581600.00' },
    });
    expect(response.body.positions).toEqual([
      expect.objectContaining({ instrumentId: 31, quantity: 20, averagePrice: '1540.00', lastPrice: '1502.80', marketValue: '30056.00', totalReturnPct: '-2.42', dailyReturnPct: '-1.15' }),
      expect.objectContaining({ instrumentId: 47, quantity: 40, averagePrice: '930.00', lastPrice: '925.85', marketValue: '37034.00', totalReturnPct: '-0.45', dailyReturnPct: '0.44' }),
      expect.objectContaining({ instrumentId: 54, quantity: 500, averagePrice: '250.00', lastPrice: '229.50', marketValue: '114750.00', totalReturnPct: '-8.20', dailyReturnPct: '-1.08' }),
    ]);
  });

  it('las LIMIT migradas (5 y 7) se pueden cancelar y liberan lo comprometido', async () => {
    await migration.execute();

    await request(app.getHttpServer()).patch(`/orders/${legacyOrderUuid(5)}/cancel`).expect(200);

    const account = await accounts.load(1);
    expect(account.reservedCash().toFixed()).toBe('90000.00');
    expect(account.availableCash().toFixed()).toBe('617100.00');
    await request(app.getHttpServer()).patch(`/orders/${legacyOrderUuid(2)}/cancel`).expect(409);
  });

  it('no migra encima de una cuenta que ya operó', async () => {
    await accounts.deposit(1, 10);
    await expect(migration.execute()).rejects.toThrow('ya tiene hechos');
    expect(await db.count(OrderSchema)).toBe(0);
  });
});
