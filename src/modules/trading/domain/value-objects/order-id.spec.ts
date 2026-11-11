import { InvalidValueError } from '@shared/domain/errors/invalid-value.error';
import { OrderId } from './order-id';

describe('OrderId', () => {
  it('acepta cualquier UUID y lo normaliza a minúsculas', () => {
    const id = OrderId.of('01934F7A-2B6C-7D2E-9A10-5C3E8F7B1A42');
    expect(id.value).toBe('01934f7a-2b6c-7d2e-9a10-5c3e8f7b1a42');
    expect(id.equals(OrderId.of('01934f7a-2b6c-7d2e-9a10-5c3e8f7b1a42'))).toBe(true);
  });

  it('rechaza lo que no es un UUID', () => {
    expect(() => OrderId.of('o1')).toThrow(InvalidValueError);
  });
});
