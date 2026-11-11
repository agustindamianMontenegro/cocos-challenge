import { Balances } from '@modules/migration/domain/types/balances.interface';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { Money } from '@shared/domain/value-objects/money';

type Movement = (cash: Money, holdings: Map<number, number>, order: LegacyOrder) => Money;

const amountOf = (order: LegacyOrder) => order.price.times(order.size);
const move = (holdings: Map<number, number>, order: LegacyOrder, delta: number) =>
  holdings.set(order.instrumentId, (holdings.get(order.instrumentId) ?? 0) + delta);

const MOVEMENTS: Readonly<Record<string, Movement>> = {
  CASH_IN: (cash, _holdings, order) => cash.plus(amountOf(order)),
  CASH_OUT: (cash, _holdings, order) => cash.minus(amountOf(order)),
  BUY: (cash, holdings, order) => {
    move(holdings, order, order.size);
    return cash.minus(amountOf(order));
  },
  SELL: (cash, holdings, order) => {
    move(holdings, order, -order.size);
    return cash.plus(amountOf(order));
  },
};

/**
 * Cálculo ingenuo, como sugiere el README del challenge: todas las FILLED en orden,
 * sin validar nada. Es el "original" del reporte de conciliación.
 */
export function naiveBalances(orders: readonly LegacyOrder[]): Balances {
  const holdings = new Map<number, number>();
  const cash = orders
    .filter((order) => order.status === 'FILLED')
    .reduce((sum, order) => MOVEMENTS[order.side]?.(sum, holdings, order) ?? sum, Money.ZERO);
  return { cash: cash.toFixed(), holdings: Object.fromEntries(holdings) };
}
