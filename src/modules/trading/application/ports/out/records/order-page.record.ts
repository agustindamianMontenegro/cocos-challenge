import { Order } from '@modules/trading/domain/entities/order';

/** Una página de órdenes y el total que cumple el filtro. */
export interface OrderPageRecord {
  orders: Order[];
  total: number;
}
