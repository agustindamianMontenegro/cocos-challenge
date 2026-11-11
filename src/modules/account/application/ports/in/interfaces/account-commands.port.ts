import { AccountCommandContext } from '@modules/account/application/ports/in/commands/account-command.context';
import { AccountCommand } from '@modules/account/application/ports/in/commands/account.command';
import { AccountCommandResult } from '@modules/account/application/ports/in/results/account-command.result';
import { AccountLock } from '@modules/account/application/ports/in/results/account-lock.result';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/**
 * Puerto de entrada público del módulo Account para modificar una cuenta. Lo usan Trading y la
 * migración: ninguno toca el agregado Account directamente.
 */
export interface AccountCommandsPort {
  /** Bloquea la cuenta hasta el fin de la transacción. La crea vacía si no existía. */
  lock(tx: Transaction, userId: number): Promise<AccountLock>;

  /**
   * Aplica el comando dentro de la transacción. Si no alcanzan los recursos devuelve
   * `applied: false` con el motivo y la cuenta no cambia. Otros errores se propagan.
   */
  execute(
    tx: Transaction,
    userId: number,
    command: AccountCommand,
    context?: AccountCommandContext,
  ): Promise<AccountCommandResult>;

  /** Guarda una foto de la cuenta en su versión actual. */
  takeSnapshot(tx: Transaction, userId: number): Promise<void>;
}

