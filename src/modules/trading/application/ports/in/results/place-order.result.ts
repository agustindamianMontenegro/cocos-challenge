import { OrderView } from '@modules/trading/application/ports/in/views/order.view';

/** Resultado de enviar una orden. */
export interface PlaceOrderResult {
  order: OrderView;
  /** false si era un reintento y se devolvió la orden que ya existía. */
  created: boolean;
}
