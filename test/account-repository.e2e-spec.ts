import { randomUUID } from 'node:crypto';
import { Account } from '@modules/account/domain/entities/account';
import { InsufficientFundsError } from '@modules/account/domain/errors/insufficient-funds.error';
import { StaleAccountError } from '@modules/account/infrastructure/persistence/errors/stale-account.error';
import { fromStoredEvent } from '@modules/account/infrastructure/persistence/mappers/account-event.mapper';
import { TypeOrmAccountRepository } from '@modules/account/infrastructure/persistence/repositories/typeorm-account.repository';
import { AccountEventSchema } from '@modules/account/infrastructure/persistence/schemas/account-event.schema';
import { AccountSnapshotSchema } from '@modules/account/infrastructure/persistence/schemas/account-snapshot.schema';
import { AccountStreamSchema } from '@modules/account/infrastructure/persistence/schemas/account-stream.schema';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { Money } from '@shared/domain/value-objects/money';
import { asEntityManager } from '@shared/infrastructure/persistence/typeorm-transaction';
import { TypeOrmUnitOfWork } from '@shared/infrastructure/persistence/typeorm-unit-of-work';
import { createDataSource } from '@src/database/create-data-source';
import { clearMutableTables } from './support/setup/database';
import { testDatabaseUrl } from './support/setup/test-env';

const SNAPSHOT_EVERY = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TypeOrmAccountRepository (PostgreSQL)', () => {
  const dataSource = createDataSource(testDatabaseUrl());
  const db = dataSource.manager;
  const unitOfWork = new TypeOrmUnitOfWork(dataSource);
  const repository = new TypeOrmAccountRepository(dataSource, SNAPSHOT_EVERY);

  /** Ejecuta un cambio sobre la cuenta en su propia transacción, como lo haría un caso de uso. */
  const operate = (userId: number, change: (account: Account, tx: Transaction) => void) =>
    unitOfWork.run(async (tx) => {
      const account = await repository.loadForUpdate(tx, userId);
      change(account, tx);
      await repository.save(tx, account);
      return account;
    });

  const load = (userId: number) => unitOfWork.run((tx) => repository.loadForUpdate(tx, userId));

  /** Reconstrucción ignorando las fotos: todos los hechos desde el principio. */
  const replayFromScratch = async (userId: number) => {
    const rows = await db.find(AccountEventSchema, { where: { userId }, order: { version: 'ASC' } });
    return Account.empty(userId).replay(rows.map((row) => fromStoredEvent(row)));
  };

  beforeAll(() => dataSource.initialize());
  beforeEach(() => clearMutableTables());
  afterAll(() => dataSource.destroy());

  it('crea la cuenta vacía la primera vez que se opera', async () => {
    const account = await load(4);

    expect(account.version).toBe(0);
    expect(account.totalCash().toFixed()).toBe('0.00');
    expect(await db.findOneBy(AccountStreamSchema, { userId: 4 })).toEqual({
      userId: 4,
      version: 0,
    });
  });

  it('load lee sin bloquear y sin crear la cuenta', async () => {
    expect((await repository.load(4)).version).toBe(0);
    expect(await db.countBy(AccountStreamSchema, { userId: 4 })).toBe(0);

    await operate(4, (account) => account.deposit(Money.of(500)));
    expect((await repository.load(4)).totalCash().toFixed()).toBe('500.00');
  });

  it('guarda los hechos con versión correlativa y el orderId que los originó', async () => {
    const orderId = randomUUID();
    await operate(2, (account) => account.deposit(Money.of(1_000)));
    await unitOfWork.run(async (tx) => {
      const account = await repository.loadForUpdate(tx, 2);
      account.reserveFunds(orderId, Money.of(400));
      account.release(orderId);
      await repository.save(tx, account, { orderId });
    });

    const events = await db.find(AccountEventSchema, { where: { userId: 2 }, order: { version: 'ASC' } });
    expect(events.map((e) => [e.version, e.type, e.orderId])).toEqual([
      [1, 'CashDeposited', null],
      [2, 'FundsReserved', orderId],
      [3, 'ReservationReleased', orderId],
    ]);
    expect(events[1].payload).toEqual({ orderId, amount: '400' });
    expect((await db.findOneBy(AccountStreamSchema, { userId: 2 }))?.version).toBe(3);
  });

  it('dos compras simultáneas de $80.000 con $100.000: una se ejecuta y la otra se rechaza', async () => {
    await operate(2, (account) => account.deposit(Money.of(100_000)));

    const buy = (orderId: string) =>
      unitOfWork.run(async (tx) => {
        const account = await repository.loadForUpdate(tx, 2);
        await sleep(300); // Retiene el bloqueo: si no lo hubiera, las dos leerían $100.000.
        try {
          account.buy({ orderId, instrumentId: 47, quantity: 80, price: Money.of(1_000) });
        } catch (error) {
          if (error instanceof InsufficientFundsError) return 'REJECTED';
          throw error;
        }
        await repository.save(tx, account, { orderId });
        return 'FILLED';
      });

    const started = Date.now();
    const results = await Promise.all([buy(randomUUID()), buy(randomUUID())]);
    const elapsed = Date.now() - started;

    expect([...results].sort()).toEqual(['FILLED', 'REJECTED']);
    expect(elapsed).toBeGreaterThanOrEqual(600); // La segunda esperó a que terminara la primera.
    const account = await load(2);
    expect(account.availableCash().toFixed()).toBe('20000.00');
    expect(account.sharesOf(47)).toBe(80);
    expect(await db.countBy(AccountEventSchema, { userId: 2 })).toBe(2);
  });

  it(`guarda una foto cada ${SNAPSHOT_EVERY} hechos`, async () => {
    await operate(3, (account) => account.deposit(Money.of(10_000)));
    for (let i = 0; i < 7; i++) {
      await operate(3, (account) =>
        account.buy({ orderId: randomUUID(), instrumentId: 31, quantity: 1, price: Money.of(100 + i) }),
      );
    }

    const snapshots = await db.find(AccountSnapshotSchema, { where: { userId: 3 }, order: { version: 'ASC' } });
    expect(snapshots.map((s) => s.version)).toEqual([3, 6]);
  });

  it('la foto más los hechos posteriores dan lo mismo que recorrer todo desde el principio', async () => {
    await operate(3, (account) => account.deposit(Money.of(10_000)));
    for (let i = 0; i < 7; i++) {
      await operate(3, (account) => {
        account.buy({ orderId: randomUUID(), instrumentId: 31, quantity: 3, price: Money.of(100 + i) });
        if (i % 2 === 1) account.sell({ orderId: randomUUID(), instrumentId: 31, quantity: 2, price: Money.of(110) });
      });
    }

    const fromSnapshot = await load(3);
    const fromScratch = await replayFromScratch(3);
    expect(await db.countBy(AccountSnapshotSchema, { userId: 3 })).toBeGreaterThan(0);
    expect(fromSnapshot.version).toBe(fromScratch.version);
    expect(fromSnapshot.toSnapshot()).toEqual(fromScratch.toSnapshot());

    // Las fotos se pueden borrar: la cuenta se reconstruye igual desde los hechos.
    await db.delete(AccountSnapshotSchema, { userId: 3 });
    expect((await load(3)).toSnapshot()).toEqual(fromScratch.toSnapshot());
  });

  it('una foto de otra versión de esquema se ignora y la cuenta se reconstruye desde los hechos', async () => {
    for (let i = 0; i < 4; i++) {
      await operate(3, (account) => account.deposit(Money.of(100)));
    }
    // Simula una foto vieja (versión de esquema 0) con un estado que ya no se entiende.
    await db.update(AccountSnapshotSchema, { userId: 3 }, { schemaVersion: 0, state: { otro: 'formato' } });

    const account = await load(3);
    expect(account.totalCash().toFixed()).toBe('400.00');

    // La foto vieja no cuenta: con el próximo hecho ya hay 5 sin foto válida y se guarda una nueva.
    await operate(3, (acc) => acc.deposit(Money.of(1)));
    const snapshots = await db.find(AccountSnapshotSchema, { where: { userId: 3 }, order: { version: 'ASC' } });
    expect(snapshots.map((s) => [s.version, s.schemaVersion])).toEqual([
      [3, 0],
      [5, 1],
    ]);
  });

  it('guarda cada hecho con la versión vigente de su esquema', async () => {
    await operate(2, (account) => account.deposit(Money.of(1)));
    expect((await db.findOneBy(AccountEventSchema, { userId: 2 }))?.schemaVersion).toBe(1);
  });

  it('un error técnico al guardar deshace toda la transacción', async () => {
    await operate(2, (account) => account.deposit(Money.of(1_000)));

    const attempt = unitOfWork.run(async (tx) => {
      const account = await repository.loadForUpdate(tx, 2);
      account.withdraw(Money.of(500));
      // Simula que otro proceso movió la versión sin respetar el bloqueo.
      await asEntityManager(tx).update(AccountStreamSchema, { userId: 2 }, { version: 99 });
      await repository.save(tx, account);
    });

    await expect(attempt).rejects.toThrow(StaleAccountError);
    const account = await load(2);
    expect(account.version).toBe(1);
    expect(account.totalCash().toFixed()).toBe('1000.00');
  });
});
