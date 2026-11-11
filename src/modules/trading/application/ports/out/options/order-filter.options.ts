import { OrderStatus } from '@modules/trading/domain/types/order.types';

/** Qué órdenes buscar: las de un usuario y, si se indica, solo las de un estado. */
export interface OrderFilterOptions {
  userId: number;
  status?: OrderStatus;
}
