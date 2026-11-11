import { MigrationError } from '@modules/migration/domain/errors/migration.error';
import { legacyOrderUuid } from '@modules/migration/domain/services/legacy-order-id';
import { datasetOrders } from '@test/support/fixtures/legacy-dataset';
import { planLegacyOrder } from './legacy-order.planner';

describe('planLegacyOrder (dataset del challenge)', () => {
  const planned = datasetOrders().map(planLegacyOrder);

  it('conserva los estados y corrige solo la orden 11', () => {
    expect(planned.map((p) => p.status)).toEqual([
      'FILLED', 'FILLED', 'CANCELLED', 'FILLED', 'NEW', 'REJECTED', 'NEW', 'FILLED', 'FILLED', 'FILLED', 'REJECTED',
    ]);
    expect(planned.filter((p) => p.correction).map((p) => p.legacy.id)).toEqual([11]);
    expect(planned[10]).toMatchObject({ rejectionReason: 'INSUFFICIENT_SHARES', command: null });
    expect(planned[5].rejectionReason).toBeNull();
  });

  it('traduce cada orden a lo que le pide a la cuenta', () => {
    expect(planned.map((p) => p.command?.type ?? null)).toEqual([
      'DEPOSIT', 'BUY', null, 'SELL', 'RESERVE_FUNDS', null, 'RESERVE_FUNDS', 'WITHDRAW', 'BUY', 'BUY', null,
    ]);
  });

  it('las LIMIT pendientes comprometen con el UUID fijo de su orden', () => {
    expect(planned[4]).toMatchObject({ orderId: legacyOrderUuid(5), command: { type: 'RESERVE_FUNDS', orderId: legacyOrderUuid(5) } });
  });

  it('frena ante combinaciones sin regla (por ejemplo, una MARKET en NEW)', () => {
    expect(() => planLegacyOrder({ ...datasetOrders()[1], status: 'NEW' })).toThrow(MigrationError);
  });

  it('frena si la orden a corregir ya no está como se esperaba', () => {
    expect(() => planLegacyOrder({ ...datasetOrders()[10], status: 'CANCELLED' })).toThrow('esperaba FILLED');
  });
});
