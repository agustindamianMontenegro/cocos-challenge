import { Money } from '@shared/domain/value-objects/money';
import { formatPercent, percentChange } from './percentage';

describe('percentChange', () => {
  it('calcula la variación con decimales exactos', () => {
    expect(formatPercent(percentChange(Money.of(1800), Money.of(1500)))).toBe('20.00');
    expect(formatPercent(percentChange(Money.of('7837.50'), Money.of('7975.05')))).toBe('-1.72');
  });

  it('no calcula nada si la base es cero', () => {
    expect(percentChange(Money.of(10), Money.ZERO)).toBeNull();
    expect(formatPercent(null)).toBeNull();
  });
});
