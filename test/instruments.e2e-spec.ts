import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { createTestApp } from './support/setup/app';

describe('GET /instruments', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it('busca por ticker sin distinguir mayúsculas y devuelve la última cotización', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=ypf').expect(200);

    expect(response.body).toEqual({
      items: [
        {
          id: 50,
          ticker: 'YPFD',
          name: 'Y.P.F. S.A.',
          type: 'ACCIONES',
          lastPrice: '7837.50',
          previousClose: '7975.05',
          dailyReturnPct: '-1.72',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('busca por parte del nombre', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=GAS').expect(200);
    const tickers = response.body.items.map((i: { ticker: string }) => i.ticker);

    expect(tickers).toEqual(expect.arrayContaining(['METR', 'TGSU2', 'TGNO4', 'GBAN', 'DGCU2']));
  });

  it('no muestra los pesos (tipo MONEDA)', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=pesos').expect(200);
    expect(response.body).toEqual({ items: [], total: 0, limit: 20, offset: 0 });
  });

  it('trata los comodines de SQL como texto', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=%25').expect(200);
    expect(response.body.items).toEqual([]);
  });

  it('a igual fecha usa la cotización de id mayor y no inventa precios faltantes', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=DOME').expect(200);
    // DOME (id 12) tiene open, high y low en NULL el 13/07, pero el cierre del 14/07 existe.
    expect(response.body.items[0]).toMatchObject({ ticker: 'DOME', lastPrice: '20.50' });
  });

  it.each(['/instruments', '/instruments?search=', '/instruments?search=%20%20'])(
    '400 si falta la búsqueda: %s',
    async (url) => {
      const response = await request(app.getHttpServer()).get(url).expect(400);
      expect(response.body).toEqual({
        error: { code: 'INVALID_SEARCH', message: 'Indicá qué buscar: un ticker o parte del nombre.' },
      });
    },
  );

  it('pagina los resultados: las páginas no se superponen y el total es el de todas', async () => {
    const all = await request(app.getHttpServer()).get('/instruments?search=a&limit=50').expect(200);
    const first = await request(app.getHttpServer()).get('/instruments?search=a&limit=5').expect(200);
    const second = await request(app.getHttpServer()).get('/instruments?search=a&limit=5&offset=5').expect(200);
    const tickers = (body: { items: { ticker: string }[] }) => body.items.map((i) => i.ticker);

    expect(first.body).toMatchObject({ total: all.body.total, limit: 5, offset: 0 });
    expect(all.body.total).toBeGreaterThan(10);
    expect([...tickers(first.body), ...tickers(second.body)]).toEqual(tickers(all.body).slice(0, 10));
  });

  it.each([
    ['/instruments?search=a&limit=0', 'INVALID_PAGE'],
    ['/instruments?search=a&limit=51', 'INVALID_PAGE'],
    ['/instruments?search=a&offset=-1', 'INVALID_PAGE'],
    ['/instruments?search=a&limit=abc', 'INVALID_REQUEST'],
  ])('400 si la página no es válida: %s', async (url, code) => {
    const response = await request(app.getHttpServer()).get(url).expect(400);
    expect(response.body.error.code).toBe(code);
  });
});
