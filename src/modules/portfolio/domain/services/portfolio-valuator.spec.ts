import { Balance } from '@modules/portfolio/domain/types/balance.interface';
import { Holding } from '@modules/portfolio/domain/types/holding.interface';
import { formatPercent } from '@shared/domain/services/percentage';
import { Money } from '@shared/domain/value-objects/money';
import { valuePortfolio, valuePosition } from './portfolio-valuator';

const balance: Balance = { total: Money.of(707_100), reserved: Money.of(125_500), available: Money.of(581_600) };

type Prices = [last: number | null, previousClose: number | null];

const holding = (instrumentId: number, quantity: number, cost: number, ...[last, prev]: Prices): Holding => ({
  instrumentId,
  ticker: `T${instrumentId}`,
  name: `Instrumento ${instrumentId}`,
  quantity,
  cost: Money.of(cost),
  lastPrice: last === null ? null : Money.of(last),
  previousClose: prev === null ? null : Money.of(prev),
});

describe('valuePosition', () => {
  it('ejemplo del Spike: 15 acciones con PPC $1.500 que hoy valen $1.800 están +20 %', () => {
    const position = valuePosition(holding(1, 15, 22_500, 1_800, 1_750));

    expect(position.averagePrice.toFixed()).toBe('1500.00');
    expect(position.marketValue?.toFixed()).toBe('27000.00');
    expect(formatPercent(position.totalReturnPct)).toBe('20.00');
    expect(formatPercent(position.dailyReturnPct)).toBe('2.86');
  });

  it('sin cotización no tiene valor ni rendimiento', () => {
    const position = valuePosition(holding(10, 5, 500, null, null));
    expect(position.marketValue).toBeNull();
    expect(position.totalReturnPct).toBeNull();
    expect(position.dailyReturnPct).toBeNull();
    expect(position.averagePrice.toFixed()).toBe('100.00');
  });
});

describe('valuePortfolio', () => {
  it('suma el saldo total (sin restar lo comprometido) y el valor de las posiciones', () => {
    const portfolio = valuePortfolio(balance, [
      holding(47, 40, 37_200, 925.85, 921.8),
      holding(54, 500, 125_000, 229.5, 232),
      holding(31, 20, 30_800, 1502.8, 1520.25),
    ]);

    expect(portfolio.valuationComplete).toBe(true);
    expect(portfolio.totalValue?.toFixed()).toBe('888940.00');
  });

  it('si falta un precio, el total es null y la valuación queda incompleta', () => {
    const portfolio = valuePortfolio(balance, [holding(47, 40, 37_200, 925.85, 921.8), holding(10, 1, 100, null, null)]);

    expect(portfolio.valuationComplete).toBe(false);
    expect(portfolio.totalValue).toBeNull();
    expect(portfolio.positions[0].marketValue?.toFixed()).toBe('37034.00');
  });

  it('sin posiciones, el valor es el saldo total', () => {
    expect(valuePortfolio(balance, []).totalValue?.toFixed()).toBe('707100.00');
  });
});
