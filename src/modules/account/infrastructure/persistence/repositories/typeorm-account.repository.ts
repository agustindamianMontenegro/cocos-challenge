import { Between, DataSource, EntityManager, LessThanOrEqual } from 'typeorm';
import { AccountRepository } from '@modules/account/application/ports/out/interfaces/account.repository.port';
import { SaveAccountOptions } from '@modules/account/application/ports/out/options/save-account.options';
import { Account } from '@modules/account/domain/entities/account';
import { AccountEvent } from '@modules/account/domain/events/account.event';
import { AccountSnapshotState } from '@modules/account/domain/snapshots/account-snapshot-state';
import { SNAPSHOT_SCHEMA_VERSION } from '@modules/account/infrastructure/persistence/constants/schema-versions.constants';
import { CorruptedAccountStreamError } from '@modules/account/infrastructure/persistence/errors/corrupted-account-stream.error';
import { StaleAccountError } from '@modules/account/infrastructure/persistence/errors/stale-account.error';
import { fromStoredEvent, toStoredEvent } from '@modules/account/infrastructure/persistence/mappers/account-event.mapper';
import { AccountEventSchema } from '@modules/account/infrastructure/persistence/schemas/account-event.schema';
import { AccountSnapshotSchema } from '@modules/account/infrastructure/persistence/schemas/account-snapshot.schema';
import { AccountStreamSchema } from '@modules/account/infrastructure/persistence/schemas/account-stream.schema';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { asEntityManager } from '@shared/infrastructure/persistence/typeorm-transaction';

/** Adaptador del puerto AccountRepository: hechos en account_events y fotos en account_snapshots. */
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    private readonly dataSource: DataSource,
    /** Cada cuántos hechos se guarda una foto de la cuenta. */
    private readonly snapshotEvery: number,
  ) {}

  lock(tx: Transaction, userId: number): Promise<number> {
    return this.lockStream(asEntityManager(tx), userId);
  }

  async load(userId: number): Promise<Account> {
    const stream = await this.dataSource.manager.findOneBy(AccountStreamSchema, { userId });
    return stream ? this.rebuild(this.dataSource.manager, userId, stream.version) : Account.empty(userId);
  }

  async loadForUpdate(tx: Transaction, userId: number): Promise<Account> {
    const manager = asEntityManager(tx);
    const streamVersion = await this.lockStream(manager, userId);
    const account = await this.rebuild(manager, userId, streamVersion);
    if (account.version !== streamVersion) {
      throw new CorruptedAccountStreamError(
        `la cuenta ${userId} llega a la versión ${account.version} y el stream dice ${streamVersion}.`,
      );
    }
    return account;
  }

  async save(tx: Transaction, account: Account, options: SaveAccountOptions = {}): Promise<void> {
    const events = account.pullPendingEvents();
    if (events.length === 0) {
      return;
    }
    const manager = asEntityManager(tx);
    const fromVersion = account.version - events.length;
    await this.advanceStream(manager, account, fromVersion);
    await manager.insert(AccountEventSchema, eventRows(account.userId, fromVersion, events, options));
    await this.snapshotIfDue(manager, account);
  }

  async snapshot(tx: Transaction, account: Account): Promise<void> {
    await this.writeSnapshot(asEntityManager(tx), account);
  }

  // ---------- Lectura ----------

  /** Crea la fila de la cuenta si no existe y la bloquea (SELECT … FOR UPDATE) hasta el fin de la transacción. */
  private async lockStream(manager: EntityManager, userId: number): Promise<number> {
    await manager.createQueryBuilder().insert().into(AccountStreamSchema).values({ userId, version: 0 }).orIgnore().execute();
    const stream = await manager
      .createQueryBuilder(AccountStreamSchema, 'stream')
      .setLock('pessimistic_write')
      .where('stream.userId = :userId', { userId })
      .getOneOrFail();
    return stream.version;
  }

  /** Última foto válida (hasta la versión del stream) más los hechos posteriores. */
  private async rebuild(manager: EntityManager, userId: number, upTo: number): Promise<Account> {
    // Una foto de otra versión de esquema no se interpreta: se reconstruye desde los hechos.
    const snapshot = await manager.findOne(AccountSnapshotSchema, {
      where: { userId, version: LessThanOrEqual(upTo), schemaVersion: SNAPSHOT_SCHEMA_VERSION },
      order: { version: 'DESC' },
    });
    const base = snapshot
      ? Account.fromSnapshot(userId, snapshot.version, snapshot.state as AccountSnapshotState)
      : Account.empty(userId);
    const rows = await manager.find(AccountEventSchema, {
      where: { userId, version: Between(base.version + 1, upTo) },
      order: { version: 'ASC' },
    });
    return base.replay(rows.map((row) => fromStoredEvent(row)));
  }

  // ---------- Escritura ----------

  /**
   * Avanza la versión solo si nadie la movió. Con la fila bloqueada no debería pasar;
   * si pasa (por ejemplo, se guardó sin bloquear), es un error técnico.
   */
  private async advanceStream(manager: EntityManager, account: Account, fromVersion: number): Promise<void> {
    const { affected } = await manager.update(
      AccountStreamSchema,
      { userId: account.userId, version: fromVersion },
      { version: account.version },
    );
    if (affected !== 1) {
      throw new StaleAccountError(account.userId, fromVersion);
    }
  }

  private async snapshotIfDue(manager: EntityManager, account: Account): Promise<void> {
    const last = await manager
      .createQueryBuilder(AccountSnapshotSchema, 'snapshot')
      .select('MAX(snapshot.version)', 'version')
      .where('snapshot.userId = :userId AND snapshot.schemaVersion = :schemaVersion', {
        userId: account.userId,
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      })
      .getRawOne<{ version: number | null }>();
    if (account.version - (last?.version ?? 0) >= this.snapshotEvery) {
      await this.writeSnapshot(manager, account);
    }
  }

  /** Si ya hay una foto en esa versión, se reemplaza (puede ser de un esquema anterior). */
  private async writeSnapshot(manager: EntityManager, account: Account): Promise<void> {
    await manager.upsert(
      AccountSnapshotSchema,
      {
        userId: account.userId,
        version: account.version,
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        state: account.toSnapshot(),
        createdAt: new Date(),
      },
      ['userId', 'version'],
    );
  }
}

function eventRows(userId: number, fromVersion: number, events: AccountEvent[], options: SaveAccountOptions) {
  const occurredAt = options.occurredAt ?? new Date();
  return events.map((event, index) => ({
    ...toStoredEvent(event),
    userId,
    version: fromVersion + index + 1,
    orderId: options.orderId ?? null,
    occurredAt,
  }));
}
