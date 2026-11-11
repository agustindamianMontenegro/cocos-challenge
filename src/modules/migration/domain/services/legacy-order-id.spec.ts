import { datasetOrders } from '@test/support/fixtures/legacy-dataset';
import { legacyOrderUuid } from './legacy-order-id';
import { naiveBalances } from './naive-balances';

describe('legacyOrderUuid', () => {
  it('es fijo para cada orden y es un UUID versión 5 válido', () => {
    expect(legacyOrderUuid(11)).toBe(legacyOrderUuid(11));
    expect(legacyOrderUuid(11)).not.toBe(legacyOrderUuid(10));
    expect(legacyOrderUuid(1)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('naiveBalances', () => {
  it('sumando todas las FILLED tal cual da $753.000 y −10 acciones del 31', () => {
    expect(naiveBalances(datasetOrders())).toEqual({ cash: '753000.00', holdings: { 47: 40, 31: -10, 54: 500 } });
  });
});
