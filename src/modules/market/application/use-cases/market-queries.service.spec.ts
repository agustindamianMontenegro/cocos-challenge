import { InstrumentNotFoundError } from '@modules/market/domain/errors/instrument-not-found.error';
import { InMemoryMarketDataRepository } from '@test/support/doubles/in-memory-market-data.repository';
import { quote } from '@test/support/fixtures/quote';
import { MarketQueriesService } from './market-queries.service';

const service = new MarketQueriesService(
  new InMemoryMarketDataRepository(
    [
      { id: 47, ticker: 'PAMP', name: 'Pampa Holding S.A.', type: 'ACCIONES' },
      { id: 10, ticker: 'IRCP', name: 'IRSA Propiedades Comerciales S.A.', type: 'ACCIONES' },
      { id: 66, ticker: 'ARS', name: 'PESOS', type: 'MONEDA' },
    ],
    [quote(47, '925.85', '921.80')],
  ),
);

describe('MarketQueriesService', () => {
  it('devuelve el instrumento con su último cierre', async () => {
    const view = await service.getInstrumentPrice(47);
    expect(view).toMatchObject({ ticker: 'PAMP', tradable: true });
    expect(view.lastPrice?.toFixed()).toBe('925.85');
  });

  it('los pesos no se pueden operar y un instrumento sin cotización no tiene precio', async () => {
    expect((await service.getInstrumentPrice(66)).tradable).toBe(false);
    expect((await service.getInstrumentPrice(10)).lastPrice).toBeNull();
  });

  it('lanza InstrumentNotFoundError si no existe', async () => {
    await expect(service.getInstrumentPrice(999)).rejects.toThrow(InstrumentNotFoundError);
  });

  it('busca varios a la vez y omite los que no existen', async () => {
    expect([...(await service.findInstrumentPrices([47, 999, 10])).keys()].sort()).toEqual([10, 47]);
    expect((await service.findInstrumentPrices([])).size).toBe(0);
  });
});
