import { toInstrumentPriceView } from '@modules/market/application/mappers/instrument-price.mapper';
import { SearchInstrumentsCommand } from '@modules/market/application/ports/in/commands/search-instruments.command';
import { SearchInstrumentsUseCase } from '@modules/market/application/ports/in/interfaces/search-instruments.use-case';
import { InstrumentPageResult } from '@modules/market/application/ports/in/results/instrument-page.result';
import { MarketDataRepository } from '@modules/market/application/ports/out/interfaces/market-data.repository.port';
import { resolvePage } from '@shared/application/services/page';
import { InvalidSearchError } from '@modules/market/domain/errors/invalid-search.error';

export class SearchInstrumentsService implements SearchInstrumentsUseCase {
  constructor(private readonly marketData: MarketDataRepository) {}

  async execute(command: SearchInstrumentsCommand): Promise<InstrumentPageResult> {
    const term = (command.search ?? '').trim();
    if (term === '') {
      throw new InvalidSearchError();
    }
    const page = resolvePage(command.limit, command.offset);
    const { instruments, total } = await this.marketData.searchInstruments(term, page);
    const quotes = await this.marketData.latestQuotes(instruments.map((i) => i.id));
    const items = instruments.map((instrument) => toInstrumentPriceView(instrument, quotes.get(instrument.id)));
    return { items, total, ...page };
  }
}
