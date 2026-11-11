import { Order } from '@modules/trading/domain/entities/order';
import { OrderSide } from '@modules/trading/domain/types/order-side.type';
import { OrderType } from '@modules/trading/domain/types/order-type.type';
import { newOrder } from '@test/support/fixtures/new-order';
import { ORDER_IDS } from '@test/support/fixtures/order-ids';
import { accountCommandFor, toExecutionOutcome } from './account-command.mapper';

const order = (type: OrderType, side: OrderSide) =>
  Order.create(newOrder({ side, type }), new Date());

describe('accountCommandFor', () => {
  it.each([
    ['MARKET', 'BUY', { type: 'BUY', orderId: ORDER_IDS.first, instrumentId: 47, quantity: 10 }],
    ['MARKET', 'SELL', { type: 'SELL', orderId: ORDER_IDS.first, instrumentId: 47, quantity: 10 }],
    ['LIMIT', 'SELL', { type: 'RESERVE_SHARES', orderId: ORDER_IDS.first, instrumentId: 47, quantity: 10 }],
  ] as const)('%s %s', (type, side, expected) => {
    expect(accountCommandFor(order(type, side))).toMatchObject(expected);
  });

  it('una LIMIT de compra compromete cantidad por precio límite', () => {
    const command = accountCommandFor(order('LIMIT', 'BUY'));
    expect(command).toMatchObject({ type: 'RESERVE_FUNDS', orderId: ORDER_IDS.first });
    expect(command.type === 'RESERVE_FUNDS' && command.amount.toFixed()).toBe('2400.00');
  });

  it('una orden de dinero (histórica) no se ejecuta', () => {
    expect(() => accountCommandFor(order('MARKET', 'CASH_IN'))).toThrow('no se puede ejecutar');
  });
});

describe('toExecutionOutcome', () => {
  it('traduce el resultado de la cuenta al lenguaje de la orden', () => {
    expect(toExecutionOutcome({ applied: true })).toEqual({ accepted: true });
    expect(toExecutionOutcome({ applied: false, reason: 'INSUFFICIENT_FUNDS' })).toEqual({
      accepted: false,
      reason: 'INSUFFICIENT_FUNDS',
    });
  });
});
