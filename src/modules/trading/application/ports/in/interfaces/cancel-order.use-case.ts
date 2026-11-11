import { OrderView } from '@modules/trading/application/ports/in/views/order.view';

/** Puerto de entrada: cancelar una orden NEW y liberar lo comprometido. */
export interface CancelOrderUseCase {
  execute(orderId: string): Promise<OrderView>;
}

