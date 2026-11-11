import { InvalidOrderTransitionError } from '@modules/trading/domain/errors/invalid-order-transition.error';
import { OrderNotCancellableError } from '@modules/trading/domain/errors/order-not-cancellable.error';
import { NewOrder } from '@modules/trading/domain/types/new-order.props';
import { newOrder } from '@test/support/fixtures/new-order';
import { Order } from './order';

const T0 = new Date('2026-11-10T14:00:00Z');
const T1 = new Date('2026-11-10T14:20:00Z');

const input: NewOrder = newOrder({ instrumentId: 54, requestHash: 'hash' });

describe('Order', () => {
  it('nace NEW, con las dos fechas iguales', () => {
    const order = Order.create(input, T0);

    expect(order.status).toBe('NEW');
    expect(order.isNew).toBe(true);
    expect(order.amount().toFixed()).toBe('2400.00');
    expect(order.toProps()).toMatchObject({ createdAt: T0, updatedAt: T0, rejectionReason: null });
  });

  it('se ejecuta, se rechaza con motivo o se cancela solo desde NEW', () => {
    const filled = Order.create(input, T0);
    filled.fill(T1);
    expect(filled.status).toBe('FILLED');

    const rejected = Order.create(input, T0);
    rejected.reject('INSUFFICIENT_FUNDS', T1);
    expect(rejected.toProps()).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_FUNDS' });

    const cancelled = Order.create(input, T0);
    cancelled.cancel(T1);
    expect(cancelled.toProps()).toMatchObject({ status: 'CANCELLED', createdAt: T0, updatedAt: T1 });
  });

  it.each(['fill', 'cancel'] as const)('no permite %s una orden que ya no está NEW', (action) => {
    const order = Order.create(input, T0);
    order.fill(T1);
    const error = action === 'cancel' ? OrderNotCancellableError : InvalidOrderTransitionError;

    expect(() => order[action](T1)).toThrow(error);
    expect(order.status).toBe('FILLED');
  });

  it.each([
    ['MARKET aceptada', { type: 'MARKET', outcome: { accepted: true }, status: 'FILLED', reason: null }],
    ['LIMIT aceptada', { type: 'LIMIT', outcome: { accepted: true }, status: 'NEW', reason: null }],
    [
      'rechazada',
      { type: 'MARKET', outcome: { accepted: false, reason: 'INSUFFICIENT_SHARES' }, status: 'REJECTED', reason: 'INSUFFICIENT_SHARES' },
    ],
  ] as const)('applyOutcome: %s', (_name, { type, outcome, status, reason }) => {
    const order = Order.create({ ...input, type }, T0);
    order.applyOutcome(outcome, T1);
    expect(order.toProps()).toMatchObject({ status, rejectionReason: reason });
  });

  it('una orden restaurada no es nueva', () => {
    const order = Order.restore({ ...Order.create(input, T0).toProps() });
    expect(order.isNew).toBe(false);
  });
});
