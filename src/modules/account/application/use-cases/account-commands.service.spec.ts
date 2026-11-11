import { ReservationNotFoundError } from '@modules/account/domain/errors/reservation-not-found.error';
import { Money } from '@shared/domain/value-objects/money';
import { FAKE_TX } from '@test/support/doubles/fake-transaction';
import { InMemoryAccountRepository } from '@test/support/doubles/in-memory-account.repository';
import { AccountCommandsService } from './account-commands.service';

describe('AccountCommandsService', () => {
  const USER = 1;
  let repository: InMemoryAccountRepository;
  let service: AccountCommandsService;

  const execute = (command: Parameters<AccountCommandsService['execute']>[2]) =>
    service.execute(FAKE_TX, USER, command, { orderId: 'o1' });

  beforeEach(async () => {
    repository = new InMemoryAccountRepository();
    service = new AccountCommandsService(repository);
    await service.execute(FAKE_TX, USER, { type: 'DEPOSIT', amount: Money.of(10_000) });
  });

  it('aplica el comando y guarda los hechos con su contexto', async () => {
    const result = await execute({ type: 'BUY', orderId: 'o1', instrumentId: 47, quantity: 10, price: Money.of(950) });

    expect(result).toEqual({ applied: true });
    const account = await repository.load(USER);
    expect(account.totalCash().toFixed()).toBe('500.00');
    expect(repository.events.get(USER)?.[1].options).toEqual({ orderId: 'o1' });
  });

  it('si falta saldo devuelve el motivo y no guarda nada', async () => {
    const result = await execute({ type: 'RESERVE_FUNDS', orderId: 'o1', amount: Money.of(10_001) });

    expect(result).toEqual({ applied: false, reason: 'INSUFFICIENT_FUNDS' });
    expect(repository.events.get(USER)).toHaveLength(1);
  });

  it('si faltan acciones devuelve INSUFFICIENT_SHARES', async () => {
    const result = await execute({ type: 'SELL', orderId: 'o1', instrumentId: 47, quantity: 1, price: Money.of(950) });
    expect(result).toEqual({ applied: false, reason: 'INSUFFICIENT_SHARES' });
  });

  it('compromete y libera', async () => {
    await execute({ type: 'RESERVE_FUNDS', orderId: 'o1', amount: Money.of(4_000) });
    expect((await repository.load(USER)).availableCash().toFixed()).toBe('6000.00');

    await execute({ type: 'RELEASE', orderId: 'o1' });
    expect((await repository.load(USER)).availableCash().toFixed()).toBe('10000.00');
  });

  it('cualquier otro error de negocio se propaga', async () => {
    await expect(execute({ type: 'RELEASE', orderId: 'nada' })).rejects.toThrow(ReservationNotFoundError);
  });

  it('informa la versión al bloquear y guarda fotos a pedido', async () => {
    expect(await service.lock(FAKE_TX, USER)).toEqual({ version: 1 });
    await service.takeSnapshot(FAKE_TX, USER);
    expect(repository.snapshots).toEqual([{ userId: USER, version: 1 }]);
  });
});
