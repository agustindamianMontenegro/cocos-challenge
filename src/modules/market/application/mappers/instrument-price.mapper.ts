import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';
import { isCurrency } from '@modules/market/domain/services/currency';
import { Instrument } from '@modules/market/domain/types/instrument.interface';
import { Quote } from '@modules/market/domain/value-objects/quote';

export function toInstrumentPriceView(instrument: Instrument, quote: Quote | undefined): InstrumentPriceView {
  return {
    ...instrument,
    tradable: !isCurrency(instrument),
    lastPrice: quote?.close ?? null,
    previousClose: quote?.previousClose ?? null,
    dailyReturnPct: quote?.dailyReturnPct() ?? null,
  };
}
