import { OrderView } from '@modules/trading/application/ports/in/views/order.view';

/** Una página de órdenes, de la más reciente a la más antigua. */
export interface OrderPageResult {
  items: OrderView[];
  /** Total de órdenes que cumplen el filtro, en todas las páginas. */
  total: number;
  limit: number;
  offset: number;
}
