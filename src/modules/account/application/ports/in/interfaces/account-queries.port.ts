import { AccountSummary } from '@modules/account/application/ports/in/views/account-summary.view';

/** Puerto de entrada público del módulo Account para consultar (sin bloquear). */
export interface AccountQueriesPort {
  /** Lanza UserNotFoundError si el usuario no existe. */
  getSummary(userId: number): Promise<AccountSummary>;

  /** Lanza UserNotFoundError si el usuario no existe. */
  assertUserExists(userId: number): Promise<void>;
}

