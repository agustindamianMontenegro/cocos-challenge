import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { AccountSummary } from '@modules/account/application/ports/in/views/account-summary.view';
import { AccountRepository } from '@modules/account/application/ports/out/interfaces/account.repository.port';
import { UserRepository } from '@modules/account/application/ports/out/interfaces/user.repository.port';
import { UserRecord } from '@modules/account/application/ports/out/records/user.record';
import { UserNotFoundError } from '@modules/account/domain/errors/user-not-found.error';

export class AccountQueriesService implements AccountQueriesPort {
  constructor(
    private readonly users: UserRepository,
    private readonly accounts: AccountRepository,
  ) {}

  async getSummary(userId: number): Promise<AccountSummary> {
    const user = await this.findUser(userId);
    const account = await this.accounts.load(userId);
    const positions = [...account.positions()]
      .sort(([a], [b]) => a - b)
      .map(([instrumentId, position]) => ({ instrumentId, quantity: position.quantity, cost: position.cost }));
    return {
      userId: user.id,
      accountNumber: user.accountNumber,
      balance: {
        total: account.totalCash(),
        reserved: account.reservedCash(),
        available: account.availableCash(),
      },
      positions,
    };
  }

  async assertUserExists(userId: number): Promise<void> {
    await this.findUser(userId);
  }

  private async findUser(userId: number): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    return user;
  }
}
