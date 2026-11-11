import { Balance } from '@modules/portfolio/domain/types/balance.interface';
import { Holding } from '@modules/portfolio/domain/types/holding.interface';
import { PortfolioValuation } from '@modules/portfolio/domain/types/portfolio-valuation.interface';
import { PositionValuation } from '@modules/portfolio/domain/types/position-valuation.interface';
import { percentChange } from '@shared/domain/services/percentage';
import { Money } from '@shared/domain/value-objects/money';

/**
 * Valor de una posición: cantidad por último cierre.
 * Rendimiento total: contra lo que costaron las acciones que quedan (cantidad por PPC).
 * Rendimiento del día: último cierre contra el cierre anterior.
 */
export function valuePosition(holding: Holding): PositionValuation {
  const { lastPrice, previousClose, cost, quantity } = holding;
  const marketValue = lastPrice?.times(quantity) ?? null;
  return {
    instrumentId: holding.instrumentId,
    ticker: holding.ticker,
    name: holding.name,
    quantity,
    averagePrice: cost.dividedBy(quantity),
    lastPrice,
    marketValue,
    totalReturnPct: marketValue ? percentChange(marketValue, cost) : null,
    dailyReturnPct: lastPrice && previousClose ? percentChange(lastPrice, previousClose) : null,
  };
}

/** Lo comprometido no se resta del valor total: sigue siendo plata del usuario. */
export function valuePortfolio(balance: Balance, holdings: readonly Holding[]): PortfolioValuation {
  const positions = holdings.map(valuePosition);
  const marketValues = positions.map((p) => p.marketValue).filter((value): value is Money => value !== null);
  const valuationComplete = marketValues.length === positions.length;
  const totalValue = valuationComplete ? marketValues.reduce((sum, value) => sum.plus(value), balance.total) : null;
  return { totalValue, valuationComplete, balance, positions };
}
