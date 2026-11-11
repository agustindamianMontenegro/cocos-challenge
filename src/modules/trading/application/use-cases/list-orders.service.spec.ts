import { UserNotFoundError } from '@modules/account/domain/errors/user-not-found.error';
import { Order } from '@modules/trading/domain/entities/order';
import { InvalidPageError } from '@shared/domain/errors/invalid-page.error';
import { existingUsers } from '@test/support/doubles/fake-account-queries';
import { FAKE_TX } from '@test/support/doubles/fake-transaction';
import { InMemoryOrderRepository } from '@test/support/doubles/in-memory-order.repository';
import { newOrder } from '@test/support/fixtures/new-order';
import { ORDER_IDS } from '@test/support/fixtures/order-ids';
import { ListOrdersService } from './list-orders.service';

const T0 = new Date('2026-11-10T14:00:00Z');
const minutesLater = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

describe('ListOrdersService', () => {
  let orders: InMemoryOrderRepository;
  let list: ListOrdersService;

  beforeEach(async () => {
    orders = new InMemoryOrderRepository();
    list = new ListOrdersService(orders, existingUsers(1, 2));
    const first = Order.create(newOrder({ id: ORDER_IDS.first }), T0);
    const second = Order.create(newOrder({ id: ORDER_IDS.second, type: 'MARKET' }), minutesLater(1));
    second.fill(minutesLater(1));
    const third = Order.create(newOrder({ id: ORDER_IDS.missing }), minutesLater(2));
    const otherUser = Order.create(newOrder({ id: '01934f7a-5e3f-7a61-8d42-8f6b1cae4d75', userId: 2 }), minutesLater(3));
    for (const order of [first, second, third, otherUser]) {
      await orders.save(FAKE_TX, order);
    }
  });

  it('devuelve las órdenes del usuario, de la más reciente a la más antigua', async () => {
    const page = await list.execute({ userId: 1 });

    expect(page.items.map((o) => o.id)).toEqual([ORDER_IDS.missing, ORDER_IDS.second, ORDER_IDS.first]);
    expect(page).toMatchObject({ total: 3, limit: 20, offset: 0 });
  });

  it('filtra por estado', async () => {
    const page = await list.execute({ userId: 1, status: 'NEW' });

    expect(page.items.map((o) => o.id)).toEqual([ORDER_IDS.missing, ORDER_IDS.first]);
    expect(page.total).toBe(2);
  });

  it('pagina: devuelve la página pedida y el total de todas', async () => {
    const page = await list.execute({ userId: 1, limit: 1, offset: 1 });

    expect(page.items.map((o) => o.id)).toEqual([ORDER_IDS.second]);
    expect(page).toMatchObject({ total: 3, limit: 1, offset: 1 });
  });

  it('un usuario sin órdenes recibe una página vacía', async () => {
    const empty = new ListOrdersService(new InMemoryOrderRepository(), existingUsers(1));
    expect(await empty.execute({ userId: 1 })).toEqual({ items: [], total: 0, limit: 20, offset: 0 });
  });

  it('rechaza un usuario que no existe', async () => {
    await expect(list.execute({ userId: 99 })).rejects.toThrow(UserNotFoundError);
  });

  it.each([{ limit: 0 }, { limit: 51 }, { offset: -1 }])('rechaza una página inválida: %p', async (page) => {
    await expect(list.execute({ userId: 1, ...page })).rejects.toThrow(InvalidPageError);
  });
});
