import { PortfolioView } from '@modules/portfolio/application/ports/in/views/portfolio.view';
import { PositionValuation } from '@modules/portfolio/domain/types/position-valuation.interface';
import { PortfolioResponseDto } from '@modules/portfolio/infrastructure/http/dto/portfolio.response.dto';
import { PositionResponseDto } from '@modules/portfolio/infrastructure/http/dto/position.response.dto';
import { formatPercent } from '@shared/domain/services/percentage';
import { Money } from '@shared/domain/value-objects/money';

export function toPortfolioResponse({ userId, accountNumber, valuation }: PortfolioView): PortfolioResponseDto {
  const { balance } = valuation;
  return {
    userId,
    accountNumber,
    totalValue: fixed(valuation.totalValue),
    valuationComplete: valuation.valuationComplete,
    balance: { total: balance.total.toFixed(), reserved: balance.reserved.toFixed(), available: balance.available.toFixed() },
    positions: valuation.positions.map(toPositionResponse),
  };
}

function toPositionResponse(position: PositionValuation): PositionResponseDto {
  return {
    instrumentId: position.instrumentId,
    ticker: position.ticker,
    name: position.name,
    quantity: position.quantity,
    averagePrice: position.averagePrice.toFixed(),
    lastPrice: fixed(position.lastPrice),
    marketValue: fixed(position.marketValue),
    totalReturnPct: formatPercent(position.totalReturnPct),
    dailyReturnPct: formatPercent(position.dailyReturnPct),
  };
}

function fixed(value: Money | null): string | null {
  return value?.toFixed() ?? null;
}
