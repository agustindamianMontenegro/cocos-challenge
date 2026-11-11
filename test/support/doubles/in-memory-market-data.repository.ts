import { MarketDataRepository } from '@modules/market/application/ports/out/interfaces/market-data.repository.port';
import { Instrument } from '@modules/market/domain/types/instrument.interface';
import { Quote } from '@modules/market/domain/value-objects/quote';

/** Datos de mercado en memoria para probar los casos de uso sin base de datos. */
export class InMemoryMarketDataRepository implements MarketDataRepository {
  readonly searches: [string, number][] = [];

  constructor(
    private readonly instruments: Instrument[],
    private readonly quotes: Quote[] = [],
  ) {}

  async searchInstruments(term: string, limit: number): Promise<Instrument[]> {
    this.searches.push([term, limit]);
    const needle = term.toLowerCase();
    return this.instruments.filter(
      (i) => i.type !== 'MONEDA' && `${i.ticker} ${i.name}`.toLowerCase().includes(needle),
    );
  }

  async findInstruments(ids: readonly number[]): Promise<Map<number, Instrument>> {
    return new Map(this.instruments.filter((i) => ids.includes(i.id)).map((i) => [i.id, i]));
  }

  async latestQuotes(ids: readonly number[]): Promise<Map<number, Quote>> {
    return new Map(this.quotes.filter((q) => ids.includes(q.instrumentId)).map((q) => [q.instrumentId, q]));
  }
}

