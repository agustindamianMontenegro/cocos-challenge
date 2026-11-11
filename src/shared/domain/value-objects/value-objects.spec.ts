import { InvalidValueError } from '@shared/domain/errors/invalid-value.error';
import { InstrumentId } from './instrument-id';
import { Quantity } from './quantity';
import { UserId } from './user-id';

describe('Quantity', () => {
  it('acepta enteros mayores a cero', () => {
    expect(Quantity.of(10).value).toBe(10);
    expect(Quantity.of(3).equals(Quantity.of(3))).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN])('rechaza %p', (value) => {
    expect(() => Quantity.of(value)).toThrow(InvalidValueError);
    expect(Quantity.isValid(value)).toBe(false);
  });
});

describe('UserId e InstrumentId', () => {
  it('validan enteros positivos y no se confunden entre sí', () => {
    expect(UserId.of(1).equals(UserId.of(1))).toBe(true);
    expect(UserId.of(1).equals(InstrumentId.of(1))).toBe(false);
    expect(() => UserId.of(0)).toThrow('userId');
    expect(() => InstrumentId.of(-5)).toThrow('instrumentId');
  });
});
