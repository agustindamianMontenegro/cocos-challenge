import { InvalidPageError } from '@modules/market/domain/errors/invalid-page.error';
import { InvalidSearchError } from '@modules/market/domain/errors/invalid-search.error';
import { formatPercent } from '@shared/domain/services/percentage';
import { InMemoryMarketDataRepository } from '@test/support/doubles/in-memory-market-data.repository';
import { quote } from '@test/support/fixtures/quote';
import { SearchInstrumentsService } from './search-instruments.service';

const repository = () =>
  new InMemoryMarketDataRepository(
    [
      { id: 50, ticker: 'YPFD', name: 'Y.P.F. S.A.', type: 'ACCIONES' },
      { id: 70, ticker: 'YPFX', name: 'Sin precio', type: 'ACCIONES' },
      { id: 71, ticker: 'YPFZ', name: 'Otra', type: 'ACCIONES' },
      { id: 66, ticker: 'ARS', name: 'PESOS', type: 'MONEDA' },
    ],
    [quote(50, '7837.50', '7975.05')],
  );

describe('SearchInstrumentsService', () => {
  it('busca el término sin espacios y devuelve cada instrumento con su cotización', async () => {
    const marketData = repository();
    const page = await new SearchInstrumentsService(marketData).execute({ search: '  ypf ' });

    expect(marketData.searches).toEqual([['ypf', { limit: 20, offset: 0 }]]);
    expect(page.items.map((r) => [r.ticker, r.lastPrice?.toFixed() ?? null, formatPercent(r.dailyReturnPct)])).toEqual([
      ['YPFD', '7837.50', '-1.72'],
      ['YPFX', null, null],
      ['YPFZ', null, null],
    ]);
    expect(page).toMatchObject({ total: 3, limit: 20, offset: 0 });
  });

  it('devuelve la página pedida y el total de coincidencias', async () => {
    const page = await new SearchInstrumentsService(repository()).execute({ search: 'ypf', limit: 1, offset: 1 });

    expect(page.items.map((r) => r.ticker)).toEqual(['YPFX']);
    expect(page).toMatchObject({ total: 3, limit: 1, offset: 1 });
  });

  it('una página después del final viene vacía, con el total igual', async () => {
    const page = await new SearchInstrumentsService(repository()).execute({ search: 'ypf', offset: 10 });
    expect(page).toEqual({ items: [], total: 3, limit: 20, offset: 10 });
  });

  it.each([undefined, '', '   '])('rechaza una búsqueda vacía (%p)', async (search) => {
    await expect(new SearchInstrumentsService(repository()).execute({ search })).rejects.toThrow(InvalidSearchError);
  });

  it.each([
    { limit: 0 },
    { limit: 51 },
    { offset: -1 },
  ])('rechaza una página inválida: %p', async (page) => {
    await expect(new SearchInstrumentsService(repository()).execute({ search: 'ypf', ...page })).rejects.toThrow(
      InvalidPageError,
    );
  });
});
