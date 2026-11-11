import { AccountCommandContext } from '@modules/account/application/ports/in/commands/account-command.context';
import { AccountCommand } from '@modules/account/application/ports/in/commands/account.command';
import { AccountCommandsPort } from '@modules/account/application/ports/in/interfaces/account-commands.port';
import { AccountCommandResult } from '@modules/account/application/ports/in/results/account-command.result';
import { AccountLock } from '@modules/account/application/ports/in/results/account-lock.result';
import { AccountShortage } from '@modules/account/application/ports/in/types/account-shortage.type';
import { AccountRepository } from '@modules/account/application/ports/out/interfaces/account.repository.port';
import { Account } from '@modules/account/domain/entities/account';
import { InsufficientFundsError } from '@modules/account/domain/errors/insufficient-funds.error';
import { InsufficientSharesError } from '@modules/account/domain/errors/insufficient-shares.error';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

type Handlers = {
  [K in AccountCommand['type']]: (account: Account, command: Extract<AccountCommand, { type: K }>) => void;
};

/** Qué método del agregado aplica cada comando. */
const HANDLERS: Handlers = {
  DEPOSIT: (account, c) => account.deposit(c.amount),
  WITHDRAW: (account, c) => account.withdraw(c.amount),
  BUY: (account, c) => account.buy(c),
  SELL: (account, c) => account.sell(c),
  RESERVE_FUNDS: (account, c) => account.reserveFunds(c.orderId, c.amount),
  RESERVE_SHARES: (account, c) => account.reserveShares(c.orderId, c.instrumentId, c.quantity),
  RELEASE: (account, c) => account.release(c.orderId),
};

export class AccountCommandsService implements AccountCommandsPort {
  constructor(private readonly accounts: AccountRepository) {}

  async lock(tx: Transaction, userId: number): Promise<AccountLock> {
    return { version: await this.accounts.lock(tx, userId) };
  }

  async execute(
    tx: Transaction,
    userId: number,
    command: AccountCommand,
    context: AccountCommandContext = {},
  ): Promise<AccountCommandResult> {
    const account = await this.accounts.loadForUpdate(tx, userId);
    const shortage = applyCommand(account, command);
    if (shortage) {
      return { applied: false, reason: shortage };
    }
    await this.accounts.save(tx, account, context);
    return { applied: true };
  }

  async takeSnapshot(tx: Transaction, userId: number): Promise<void> {
    await this.accounts.snapshot(tx, await this.accounts.loadForUpdate(tx, userId));
  }
}

/** Aplica el comando; si faltan recursos devuelve el motivo y la cuenta queda igual. */
function applyCommand(account: Account, command: AccountCommand): AccountShortage | null {
  try {
    (HANDLERS[command.type] as (account: Account, command: AccountCommand) => void)(account, command);
    return null;
  } catch (error) {
    if (error instanceof InsufficientFundsError || error instanceof InsufficientSharesError) {
      return error.code;
    }
    throw error;
  }
}
