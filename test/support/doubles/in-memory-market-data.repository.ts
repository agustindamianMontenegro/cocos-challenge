import { MarketDataRepository } from '@modules/market/application/ports/out/interfaces/market-data.repository.port';
import { PageOptions } from '@shared/application/ports/out/options/page.options';
import { InstrumentSearchRecord } from '@modules/market/application/ports/out/records/instrument-search.record';
import { Instrument } from '@modules/market/domain/types/instrument.interface';
import { Quote } from '@modules/market/domain/value-objects/quote';

/** Datos de mercado en memoria para probar los casos de uso sin base de datos. */
export class InMemoryMarketDataRepository implements MarketDataRepository {
  readonly searches: [string, PageOptions][] = [];

  constructor(
    private readonly instruments: Instrument[],
    private readonly quotes: Quote[] = [],
  ) {}

  async searchInstruments(term: string, page: PageOptions): Promise<InstrumentSearchRecord> {
    this.searches.push([term, page]);
    const needle = term.toLowerCase();
    const matches = this.instruments
      .filter((i) => i.type !== 'MONEDA' && `${i.ticker} ${i.name}`.toLowerCase().includes(needle))
      .sort((a, b) => a.ticker.localeCompare(b.ticker) || a.id - b.id);
    return { instruments: matches.slice(page.offset, page.offset + page.limit), total: matches.length };
  }

  async findInstruments(ids: readonly number[]): Promise<Map<number, Instrument>> {
    return new Map(this.instruments.filter((i) => ids.includes(i.id)).map((i) => [i.id, i]));
  }

  async latestQuotes(ids: readonly number[]): Promise<Map<number, Quote>> {
    return new Map(this.quotes.filter((q) => ids.includes(q.instrumentId)).map((q) => [q.instrumentId, q]));
  }
}

