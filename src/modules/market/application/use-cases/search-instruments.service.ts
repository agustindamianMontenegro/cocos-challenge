import { toInstrumentPriceView } from '@modules/market/application/mappers/instrument-price.mapper';
import { SearchInstrumentsUseCase } from '@modules/market/application/ports/in/interfaces/search-instruments.use-case';
import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';
import { MarketDataRepository } from '@modules/market/application/ports/out/interfaces/market-data.repository.port';
import { InvalidSearchError } from '@modules/market/domain/errors/invalid-search.error';

/** Máximo de resultados por búsqueda. */
export const SEARCH_LIMIT = 50;

export class SearchInstrumentsService implements SearchInstrumentsUseCase {
  constructor(private readonly marketData: MarketDataRepository) {}

  async execute(search: string | undefined): Promise<InstrumentPriceView[]> {
    const term = (search ?? '').trim();
    if (term === '') {
      throw new InvalidSearchError();
    }
    const instruments = await this.marketData.searchInstruments(term, SEARCH_LIMIT);
    const quotes = await this.marketData.latestQuotes(instruments.map((i) => i.id));
    return instruments.map((instrument) => toInstrumentPriceView(instrument, quotes.get(instrument.id)));
  }
}
