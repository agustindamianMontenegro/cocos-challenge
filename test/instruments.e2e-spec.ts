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

    expect(response.body).toEqual([
      {
        id: 50,
        ticker: 'YPFD',
        name: 'Y.P.F. S.A.',
        type: 'ACCIONES',
        lastPrice: '7837.50',
        previousClose: '7975.05',
        dailyReturnPct: '-1.72',
      },
    ]);
  });

  it('busca por parte del nombre', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=GAS').expect(200);
    const tickers = response.body.map((i: { ticker: string }) => i.ticker);

    expect(tickers).toEqual(expect.arrayContaining(['METR', 'TGSU2', 'TGNO4', 'GBAN', 'DGCU2']));
  });

  it('no muestra los pesos (tipo MONEDA)', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=pesos').expect(200);
    expect(response.body).toEqual([]);
  });

  it('trata los comodines de SQL como texto', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=%25').expect(200);
    expect(response.body).toEqual([]);
  });

  it('a igual fecha usa la cotización de id mayor y no inventa precios faltantes', async () => {
    const response = await request(app.getHttpServer()).get('/instruments?search=DOME').expect(200);
    // DOME (id 12) tiene open, high y low en NULL el 13/07, pero el cierre del 14/07 existe.
    expect(response.body[0]).toMatchObject({ ticker: 'DOME', lastPrice: '20.50' });
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
});
