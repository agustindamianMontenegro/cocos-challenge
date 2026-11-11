import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { Money } from '@shared/domain/value-objects/money';

type Row = [id: number, instrumentId: number, size: number, price: number, side: string, status: string, type: string, datetime: string];

/** Las 11 órdenes de database.sql, para las pruebas unitarias. */
const ROWS: Row[] = [
  [1, 66, 1_000_000, 1, 'CASH_IN', 'FILLED', 'MARKET', '2023-07-12T12:11:20Z'],
  [2, 47, 50, 930, 'BUY', 'FILLED', 'MARKET', '2023-07-12T12:31:20Z'],
  [3, 47, 50, 920, 'BUY', 'CANCELLED', 'LIMIT', '2023-07-12T14:21:20Z'],
  [4, 47, 10, 940, 'SELL', 'FILLED', 'MARKET', '2023-07-12T14:51:20Z'],
  [5, 45, 50, 710, 'BUY', 'NEW', 'LIMIT', '2023-07-12T15:14:20Z'],
  [6, 47, 100, 950, 'SELL', 'REJECTED', 'MARKET', '2023-07-12T16:11:20Z'],
  [7, 31, 60, 1500, 'BUY', 'NEW', 'LIMIT', '2023-07-13T11:13:20Z'],
  [8, 66, 100_000, 1, 'CASH_OUT', 'FILLED', 'MARKET', '2023-07-13T12:31:20Z'],
  [9, 31, 20, 1540, 'BUY', 'FILLED', 'LIMIT', '2023-07-13T12:51:20Z'],
  [10, 54, 500, 250, 'BUY', 'FILLED', 'MARKET', '2023-07-13T14:11:20Z'],
  [11, 31, 30, 1530, 'SELL', 'FILLED', 'MARKET', '2023-07-13T15:13:20Z'],
];

export function datasetOrders(): LegacyOrder[] {
  return ROWS.map(([id, instrumentId, size, price, side, status, type, datetime]) => ({
    id,
    instrumentId,
    userId: 1,
    size,
    price: Money.of(price),
    side,
    status,
    type,
    datetime: new Date(datetime),
  }));
}
