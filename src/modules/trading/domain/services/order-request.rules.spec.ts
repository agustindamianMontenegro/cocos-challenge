import { InvalidOrderError } from '@modules/trading/domain/errors/invalid-order.error';
import { OrderRequest } from '@modules/trading/domain/types/order-request.interface';
import { Money } from '@shared/domain/value-objects/money';
import { limitPriceOf, resolveSize, validateOrderRequest } from './order-request.rules';

const market: OrderRequest = { orderId: 'id', userId: 1, instrumentId: 47, side: 'BUY', type: 'MARKET', size: 10 };
const limit: OrderRequest = { ...market, type: 'LIMIT', price: Money.of(240) };

describe('validateOrderRequest', () => {
  it.each([
    ['MARKET por cantidad', market],
    ['MARKET por monto', { ...market, size: undefined, amount: Money.of(10_000) }],
    ['LIMIT por cantidad', limit],
    ['LIMIT por monto', { ...limit, size: undefined, amount: Money.of(10_000) }],
  ])('acepta %s', (_name, request) => {
    expect(() => validateOrderRequest(request)).not.toThrow();
  });

  it.each([
    ['size y amount juntos', { ...market, amount: Money.of(1) }, 'no los dos'],
    ['sin size ni amount', { ...market, size: undefined }, 'Indicá size'],
    ['size cero', { ...market, size: 0 }, 'size tiene que ser'],
    ['size con decimales', { ...market, size: 1.5 }, 'size tiene que ser'],
    ['amount cero', { ...market, size: undefined, amount: Money.ZERO }, 'amount tiene que ser'],
    ['MARKET con price', { ...market, price: Money.of(1) }, 'MARKET no lleva price'],
    ['LIMIT sin price', { ...limit, price: undefined }, 'LIMIT necesita price'],
    ['price cero', { ...limit, price: Money.ZERO }, 'price tiene que ser'],
  ])('rechaza %s', (_name, request, message) => {
    expect(() => validateOrderRequest(request)).toThrow(InvalidOrderError);
    expect(() => validateOrderRequest(request)).toThrow(message);
  });
});

describe('limitPriceOf', () => {
  it('devuelve el precio límite o rechaza si falta', () => {
    expect(limitPriceOf(limit).toFixed()).toBe('240.00');
    expect(() => limitPriceOf({ ...limit, price: undefined })).toThrow(InvalidOrderError);
  });
});

describe('resolveSize', () => {
  it('usa la cantidad pedida', () => {
    expect(resolveSize(market, Money.of(950)).value).toBe(10);
  });

  it('con un monto, divide por el precio y redondea hacia abajo (ejemplo del ADR)', () => {
    expect(resolveSize({ ...market, size: undefined, amount: Money.of('10000.00') }, Money.of(950)).value).toBe(10);
  });

  it('rechaza un monto que no alcanza para una acción', () => {
    const request = { ...market, size: undefined, amount: Money.of(949) };
    expect(() => resolveSize(request, Money.of(950))).toThrow('El monto no alcanza');
  });
});
