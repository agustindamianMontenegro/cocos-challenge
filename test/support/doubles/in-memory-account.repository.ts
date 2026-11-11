import { AccountRepository } from '@modules/account/application/ports/out/interfaces/account.repository.port';
import { SaveAccountOptions } from '@modules/account/application/ports/out/options/save-account.options';
import { Account } from '@modules/account/domain/entities/account';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { StoredEvent } from './stored-event.interface';

/** Repositorio en memoria para probar los casos de uso sin base de datos. */
export class InMemoryAccountRepository implements AccountRepository {
  readonly events = new Map<number, StoredEvent[]>();
  readonly snapshots: { userId: number; version: number }[] = [];

  async lock(_tx: Transaction, userId: number): Promise<number> {
    return this.eventsOf(userId).length;
  }

  async loadForUpdate(_tx: Transaction, userId: number): Promise<Account> {
    return this.load(userId);
  }

  async load(userId: number): Promise<Account> {
    return Account.empty(userId).replay(this.eventsOf(userId).map((stored) => stored.event));
  }

  async save(_tx: Transaction, account: Account, options: SaveAccountOptions = {}): Promise<void> {
    const pending = account.pullPendingEvents().map((event) => ({ event, options }));
    this.events.set(account.userId, [...this.eventsOf(account.userId), ...pending]);
  }

  async snapshot(_tx: Transaction, account: Account): Promise<void> {
    this.snapshots.push({ userId: account.userId, version: account.version });
  }

  private eventsOf(userId: number): StoredEvent[] {
    return this.events.get(userId) ?? [];
  }
}

