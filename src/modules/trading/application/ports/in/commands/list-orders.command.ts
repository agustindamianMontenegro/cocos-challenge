import { OrderStatus } from '@modules/trading/domain/types/order.types';

/** Órdenes de un usuario, opcionalmente de un estado. Sin limit u offset se usan los valores por defecto. */
export interface ListOrdersCommand {
  userId: number;
  status?: OrderStatus;
  /** Cuántas órdenes devolver (1 a 50; por defecto, 20). */
  limit?: number;
  /** Cuántas órdenes saltear desde la más reciente (por defecto, 0). */
  offset?: number;
}
