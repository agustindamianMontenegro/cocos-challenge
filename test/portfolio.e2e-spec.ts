import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AccountsFixture } from './support/fixtures/accounts';
import { uuidv7 } from './support/fixtures/uuid';
import { createTestApp } from './support/setup/app';
import { clearMutableTables } from './support/setup/database';

describe('GET /portfolio/:userId', () => {
  const USER = 2;
  let app: NestFastifyApplication;
  let accounts: AccountsFixture;

  const get = (userId: number | string) => request(app.getHttpServer()).get(`/portfolio/${userId}`);

  beforeAll(async () => {
    app = await createTestApp();
    accounts = new AccountsFixture(app);
  });
  beforeEach(() => clearMutableTables());
  afterAll(() => app.close());

  it('valúa saldo y posiciones al último cierre, con lo comprometido aparte', async () => {
    await accounts.deposit(USER, 50_000);
    await accounts.holding(USER, 47, 40, 930); // PAMP: cierre 925,85; anterior 921,80
    await request(app.getHttpServer())
      .post('/orders')
      .send({ orderId: uuidv7(), userId: USER, instrumentId: 54, side: 'BUY', type: 'LIMIT', size: 10, price: '240.00' })
      .expect(201);

    const response = await get(USER).expect(200);

    expect(response.body).toEqual({
      userId: USER,
      accountNumber: '10002',
      totalValue: '87034.00',
      valuationComplete: true,
      balance: { total: '50000.00', reserved: '2400.00', available: '47600.00' },
      positions: [
        {
          instrumentId: 47,
          ticker: 'PAMP',
          name: 'Pampa Holding S.A.',
          quantity: 40,
          averagePrice: '930.00',
          lastPrice: '925.85',
          marketValue: '37034.00',
          totalReturnPct: '-0.45',
          dailyReturnPct: '0.44',
        },
      ],
    });
  });

  it('si falta una cotización, la posición va sin valor y el total es null', async () => {
    await accounts.holding(USER, 47, 1, 900);
    await accounts.holding(USER, 10, 5, 100); // IRCP no tiene cotizaciones en marketdata.

    const response = await get(USER).expect(200);

    expect(response.body.valuationComplete).toBe(false);
    expect(response.body.totalValue).toBeNull();
    expect(response.body.positions.map((p: { ticker: string }) => p.ticker)).toEqual(['IRCP', 'PAMP']);
    expect(response.body.positions[0]).toMatchObject({
      ticker: 'IRCP',
      quantity: 5,
      averagePrice: '100.00',
      lastPrice: null,
      marketValue: null,
      totalReturnPct: null,
      dailyReturnPct: null,
    });
  });

  it('un usuario que nunca operó tiene todo en cero', async () => {
    const response = await get(3).expect(200);
    expect(response.body).toEqual({
      userId: 3,
      accountNumber: '10003',
      totalValue: '0.00',
      valuationComplete: true,
      balance: { total: '0.00', reserved: '0.00', available: '0.00' },
      positions: [],
    });
  });

  it('404 si el usuario no existe y 400 si el id no es un número', async () => {
    expect((await get(999).expect(404)).body.error.code).toBe('USER_NOT_FOUND');
    await get('abc').expect(400);
  });
});
