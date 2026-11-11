import { AccountCommandsService } from '@modules/account/application/use-cases/account-commands.service';
import { OrderNotCancellableError } from '@modules/trading/domain/errors/order-not-cancellable.error';
import { OrderNotFoundError } from '@modules/trading/domain/errors/order-not-found.error';
import { Money } from '@shared/domain/value-objects/money';
import { existingUsers } from '@test/support/doubles/fake-account-queries';
import { instrument, marketWith } from '@test/support/doubles/fake-market-queries';
import { FAKE_TX } from '@test/support/doubles/fake-transaction';
import { InMemoryAccountRepository } from '@test/support/doubles/in-memory-account.repository';
import { InMemoryOrderRepository } from '@test/support/doubles/in-memory-order.repository';
import { inlineUnitOfWork } from '@test/support/doubles/inline-unit-of-work';
import { ORDER_IDS } from '@test/support/fixtures/order-ids';
import { CancelOrderService } from './cancel-order.service';
import { PlaceOrderService } from './place-order.service';

describe('CancelOrderService', () => {
  let accounts: InMemoryAccountRepository;
  let cancel: CancelOrderService;
  let place: PlaceOrderService;

  beforeEach(async () => {
    accounts = new InMemoryAccountRepository();
    const orders = new InMemoryOrderRepository();
    const accountCommands = new AccountCommandsService(accounts);
    place = new PlaceOrderService({
      unitOfWork: inlineUnitOfWork,
      orders,
      accountCommands,
      accountQueries: existingUsers(1),
      market: marketWith(instrument(47, '950')),
    });
    cancel = new CancelOrderService(inlineUnitOfWork, orders, accountCommands);
    await accountCommands.execute(FAKE_TX, 1, { type: 'DEPOSIT', amount: Money.of(10_000) });
  });

  const limit = {
    orderId: ORDER_IDS.first,
    userId: 1,
    instrumentId: 47,
    side: 'BUY',
    type: 'LIMIT',
    size: 10,
    price: Money.of(900),
  } as const;

  it('cancela una LIMIT NEW y libera lo comprometido', async () => {
    await place.execute(limit);

    const order = await cancel.execute(ORDER_IDS.first);

    expect(order.status).toBe('CANCELLED');
    expect((await accounts.load(1)).availableCash().toFixed()).toBe('10000.00');
  });

  it('no cancela dos veces ni órdenes ejecutadas', async () => {
    await place.execute(limit);
    await cancel.execute(ORDER_IDS.first);
    await place.execute({ ...limit, orderId: ORDER_IDS.second, type: 'MARKET', price: undefined });

    await expect(cancel.execute(ORDER_IDS.first)).rejects.toThrow(OrderNotCancellableError);
    await expect(cancel.execute(ORDER_IDS.second)).rejects.toThrow(OrderNotCancellableError);
  });

  it('404 si no existe', async () => {
    await expect(cancel.execute(ORDER_IDS.missing)).rejects.toThrow(OrderNotFoundError);
  });
});
