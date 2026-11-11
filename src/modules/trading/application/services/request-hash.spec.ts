import { OrderRequest } from '@modules/trading/domain/types/order-request.interface';
import { Money } from '@shared/domain/value-objects/money';
import { requestHash } from './request-hash';

const request: OrderRequest = {
  orderId: 'a',
  userId: 1,
  instrumentId: 47,
  side: 'BUY',
  type: 'MARKET',
  amount: Money.of('10000.00'),
};

describe('requestHash', () => {
  it('el mismo pedido da la misma huella, aunque cambie cómo se escribe el importe', () => {
    expect(requestHash({ ...request, amount: Money.of('10000') })).toBe(requestHash(request));
  });

  it('no depende del orderId (es lo que se compara para un mismo id)', () => {
    expect(requestHash({ ...request, orderId: 'b' })).toBe(requestHash(request));
  });

  it.each([
    ['userId', { userId: 2 }],
    ['side', { side: 'SELL' as const }],
    ['amount', { amount: Money.of('10000.01') }],
    ['size en lugar de amount', { amount: undefined, size: 10 }],
  ])('cambia si cambia %s', (_name, change) => {
    expect(requestHash({ ...request, ...change })).not.toBe(requestHash(request));
  });
});
