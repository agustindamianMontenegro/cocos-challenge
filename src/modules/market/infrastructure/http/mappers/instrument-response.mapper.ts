import { InstrumentPageResult } from '@modules/market/application/ports/in/results/instrument-page.result';
import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';
import { InstrumentPageResponseDto } from '@modules/market/infrastructure/http/dto/instrument-page.response.dto';
import { InstrumentResponseDto } from '@modules/market/infrastructure/http/dto/instrument.response.dto';
import { formatPercent } from '@shared/domain/services/percentage';

export function toInstrumentPageResponse(page: InstrumentPageResult): InstrumentPageResponseDto {
  return { items: page.items.map(toInstrumentResponse), total: page.total, limit: page.limit, offset: page.offset };
}

export function toInstrumentResponse(view: InstrumentPriceView): InstrumentResponseDto {
  return {
    id: view.id,
    ticker: view.ticker,
    name: view.name,
    type: view.type,
    lastPrice: view.lastPrice?.toFixed() ?? null,
    previousClose: view.previousClose?.toFixed() ?? null,
    dailyReturnPct: formatPercent(view.dailyReturnPct),
  };
}
