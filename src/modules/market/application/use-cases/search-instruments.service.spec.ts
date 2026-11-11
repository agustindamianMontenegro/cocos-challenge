import { InvalidSearchError } from '@modules/market/domain/errors/invalid-search.error';
import { formatPercent } from '@shared/domain/services/percentage';
import { InMemoryMarketDataRepository } from '@test/support/doubles/in-memory-market-data.repository';
import { quote } from '@test/support/fixtures/quote';
import { SEARCH_LIMIT, SearchInstrumentsService } from './search-instruments.service';

const repository = () =>
  new InMemoryMarketDataRepository(
    [
      { id: 50, ticker: 'YPFD', name: 'Y.P.F. S.A.', type: 'ACCIONES' },
      { id: 70, ticker: 'YPFX', name: 'Sin precio', type: 'ACCIONES' },
      { id: 66, ticker: 'ARS', name: 'PESOS', type: 'MONEDA' },
    ],
    [quote(50, '7837.50', '7975.05')],
  );

describe('SearchInstrumentsService', () => {
  it('busca el término sin espacios y devuelve cada instrumento con su cotización', async () => {
    const marketData = repository();
    const results = await new SearchInstrumentsService(marketData).execute('  ypf ');

    expect(marketData.searches).toEqual([['ypf', SEARCH_LIMIT]]);
    expect(results.map((r) => [r.ticker, r.lastPrice?.toFixed() ?? null, formatPercent(r.dailyReturnPct)])).toEqual([
      ['YPFD', '7837.50', '-1.72'],
      ['YPFX', null, null],
    ]);
  });

  it.each([undefined, '', '   '])('rechaza una búsqueda vacía (%p)', async (search) => {
    await expect(new SearchInstrumentsService(repository()).execute(search)).rejects.toThrow(InvalidSearchError);
  });
});
