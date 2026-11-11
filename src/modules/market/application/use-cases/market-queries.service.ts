import { toInstrumentPriceView } from '@modules/market/application/mappers/instrument-price.mapper';
import { MarketQueriesPort } from '@modules/market/application/ports/in/interfaces/market-queries.port';
import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';
import { MarketDataRepository } from '@modules/market/application/ports/out/interfaces/market-data.repository.port';
import { InstrumentNotFoundError } from '@modules/market/domain/errors/instrument-not-found.error';

export class MarketQueriesService implements MarketQueriesPort {
  constructor(private readonly marketData: MarketDataRepository) {}

  async getInstrumentPrice(instrumentId: number): Promise<InstrumentPriceView> {
    const view = (await this.findInstrumentPrices([instrumentId])).get(instrumentId);
    if (!view) {
      throw new InstrumentNotFoundError(instrumentId);
    }
    return view;
  }

  async findInstrumentPrices(instrumentIds: readonly number[]): Promise<Map<number, InstrumentPriceView>> {
    if (instrumentIds.length === 0) {
      return new Map();
    }
    const [instruments, quotes] = await Promise.all([
      this.marketData.findInstruments(instrumentIds),
      this.marketData.latestQuotes(instrumentIds),
    ]);
    return new Map(
      [...instruments.values()].map((instrument) => [
        instrument.id,
        toInstrumentPriceView(instrument, quotes.get(instrument.id)),
      ]),
    );
  }
}
