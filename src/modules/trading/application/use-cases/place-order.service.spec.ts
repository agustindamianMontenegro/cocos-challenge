import { AccountCommandsService } from '@modules/account/application/use-cases/account-commands.service';
import { UserNotFoundError } from '@modules/account/domain/errors/user-not-found.error';
import { PlaceOrderCommand } from '@modules/trading/application/ports/in/commands/place-order.command';
import { requestHash } from '@modules/trading/application/services/request-hash';
import { Order } from '@modules/trading/domain/entities/order';
import { InvalidOrderError } from '@modules/trading/domain/errors/invalid-order.error';
import { OrderIdConflictError } from '@modules/trading/domain/errors/order-id-conflict.error';
import { PriceUnavailableError } from '@modules/trading/domain/errors/price-unavailable.error';
import { Money } from '@shared/domain/value-objects/money';
import { existingUsers } from '@test/support/doubles/fake-account-queries';
import { instrument, marketWith } from '@test/support/doubles/fake-market-queries';
import { FAKE_TX } from '@test/support/doubles/fake-transaction';
import { InMemoryAccountRepository } from '@test/support/doubles/in-memory-account.repository';
import { InMemoryOrderRepository } from '@test/support/doubles/in-memory-order.repository';
import { inlineUnitOfWork } from '@test/support/doubles/inline-unit-of-work';
import { newOrder } from '@test/support/fixtures/new-order';
import { ORDER_IDS } from '@test/support/fixtures/order-ids';
import { PlaceOrderService } from './place-order.service';

/** El caso de uso con todos sus puertos reemplazados por dobles en memoria. */
describe('PlaceOrderService', () => {
  let accounts: InMemoryAccountRepository;
  let orders: InMemoryOrderRepository;
  let service: PlaceOrderService;

  const buy = (change: Partial<PlaceOrderCommand> = {}): PlaceOrderCommand => ({
    orderId: ORDER_IDS.first,
    userId: 1,
    instrumentId: 47,
    side: 'BUY',
    type: 'MARKET',
    size: 10,
    ...change,
  });

  beforeEach(async () => {
    accounts = new InMemoryAccountRepository();
    orders = new InMemoryOrderRepository();
    const accountCommands = new AccountCommandsService(accounts);
    service = new PlaceOrderService({
      unitOfWork: inlineUnitOfWork,
      orders,
      accountCommands,
      accountQueries: existingUsers(1),
      market: marketWith(instrument(47, '950'), instrument(10, null), instrument(66, '1', false)),
    });
    await accountCommands.execute(FAKE_TX, 1, { type: 'DEPOSIT', amount: Money.of(10_000) });
  });

  it('MARKET: ejecuta al último cierre y queda FILLED', async () => {
    const { order, created } = await service.execute(buy());

    expect(created).toBe(true);
    expect(order).toMatchObject({ status: 'FILLED', size: 10 });
    expect(order.price.toFixed()).toBe('950.00');
    expect((await accounts.load(1)).totalCash().toFixed()).toBe('500.00');
  });

  it('por monto: floor(monto / precio)', async () => {
    const { order } = await service.execute(buy({ size: undefined, amount: Money.of('5000') }));
    expect(order.size).toBe(5);
  });

  it('LIMIT: compromete y queda NEW', async () => {
    const { order } = await service.execute(buy({ type: 'LIMIT', price: Money.of(240) }));
    expect(order.status).toBe('NEW');
    expect((await accounts.load(1)).reservedCash().toFixed()).toBe('2400.00');
  });

  it('sin saldo: REJECTED con motivo y la cuenta no cambia', async () => {
    const { order } = await service.execute(buy({ size: 11 }));
    expect(order).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_FUNDS' });
    expect((await accounts.load(1)).version).toBe(1);
  });

  it('reintento con los mismos datos: devuelve la orden y no ejecuta de nuevo', async () => {
    await service.execute(buy());
    const retry = await service.execute(buy());

    expect(retry.created).toBe(false);
    expect((await accounts.load(1)).sharesOf(47)).toBe(10);
  });

  it('mismo orderId con otros datos: conflicto', async () => {
    await service.execute(buy());
    await expect(service.execute(buy({ size: 1 }))).rejects.toThrow(OrderIdConflictError);
  });

  it('si otra transacción insertó el mismo id, devuelve esa orden', async () => {
    orders.failNextInsertWith = Order.create(
      newOrder({ type: 'MARKET', price: 950, requestHash: requestHash(buy()) }),
      new Date(),
    );

    const result = await service.execute(buy());
    expect(result.created).toBe(false);
  });

  it.each([
    ['los pesos', buy({ instrumentId: 66 }), InvalidOrderError],
    ['un instrumento sin cotización', buy({ instrumentId: 10 }), PriceUnavailableError],
    ['un usuario inexistente', buy({ userId: 2 }), UserNotFoundError],
  ])('rechaza operar %s', async (_name, command, error) => {
    await expect(service.execute(command)).rejects.toThrow(error);
  });
});
