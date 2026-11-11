import { InsufficientFundsError } from '@modules/account/domain/errors/insufficient-funds.error';
import { InsufficientSharesError } from '@modules/account/domain/errors/insufficient-shares.error';
import { Money } from '@shared/domain/value-objects/money';
import { Account } from './account';

const trade = (orderId: string, instrumentId: number, quantity: number, price: number) => ({
  orderId,
  instrumentId,
  quantity,
  price: Money.of(price),
});

/** Las órdenes ejecutadas del dataset, con la orden 11 corregida (ver Spike §4.1). */
function datasetAccount(): Account {
  const account = Account.empty(1);
  account.deposit(Money.of(1_000_000)); // 1
  account.buy(trade('o2', 47, 50, 930)); // 2
  account.sell(trade('o4', 47, 10, 940)); // 4
  account.withdraw(Money.of(100_000)); // 8
  account.buy(trade('o9', 31, 20, 1540)); // 9
  account.buy(trade('o10', 54, 500, 250)); // 10
  return account;
}

describe('Account', () => {
  it('reproduce los saldos y tenencias del Spike con la corrección de la orden 11', () => {
    const account = datasetAccount();

    expect(account.totalCash().toFixed()).toBe('707100.00');
    expect(account.sharesOf(47)).toBe(40);
    expect(account.sharesOf(31)).toBe(20);
    expect(account.sharesOf(54)).toBe(500);
    expect(account.positions().get(47)?.averagePrice().toFixed()).toBe('930.00');
    expect(account.positions().get(31)?.averagePrice().toFixed()).toBe('1540.00');
  });

  it('rechaza la venta de la orden 11: 30 acciones teniendo 20', () => {
    const account = datasetAccount();

    expect(() => account.sell(trade('o11', 31, 30, 1530))).toThrow(InsufficientSharesError);
    expect(account.sharesOf(31)).toBe(20);
    expect(account.totalCash().toFixed()).toBe('707100.00');
  });

  it('compromete saldo de las LIMIT pendientes sin bajar el total', () => {
    const account = datasetAccount();
    account.reserveFunds('o5', Money.of(35_500));
    account.reserveFunds('o7', Money.of(90_000));

    expect(account.totalCash().toFixed()).toBe('707100.00');
    expect(account.reservedCash().toFixed()).toBe('125500.00');
    expect(account.availableCash().toFixed()).toBe('581600.00');
  });

  it('no deja gastar lo comprometido y lo libera al cancelar', () => {
    const account = Account.empty(1);
    account.deposit(Money.of(100_000));
    account.reserveFunds('limit', Money.of(80_000));

    expect(() => account.buy(trade('market', 47, 1, 30_000))).toThrow(InsufficientFundsError);

    account.release('limit');
    expect(account.availableCash().toFixed()).toBe('100000.00');
  });

  it('las acciones comprometidas en una venta LIMIT no se pueden vender de nuevo', () => {
    const account = datasetAccount();
    account.reserveShares('limit-sell', 47, 30);

    expect(account.availableShares(47)).toBe(10);
    expect(() => account.sell(trade('market', 47, 11, 950))).toThrow(InsufficientSharesError);
  });

  it('no permite retirar más de lo disponible', () => {
    const account = Account.empty(1);
    account.deposit(Money.of(100));
    expect(() => account.withdraw(Money.of(101))).toThrow(InsufficientFundsError);
  });

  it('cuenta la versión y entrega los hechos nuevos una sola vez', () => {
    const account = datasetAccount();
    expect(account.version).toBe(6);
    expect(account.pullPendingEvents()).toHaveLength(6);
    expect(account.pullPendingEvents()).toHaveLength(0);
  });

  it('última foto + hechos posteriores da lo mismo que recorrer todo', () => {
    const original = datasetAccount();
    const events = original.pullPendingEvents();

    const fullReplay = Account.empty(1).replay(events);
    const partial = Account.empty(1).replay(events.slice(0, 3));
    const fromSnapshot = Account.fromSnapshot(1, partial.version, partial.toSnapshot()).replay(
      events.slice(3),
    );

    expect(fromSnapshot.toSnapshot()).toEqual(fullReplay.toSnapshot());
    expect(fromSnapshot.version).toBe(fullReplay.version);
  });
});
