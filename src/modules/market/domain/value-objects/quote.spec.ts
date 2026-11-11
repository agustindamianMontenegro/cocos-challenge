import { formatPercent } from '@shared/domain/services/percentage';
import { Money } from '@shared/domain/value-objects/money';
import { Quote } from './quote';

describe('Quote', () => {
  it('calcula el rendimiento del día contra el cierre anterior', () => {
    const quote = new Quote(31, Money.of('1502.80'), Money.of('1520.25'), null);
    expect(formatPercent(quote.dailyReturnPct())).toBe('-1.15');
  });

  it('sin cierre anterior no hay rendimiento del día', () => {
    expect(new Quote(31, Money.of(10), null, null).dailyReturnPct()).toBeNull();
  });
});
