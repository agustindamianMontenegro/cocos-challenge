import { SaveAccountOptions } from '@modules/account/application/ports/out/options/save-account.options';
import { Account } from '@modules/account/domain/entities/account';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Puerto de salida: persistencia de la cuenta con Event Sourcing y snapshots. */
export interface AccountRepository {
  /** Crea la fila de la cuenta si no existe, la bloquea y devuelve su versión. */
  lock(tx: Transaction, userId: number): Promise<number>;

  /** Bloquea la cuenta y la reconstruye: última foto más los hechos posteriores. */
  loadForUpdate(tx: Transaction, userId: number): Promise<Account>;

  /** Lee sin bloquear, consistente hasta la versión vigente. Vacía si no existe. */
  load(userId: number): Promise<Account>;

  /** Guarda los hechos nuevos y, si corresponde, una foto. */
  save(tx: Transaction, account: Account, options?: SaveAccountOptions): Promise<void>;

  /** Guarda una foto en la versión actual de la cuenta. */
  snapshot(tx: Transaction, account: Account): Promise<void>;
}

