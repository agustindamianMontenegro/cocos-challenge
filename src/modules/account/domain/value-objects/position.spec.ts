import { Money } from '@shared/domain/value-objects/money';
import { Position } from './position';

describe('Position', () => {
  it('calcula el PPC ponderado y lo mantiene al vender una parte (ejemplo del Spike)', () => {
    const bought = Position.EMPTY.buy(10, Money.of(1000)).buy(10, Money.of(2000));
    expect(bought.averagePrice().toFixed()).toBe('1500.00');

    expect(bought.realizedResult(5, Money.of(1600)).toFixed()).toBe('500.00');

    const remaining = bought.sell(5);
    expect(remaining.quantity).toBe(15);
    expect(remaining.averagePrice().toFixed()).toBe('1500.00');
    expect(remaining.cost.toFixed()).toBe('22500.00');
  });

  it('reinicia el costo cuando la posición llega a cero', () => {
    const closed = Position.EMPTY.buy(10, Money.of(1000)).sell(10);
    expect(closed.isEmpty()).toBe(true);

    const reopened = closed.buy(5, Money.of(3000));
    expect(reopened.averagePrice().toFixed()).toBe('3000.00');
  });

  it('no pierde precisión con PPC periódicos', () => {
    const position = Position.EMPTY.buy(1, Money.of(10)).buy(2, Money.of(10.01));
    const afterSale = position.sell(1);
    expect(afterSale.cost.plus(position.averagePrice()).equals(position.cost)).toBe(true);
  });
});
