import { MarketQueriesPort } from '@modules/market/application/ports/in/interfaces/market-queries.port';
import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';
import { InstrumentNotFoundError } from '@modules/market/domain/errors/instrument-not-found.error';
import { Money } from '@shared/domain/value-objects/money';

export const instrument = (id: number, lastPrice: string | null, tradable = true): InstrumentPriceView => ({
  id,
  ticker: `T${id}`,
  name: `Instrumento ${id}`,
  type: tradable ? 'ACCIONES' : 'MONEDA',
  tradable,
  lastPrice: lastPrice === null ? null : Money.of(lastPrice),
  previousClose: null,
  dailyReturnPct: null,
});

export const marketWith = (...instruments: InstrumentPriceView[]): MarketQueriesPort => {
  const byId = new Map(instruments.map((i) => [i.id, i]));
  return {
    getInstrumentPrice: async (id) => {
      const found = byId.get(id);
      if (!found) throw new InstrumentNotFoundError(id);
      return found;
    },
    findInstrumentPrices: async (ids) => new Map(ids.filter((id) => byId.has(id)).map((id) => [id, byId.get(id)!])),
  };
};
