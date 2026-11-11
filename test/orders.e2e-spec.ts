import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { DataSource, EntityManager } from 'typeorm';
import { AccountEventSchema } from '@modules/account/infrastructure/persistence/schemas/account-event.schema';
import { OrderSchema } from '@modules/trading/infrastructure/persistence/schemas/order.schema';
import { AccountsFixture } from './support/fixtures/accounts';
import { uuidv7 } from './support/fixtures/uuid';
import { createTestApp } from './support/setup/app';
import { clearMutableTables } from './support/setup/database';

/**
 * Test funcional del envío de órdenes (lo que pide el challenge), contra la API
 * completa y PostgreSQL real. PAMP (47) cierra a $925,85 y METR (54) a $229,50.
 */
describe('Órdenes', () => {
  const USER = 2;
  const PAMP = 47;
  const METR = 54;
  let app: NestFastifyApplication;
  let accounts: AccountsFixture;
  let db: EntityManager;

  const post = (body: object) => request(app.getHttpServer()).post('/orders').send(body);
  const cancel = (id: string) => request(app.getHttpServer()).patch(`/orders/${id}/cancel`);
  const marketBuy = (extra: object = {}) => ({
    orderId: uuidv7(),
    userId: USER,
    instrumentId: PAMP,
    side: 'BUY',
    type: 'MARKET',
    size: 10,
    ...extra,
  });

  beforeAll(async () => {
    app = await createTestApp();
    accounts = new AccountsFixture(app);
    db = app.get(DataSource).manager;
  });
  beforeEach(() => clearMutableTables());
  afterAll(() => app.close());

  describe('MARKET', () => {
    it('compra por cantidad al último cierre y descuenta el saldo', async () => {
      await accounts.deposit(USER, 100_000);
      const body = marketBuy();

      const response = await post(body).expect(201);

      expect(response.body).toMatchObject({
        id: body.orderId,
        userId: USER,
        instrumentId: PAMP,
        side: 'BUY',
        type: 'MARKET',
        size: 10,
        price: '925.85',
        status: 'FILLED',
        rejectionReason: null,
      });
      expect(response.body.createdAt).toBe(response.body.updatedAt);
      const account = await accounts.load(USER);
      expect(account.totalCash().toFixed()).toBe('90741.50');
      expect(account.sharesOf(PAMP)).toBe(10);
    });

    it('compra por monto: floor(10000 / 925,85) = 10 acciones', async () => {
      await accounts.deposit(USER, 100_000);
      const response = await post(marketBuy({ size: undefined, amount: '10000.00' })).expect(201);
      expect(response.body).toMatchObject({ size: 10, status: 'FILLED' });
    });

    it('vende y acredita el importe', async () => {
      await accounts.holding(USER, PAMP, 40, 900);
      await post(marketBuy({ side: 'SELL', size: 15 })).expect(201);
      const account = await accounts.load(USER);
      expect(account.sharesOf(PAMP)).toBe(25);
      expect(account.positions().get(PAMP)?.averagePrice().toFixed()).toBe('900.00');
    });

    it('rechaza una venta sin acciones suficientes: se guarda REJECTED y la cuenta no cambia', async () => {
      await accounts.holding(USER, PAMP, 40, 900);
      const before = await accounts.load(USER);

      const response = await post(marketBuy({ side: 'SELL', size: 100 })).expect(201);

      expect(response.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_SHARES' });
      expect((await accounts.load(USER)).toSnapshot()).toEqual(before.toSnapshot());
      expect(await db.countBy(OrderSchema, { id: response.body.id, status: 'REJECTED' })).toBe(1);
    });

    it('rechaza una compra sin saldo suficiente', async () => {
      await accounts.deposit(USER, 1_000);
      const response = await post(marketBuy()).expect(201);
      expect(response.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_FUNDS' });
    });

    it('dos compras simultáneas de $80.000 con $100.000: una se ejecuta y la otra se rechaza', async () => {
      await accounts.deposit(USER, 100_000);
      const buy = () => post(marketBuy({ size: undefined, amount: '80000.00' }));

      const responses = await Promise.all([buy(), buy()]);

      expect(responses.map((r) => r.status)).toEqual([201, 201]);
      expect(responses.map((r) => r.body.status).sort()).toEqual(['FILLED', 'REJECTED']);
      expect((await accounts.load(USER)).sharesOf(PAMP)).toBe(86);
    });
  });

  describe('LIMIT', () => {
    const limitBuy = (extra: object = {}) =>
      marketBuy({ instrumentId: METR, type: 'LIMIT', size: 10, price: '240.00', ...extra });

    it('queda NEW y compromete cantidad por precio límite sin bajar el total', async () => {
      await accounts.deposit(USER, 10_000);

      const response = await post(limitBuy()).expect(201);

      expect(response.body).toMatchObject({ status: 'NEW', price: '240.00', size: 10 });
      const account = await accounts.load(USER);
      expect(account.totalCash().toFixed()).toBe('10000.00');
      expect(account.reservedCash().toFixed()).toBe('2400.00');
      expect(account.availableCash().toFixed()).toBe('7600.00');
    });

    it('por monto calcula la cantidad con el precio límite', async () => {
      await accounts.deposit(USER, 10_000);
      const response = await post(limitBuy({ size: undefined, amount: '1000.00' })).expect(201);
      expect(response.body).toMatchObject({ status: 'NEW', size: 4 });
    });

    it('lo comprometido no se puede volver a gastar', async () => {
      await accounts.deposit(USER, 10_000);
      await post(limitBuy({ size: 40 })).expect(201);

      const response = await post(marketBuy({ size: 1 })).expect(201);
      expect(response.body.rejectionReason).toBe('INSUFFICIENT_FUNDS');
    });

    it('una venta LIMIT compromete las acciones', async () => {
      await accounts.holding(USER, PAMP, 40, 900);
      await post(marketBuy({ side: 'SELL', type: 'LIMIT', size: 30, price: '990.00' })).expect(201);

      const response = await post(marketBuy({ side: 'SELL', size: 11 })).expect(201);
      expect(response.body.rejectionReason).toBe('INSUFFICIENT_SHARES');
      expect((await accounts.load(USER)).availableShares(PAMP)).toBe(10);
    });

    it('rechaza una LIMIT si no alcanza el saldo', async () => {
      await accounts.deposit(USER, 100);
      const response = await post(limitBuy()).expect(201);
      expect(response.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_FUNDS' });
    });
  });

  describe('Listado', () => {
    const list = (query: string) => request(app.getHttpServer()).get(`/orders?${query}`);

    it('lista las órdenes del usuario, de la más reciente a la más antigua, con el total', async () => {
      await accounts.deposit(USER, 100_000);
      const market = await post(marketBuy()).expect(201);
      const limit = await post(marketBuy({ type: 'LIMIT', price: '900.00' })).expect(201);

      const response = await list(`userId=${USER}`).expect(200);

      expect(response.body).toMatchObject({ total: 2, limit: 20, offset: 0 });
      expect(response.body.items.map((o: { id: string }) => o.id)).toEqual([limit.body.id, market.body.id]);
      expect(response.body.items[0]).toEqual(limit.body);
    });

    it('filtra por estado y pagina sin superponer páginas', async () => {
      await accounts.deposit(USER, 100_000);
      for (let i = 0; i < 3; i++) {
        await post(marketBuy({ type: 'LIMIT', price: '900.00' })).expect(201);
      }
      await post(marketBuy()).expect(201);

      const pending = await list(`userId=${USER}&status=NEW`).expect(200);
      const first = await list(`userId=${USER}&status=NEW&limit=2`).expect(200);
      const second = await list(`userId=${USER}&status=NEW&limit=2&offset=2`).expect(200);
      const ids = (body: { items: { id: string }[] }) => body.items.map((o) => o.id);

      expect(pending.body.total).toBe(3);
      expect(pending.body.items.every((o: { status: string }) => o.status === 'NEW')).toBe(true);
      expect([...ids(first.body), ...ids(second.body)]).toEqual(ids(pending.body));
    });

    it('un usuario sin órdenes recibe una lista vacía', async () => {
      const response = await list(`userId=${USER}`).expect(200);
      expect(response.body).toEqual({ items: [], total: 0, limit: 20, offset: 0 });
    });

    it('404 si el usuario no existe', async () => {
      const response = await list('userId=999').expect(404);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it.each([
      ['falta userId', '', 'INVALID_REQUEST'],
      ['el estado no existe', `userId=${USER}&status=PENDING`, 'INVALID_REQUEST'],
      ['limit fuera de rango', `userId=${USER}&limit=51`, 'INVALID_PAGE'],
    ])('400 si %s', async (_name, query, code) => {
      const response = await list(query).expect(400);
      expect(response.body.error.code).toBe(code);
    });
  });

  describe('Cancelación', () => {
    it('cancela una LIMIT NEW, libera lo comprometido y actualiza la fecha del último cambio', async () => {
      await accounts.deposit(USER, 10_000);
      const placed = await post(marketBuy({ instrumentId: METR, type: 'LIMIT', price: '240.00' })).expect(201);

      const response = await cancel(placed.body.id).expect(200);

      expect(response.body).toMatchObject({ id: placed.body.id, status: 'CANCELLED' });
      expect(response.body.createdAt).toBe(placed.body.createdAt);
      expect(new Date(response.body.updatedAt) >= new Date(placed.body.updatedAt)).toBe(true);
      expect((await accounts.load(USER)).availableCash().toFixed()).toBe('10000.00');
    });

    it('409 si la orden no está NEW (cancelada dos veces o ya ejecutada)', async () => {
      await accounts.deposit(USER, 100_000);
      const limit = await post(marketBuy({ type: 'LIMIT', price: '900.00' })).expect(201);
      await cancel(limit.body.id).expect(200);
      const filled = await post(marketBuy()).expect(201);

      for (const id of [limit.body.id, filled.body.id]) {
        const response = await cancel(id).expect(409);
        expect(response.body).toEqual({
          error: { code: 'ORDER_NOT_CANCELLABLE', message: 'Solo se pueden cancelar órdenes en estado NEW.' },
        });
      }
    });

    it('dos cancelaciones simultáneas: una sola libera', async () => {
      await accounts.deposit(USER, 10_000);
      const placed = await post(marketBuy({ type: 'LIMIT', price: '900.00' })).expect(201);

      const statuses = (await Promise.all([cancel(placed.body.id), cancel(placed.body.id)])).map((r) => r.status);

      expect(statuses.sort()).toEqual([200, 409]);
      expect(await db.countBy(AccountEventSchema, { userId: USER, type: 'ReservationReleased' })).toBe(1);
    });

    it('404 si la orden no existe y 400 si el id no es un UUID', async () => {
      const missing = await cancel(uuidv7()).expect(404);
      expect(missing.body.error.code).toBe('ORDER_NOT_FOUND');
      await cancel('no-es-un-uuid').expect(400);
    });
  });

  describe('Reintentos con el mismo orderId', () => {
    it('mismos datos: 200 con la orden existente y no se ejecuta de nuevo', async () => {
      await accounts.deposit(USER, 100_000);
      const body = marketBuy();
      const first = await post(body).expect(201);

      const retry = await post({ ...body }).expect(200);

      expect(retry.body).toEqual(first.body);
      expect((await accounts.load(USER)).sharesOf(PAMP)).toBe(10);
    });

    it('un rechazo también se devuelve igual al reintentar', async () => {
      const body = marketBuy();
      const first = await post(body).expect(201);
      await accounts.deposit(USER, 100_000);

      const retry = await post(body).expect(200);
      expect(retry.body).toEqual(first.body);
      expect(retry.body.status).toBe('REJECTED');
    });

    it('datos distintos: 409', async () => {
      await accounts.deposit(USER, 100_000);
      const body = marketBuy();
      await post(body).expect(201);

      const response = await post({ ...body, size: 11 }).expect(409);
      expect(response.body.error.code).toBe('ORDER_ID_CONFLICT');
    });
  });

  describe('Validaciones', () => {
    it.each([
      ['size y amount juntos', { amount: '1000.00' }],
      ['sin size ni amount', { size: undefined }],
      ['size cero', { size: 0 }],
      ['size con decimales', { size: 1.5 }],
      ['price en una MARKET', { price: '900.00' }],
      ['LIMIT sin price', { type: 'LIMIT' }],
      ['price cero', { type: 'LIMIT', price: '0' }],
      ['monto que no alcanza para una acción', { size: undefined, amount: '100.00' }],
      ['importe con tres decimales', { size: undefined, amount: '100.001' }],
      ['importe numérico en lugar de texto', { size: undefined, amount: 1000 }],
      ['orderId que no es UUIDv7', { orderId: '6f1c2a3e-9b0d-4c1e-8f2a-3b4c5d6e7f80' }],
      ['side inválido', { side: 'CASH_IN' }],
      ['campo desconocido', { foo: 'bar' }],
      ['pesos como instrumento', { instrumentId: 66 }],
    ])('400: %s', async (_name, change) => {
      await accounts.deposit(USER, 100_000);
      const response = await post(marketBuy(change)).expect(400);
      expect(response.body.error.message).toEqual(expect.any(String));
      expect(await db.count(OrderSchema)).toBe(0);
    });

    it('los mensajes de validación salen en español', async () => {
      const response = await post(marketBuy({ foo: 'bar', size: 'diez' })).expect(400);
      expect(response.body.error).toEqual({
        code: 'INVALID_REQUEST',
        message: 'El campo foo no está permitido.; size tiene que ser un entero.',
      });
    });

    it('400 si el JSON está mal formado', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Content-Type', 'application/json')
        .send('{"orderId":')
        .expect(400)
        .expect(({ body }) =>
          expect(body.error.message).toBe('No se pudo leer el pedido: el cuerpo tiene que ser un JSON válido.'),
        );
    });

    it('409 si el instrumento no tiene cotización para una MARKET (IRCP)', async () => {
      await accounts.deposit(USER, 100_000);
      const response = await post(marketBuy({ instrumentId: 10 })).expect(409);
      expect(response.body.error.code).toBe('PRICE_UNAVAILABLE');
    });

    it.each([
      ['el usuario', { userId: 999 }, 'USER_NOT_FOUND'],
      ['el instrumento', { instrumentId: 999 }, 'INSTRUMENT_NOT_FOUND'],
    ])('404 si no existe %s', async (_name, change, code) => {
      const response = await post(marketBuy(change)).expect(404);
      expect(response.body.error.code).toBe(code);
    });
  });
});
