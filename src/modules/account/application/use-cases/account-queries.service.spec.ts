import { UserRepository } from '@modules/account/application/ports/out/interfaces/user.repository.port';
import { UserNotFoundError } from '@modules/account/domain/errors/user-not-found.error';
import { Money } from '@shared/domain/value-objects/money';
import { FAKE_TX } from '@test/support/doubles/fake-transaction';
import { InMemoryAccountRepository } from '@test/support/doubles/in-memory-account.repository';
import { AccountCommandsService } from './account-commands.service';
import { AccountQueriesService } from './account-queries.service';

const users: UserRepository = {
  findById: async (id) => (id === 1 ? { id: 1, accountNumber: '10001' } : null),
};

describe('AccountQueriesService', () => {
  it('resume saldo, comprometido, disponible y posiciones ordenadas', async () => {
    const repository = new InMemoryAccountRepository();
    const commands = new AccountCommandsService(repository);
    await commands.execute(FAKE_TX, 1, { type: 'DEPOSIT', amount: Money.of(10_000) });
    await commands.execute(FAKE_TX, 1, { type: 'BUY', orderId: 'a', instrumentId: 54, quantity: 4, price: Money.of(250) });
    await commands.execute(FAKE_TX, 1, { type: 'BUY', orderId: 'b', instrumentId: 31, quantity: 2, price: Money.of(1_000) });
    await commands.execute(FAKE_TX, 1, { type: 'RESERVE_FUNDS', orderId: 'c', amount: Money.of(500) });

    const summary = await new AccountQueriesService(users, repository).getSummary(1);

    expect(summary.accountNumber).toBe('10001');
    expect(summary.balance.total.toFixed()).toBe('7000.00');
    expect(summary.balance.reserved.toFixed()).toBe('500.00');
    expect(summary.balance.available.toFixed()).toBe('6500.00');
    expect(summary.positions.map((p) => [p.instrumentId, p.quantity, p.cost.toFixed()])).toEqual([
      [31, 2, '2000.00'],
      [54, 4, '1000.00'],
    ]);
  });

  it('lanza UserNotFoundError si el usuario no existe', async () => {
    const service = new AccountQueriesService(users, new InMemoryAccountRepository());
    await expect(service.getSummary(999)).rejects.toThrow(UserNotFoundError);
    await expect(service.assertUserExists(999)).rejects.toThrow(UserNotFoundError);
  });
});
